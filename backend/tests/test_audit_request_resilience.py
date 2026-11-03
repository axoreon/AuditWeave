import json
import socket

import pytest
import requests
from fastapi import HTTPException

from app import main as main_module
from app.schemas import AuditRequest
from app.services import gemini, retrieval, text_extractor


class FakeResponse:
    def __init__(self, status_code=200, body=b"", headers=None):
        self.status_code = status_code
        self.body = body
        self.headers = headers or {}
        self.encoding = "utf-8"
        self.closed = False

    @property
    def is_redirect(self):
        return self.status_code in {301, 302, 303, 307, 308}

    @property
    def is_permanent_redirect(self):
        return self.status_code in {301, 308}

    def iter_content(self, chunk_size):
        yield self.body

    def close(self):
        self.closed = True


def public_dns(*args, **kwargs):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443))]


def configure_retrieval_fixture(monkeypatch, tmp_path):
    chunks_path = tmp_path / "chunks.json"
    chunks_path.write_text(json.dumps([
        {"section": "Consent", "text": "consent notice rights", "embedding": [1.0, 0.0]},
        {"section": "Grievance", "text": "grievance officer contact", "embedding": [0.0, 1.0]},
    ]), encoding="utf-8")
    monkeypatch.setattr(retrieval, "JSON_PATH", str(chunks_path))
    monkeypatch.setattr(retrieval, "build_knowledge_base_if_needed", lambda: None)
    monkeypatch.setattr(retrieval, "api_key", "configured")


def test_embedding_success_uses_supported_model_and_bounded_timeout(monkeypatch, tmp_path):
    configure_retrieval_fixture(monkeypatch, tmp_path)
    captured = {}

    def embed_content(**kwargs):
        captured.update(kwargs)
        return {"embedding": [1.0, 0.0]}

    monkeypatch.setattr(retrieval.genai, "embed_content", embed_content)
    result = retrieval.retrieve_relevant_sections("consent", top_k=1)

    assert result[0]["section"] == "Consent"
    assert "similarity" in result[0]
    assert captured["model"] == "models/gemini-embedding-001"
    assert captured["output_dimensionality"] == 768
    assert captured["request_options"] == {"timeout": 10}


def test_embedding_failure_uses_keyword_fallback(monkeypatch, tmp_path):
    configure_retrieval_fixture(monkeypatch, tmp_path)
    monkeypatch.setattr(
        retrieval.genai,
        "embed_content",
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError("embedding unavailable")),
    )

    result = retrieval.retrieve_relevant_sections("grievance officer", top_k=1)

    assert result[0]["section"] == "Grievance"
    assert "similarity" not in result[0]


def test_url_extraction_failure_never_returns_fabricated_policy(monkeypatch):
    monkeypatch.setattr(text_extractor.socket, "getaddrinfo", public_dns)
    monkeypatch.setattr(
        text_extractor.requests,
        "get",
        lambda *args, **kwargs: FakeResponse(status_code=503),
    )

    with pytest.raises(text_extractor.URLExtractionError):
        text_extractor.extract_text_from_url("https://public.example/privacy")


def test_insufficient_direct_and_reader_text_fails_honestly(monkeypatch):
    monkeypatch.setattr(text_extractor.socket, "getaddrinfo", public_dns)
    monkeypatch.setattr(
        text_extractor.requests,
        "get",
        lambda *args, **kwargs: FakeResponse(body=b"<main>Too short</main>"),
    )

    with pytest.raises(text_extractor.URLExtractionError, match="could not be extracted"):
        text_extractor.extract_text_from_url("https://public.example/privacy")


def test_url_fetch_timeout_is_bounded_and_actionable(monkeypatch):
    monkeypatch.setattr(text_extractor.socket, "getaddrinfo", public_dns)
    monkeypatch.setattr(
        text_extractor.requests,
        "get",
        lambda *args, **kwargs: (_ for _ in ()).throw(requests.Timeout()),
    )

    with pytest.raises(text_extractor.URLFetchTimeout, match="timed out"):
        text_extractor.extract_text_from_url("https://public.example/privacy")


@pytest.mark.parametrize("url", [
    "http://127.0.0.1/private",
    "http://169.254.169.254/latest/meta-data",
    "http://10.0.0.1/private",
])
def test_private_and_internal_urls_are_blocked(url):
    with pytest.raises(text_extractor.UnsafePolicyURLError):
        text_extractor._normalize_and_validate_public_url(url)


def test_redirect_to_private_target_is_blocked(monkeypatch):
    def redirect_dns(host, *args, **kwargs):
        address = "127.0.0.1" if host == "127.0.0.1" else "93.184.216.34"
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, 443))]

    monkeypatch.setattr(text_extractor.socket, "getaddrinfo", redirect_dns)
    response = FakeResponse(status_code=302, headers={"Location": "http://127.0.0.1/admin"})
    monkeypatch.setattr(text_extractor.requests, "get", lambda *args, **kwargs: response)

    with pytest.raises(text_extractor.UnsafePolicyURLError):
        text_extractor._fetch_public_text(
            "https://public.example/privacy", headers=None, deadline_seconds=1
        )
    assert response.closed is True


def test_gemini_failure_uses_deterministic_fallback_with_timeout(monkeypatch):
    captured = {}

    class FailingModel:
        def generate_content(self, prompt, **kwargs):
            captured.update(kwargs)
            raise TimeoutError("model timed out")

    monkeypatch.setattr(gemini, "HAS_GEMINI_KEY", True)
    monkeypatch.setattr(gemini.genai, "GenerativeModel", lambda *args, **kwargs: FailingModel())
    monkeypatch.setattr(retrieval, "retrieve_relevant_sections", lambda *args, **kwargs: [])

    result = gemini.analyze_policy_with_gemini(
        "Example", "SaaS", "privacy policy " * 20, {}
    )

    assert result["overall_summary"]
    assert result["findings"]
    assert captured["request_options"] == {"timeout": 35}


def test_extraction_failure_happens_before_credit_or_database_mutation(monkeypatch):
    touched = {"credit": False}

    def fail_extraction(url):
        raise HTTPException(status_code=422, detail="Policy extraction failed")

    def reserve(*args, **kwargs):
        touched["credit"] = True
        raise AssertionError("credit reservation must not run")

    class NoDatabaseAccess:
        def __getattr__(self, name):
            raise AssertionError(f"database must not be touched: {name}")

    monkeypatch.setattr(main_module, "extract_policy_url_or_http_error", fail_extraction)
    monkeypatch.setattr(main_module, "reserve_user_audit_credits", reserve)

    with pytest.raises(HTTPException) as exc:
        main_module.audit_policy(
            AuditRequest(company_name="Example", industry="SaaS", policy_url="https://public.example"),
            object(),
            NoDatabaseAccess(),
            object(),
        )

    assert exc.value.status_code == 422
    assert touched["credit"] is False
