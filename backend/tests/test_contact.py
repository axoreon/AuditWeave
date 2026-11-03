from __future__ import annotations

import os
import sys

import pytest
import resend
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import main as main_module


VALID_CONTACT = {
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "topic": "feedback",
    "message": "I would like help with AuditWeave.",
}


@pytest.fixture(autouse=True)
def configured_contact_service(monkeypatch):
    main_module.contact_rate_limits.clear()
    monkeypatch.setattr(main_module, "RESEND_API_KEY", "re_test_key")
    monkeypatch.setattr(main_module, "CONTACT_ADMIN_EMAIL", "support@example.com")
    monkeypatch.setattr(main_module, "CONTACT_FROM_EMAIL", "AuditWeave <noreply@example.com>")
    yield
    main_module.contact_rate_limits.clear()


def test_anonymous_valid_contact_is_accepted_and_normalized(monkeypatch):
    deliveries = []

    def send(params):
        deliveries.append(params)
        return {"id": f"email-{len(deliveries)}"}

    monkeypatch.setattr(resend.Emails, "send", staticmethod(send))

    response = TestClient(main_module.app).post(
        "/api/contact",
        json={
            **VALID_CONTACT,
            "name": "  Priya Sharma  ",
            "email": "  PRIYA@EXAMPLE.COM ",
            "message": "  I would like help with AuditWeave.  ",
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "sent" in response.json()["message"].lower()
    assert len(deliveries) == 2
    assert deliveries[0]["to"] == ["support@example.com"]
    assert deliveries[0]["reply_to"] == "priya@example.com"
    assert "Priya Sharma" in deliveries[0]["subject"]
    assert "html" not in deliveries[0]
    assert "text" in deliveries[1] and "html" in deliveries[1]
    assert "12 business hours" in deliveries[1]["text"]
    assert "12 business hours" in deliveries[1]["html"]
    assert "Powered by Axoreon" in deliveries[1]["html"]
    assert VALID_CONTACT["message"] not in deliveries[1]["html"]


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"email": "not-an-email"}, "email"),
        ({"email": f"{'a' * 245}@example.com"}, "email"),
        ({"name": "   "}, "name"),
        ({"name": "Header\nInjection"}, "name"),
        ({"message": "         "}, "message"),
        ({"message": "short"}, "message"),
        ({"message": "x" * 5001}, "message"),
        ({"topic": "unknown"}, "topic"),
    ],
)
def test_invalid_contact_payloads_return_422(overrides, field):
    response = TestClient(main_module.app).post(
        "/api/contact",
        json={**VALID_CONTACT, **overrides},
    )

    assert response.status_code == 422
    assert any(error["loc"][-1] == field for error in response.json()["detail"])


def test_other_topic_is_required_and_included_in_admin_email(monkeypatch):
    deliveries = []

    def send(params):
        deliveries.append(params)
        return {"id": f"email-{len(deliveries)}"}

    monkeypatch.setattr(resend.Emails, "send", staticmethod(send))

    missing_response = TestClient(main_module.app).post(
        "/api/contact",
        json={**VALID_CONTACT, "topic": "other"},
    )
    assert missing_response.status_code == 422

    response = TestClient(main_module.app).post(
        "/api/contact",
        json={
            **VALID_CONTACT,
            "topic": "other",
            "other_topic": "  Partnership enquiry  ",
        },
    )

    assert response.status_code == 200
    assert "Partnership enquiry" in deliveries[0]["subject"]
    assert "Topic: Partnership enquiry" in deliveries[0]["text"]


def test_other_topic_rejects_oversized_description():
    response = TestClient(main_module.app).post(
        "/api/contact",
        json={
            **VALID_CONTACT,
            "topic": "other",
            "other_topic": "x" * 101,
        },
    )

    assert response.status_code == 422
    assert any(error["loc"][-1] == "other_topic" for error in response.json()["detail"])


def test_missing_provider_configuration_returns_safe_503(monkeypatch):
    monkeypatch.setattr(main_module, "RESEND_API_KEY", "")

    response = TestClient(main_module.app).post("/api/contact", json=VALID_CONTACT)

    assert response.status_code == 503
    assert response.json() == {
        "detail": "Contact service is temporarily unavailable. Please try again later."
    }


def test_admin_delivery_failure_returns_safe_503(monkeypatch):
    def fail_send(_params):
        raise RuntimeError("provider-secret-detail")

    monkeypatch.setattr(resend.Emails, "send", staticmethod(fail_send))

    response = TestClient(main_module.app).post("/api/contact", json=VALID_CONTACT)

    assert response.status_code == 503
    assert "provider-secret-detail" not in response.text
    assert "temporarily unavailable" in response.json()["detail"]


def test_acknowledgment_failure_after_admin_acceptance_returns_success(monkeypatch):
    calls = 0

    def send(_params):
        nonlocal calls
        calls += 1
        if calls == 1:
            return {"id": "admin-accepted"}
        raise RuntimeError("ack-provider-detail")

    monkeypatch.setattr(resend.Emails, "send", staticmethod(send))

    response = TestClient(main_module.app).post("/api/contact", json=VALID_CONTACT)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "ack-provider-detail" not in response.text
    assert calls == 2


def test_contact_rate_limit_returns_429(monkeypatch):
    monkeypatch.setattr(main_module, "CONTACT_RATE_LIMIT_COUNT", 2)
    monkeypatch.setattr(
        resend.Emails,
        "send",
        staticmethod(lambda _params: {"id": "accepted"}),
    )
    client = TestClient(main_module.app)

    assert client.post("/api/contact", json=VALID_CONTACT).status_code == 200
    assert client.post("/api/contact", json=VALID_CONTACT).status_code == 200
    response = client.post("/api/contact", json=VALID_CONTACT)

    assert response.status_code == 429
    assert response.json()["detail"] == "Too many contact requests. Please try again later."


def test_protected_dashboard_remains_protected():
    response = TestClient(main_module.app).get("/api/dashboard")

    assert response.status_code == 401
