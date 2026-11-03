import re
import json
import ipaddress
import socket
import time
from urllib.parse import urljoin, urlsplit, urlunsplit
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader
import io
import docx

MAX_URL_RESPONSE_BYTES = 2_000_000
MAX_URL_REDIRECTS = 5
DIRECT_FETCH_DEADLINE_SECONDS = 10
JINA_FETCH_DEADLINE_SECONDS = 12


class URLExtractionError(RuntimeError):
    """Raised when a public policy URL cannot be extracted honestly."""


class URLFetchTimeout(URLExtractionError):
    """Raised when policy retrieval exceeds its bounded deadline."""


class UnsafePolicyURLError(URLExtractionError):
    """Raised when a URL could target a non-public network resource."""

def clean_extracted_text(text: str) -> str:
    """Normalize extracted policy text while preserving document structure."""
    text = text.replace("\ufeff", "").replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    cleaned_lines: list[str] = []
    reading_metadata = True

    for raw_line in lines:
        line = re.sub(r"[ \t\f\v]+", " ", raw_line).strip()

        if reading_metadata:
            lowered = line.lower()
            if lowered.startswith(("title:", "url source:", "published time:")):
                continue
            if lowered.startswith("markdown content:"):
                remainder = line.split(":", 1)[1].strip()
                if remainder and remainder.lower() != "legal document":
                    cleaned_lines.append(remainder)
                reading_metadata = False
                continue
            if line:
                reading_metadata = False

        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        cleaned_lines.append(line)

    return "\n".join(cleaned_lines).strip()

def extract_text_from_json_state(obj) -> list:
    """Recursively extracts human-readable text strings from JSON SPA state objects (e.g. __NEXT_DATA__)."""
    texts = []
    if isinstance(obj, str):
        cleaned = obj.strip()
        if len(cleaned) > 20 and not cleaned.startswith('http') and not cleaned.startswith('var(') and not cleaned.startswith('#'):
            if '<' in cleaned and '>' in cleaned:
                bs = BeautifulSoup(cleaned, 'html.parser')
                cleaned = bs.get_text(separator=' ')
            texts.append(cleaned)
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k not in ['rootCss', 'style', 'css', 'containerMeta', 'query', 'buildId', 'assetPrefix']:
                texts.extend(extract_text_from_json_state(v))
    elif isinstance(obj, list):
        for item in obj:
            texts.extend(extract_text_from_json_state(item))
    return texts

def _normalize_and_validate_public_url(url: str) -> str:
    candidate = url.strip()
    if not candidate.lower().startswith(("http://", "https://")):
        candidate = "https://" + candidate
    parsed = urlsplit(candidate)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise UnsafePolicyURLError("Only public HTTP or HTTPS policy URLs are allowed.")
    if parsed.username or parsed.password:
        raise UnsafePolicyURLError("Policy URLs containing credentials are not allowed.")

    try:
        addresses = {
            item[4][0]
            for item in socket.getaddrinfo(
                parsed.hostname,
                parsed.port or (443 if parsed.scheme.lower() == "https" else 80),
                type=socket.SOCK_STREAM,
            )
        }
    except socket.gaierror as exc:
        raise URLExtractionError("The policy URL hostname could not be resolved.") from exc
    if not addresses:
        raise URLExtractionError("The policy URL hostname returned no usable address.")
    for address in addresses:
        ip = ipaddress.ip_address(address.split("%", 1)[0])
        if not ip.is_global:
            raise UnsafePolicyURLError(
                "Private, loopback, link-local, and internal policy URLs are not allowed."
            )
    return urlunsplit((parsed.scheme.lower(), parsed.netloc, parsed.path or "/", parsed.query, ""))


def _response_text_with_limit(response: requests.Response, deadline: float) -> str:
    content_length = response.headers.get("Content-Length")
    try:
        declared_size = int(content_length) if content_length else None
    except (TypeError, ValueError):
        declared_size = None
    if declared_size is not None and declared_size > MAX_URL_RESPONSE_BYTES:
        raise URLExtractionError("The policy page is too large to process safely.")
    data = bytearray()
    try:
        for chunk in response.iter_content(chunk_size=65_536):
            if time.monotonic() > deadline:
                raise URLFetchTimeout("The policy URL exceeded the extraction deadline.")
            if not chunk:
                continue
            data.extend(chunk)
            if len(data) > MAX_URL_RESPONSE_BYTES:
                raise URLExtractionError("The policy page is too large to process safely.")
    except requests.Timeout as exc:
        raise URLFetchTimeout("The policy URL timed out while returning content.") from exc
    except requests.RequestException as exc:
        raise URLExtractionError("The policy URL response could not be read.") from exc
    return bytes(data).decode(response.encoding or "utf-8", errors="replace")


def _fetch_public_text(url: str, *, headers: dict | None, deadline_seconds: int) -> str:
    deadline = time.monotonic() + deadline_seconds
    current = _normalize_and_validate_public_url(url)
    for redirect_count in range(MAX_URL_REDIRECTS + 1):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise URLFetchTimeout("The policy URL did not respond before the extraction deadline.")
        try:
            response = requests.get(
                current,
                headers=headers,
                timeout=(min(3, remaining), min(8, remaining)),
                allow_redirects=False,
                stream=True,
            )
        except requests.Timeout as exc:
            raise URLFetchTimeout(
                "The policy URL did not respond before the extraction deadline."
            ) from exc
        except requests.RequestException as exc:
            raise URLExtractionError("The policy URL could not be fetched.") from exc

        if response.is_redirect or response.is_permanent_redirect:
            if redirect_count == MAX_URL_REDIRECTS:
                response.close()
                raise URLExtractionError("The policy URL has too many redirects.")
            location = response.headers.get("Location")
            if not location:
                response.close()
                raise URLExtractionError("The policy URL returned an invalid redirect.")
            try:
                current = _normalize_and_validate_public_url(urljoin(current, location))
            finally:
                response.close()
            continue
        if response.status_code != 200:
            response.close()
            raise URLExtractionError(f"The policy URL returned HTTP {response.status_code}.")
        try:
            return _response_text_with_limit(response, deadline)
        finally:
            response.close()
    raise URLExtractionError("The policy URL could not be fetched.")


def _extract_policy_from_html(html_content: str) -> str:
    soup = BeautifulSoup(html_content, "html.parser")
    next_data_script = soup.find("script", id="__NEXT_DATA__")
    if next_data_script:
        json_str = next_data_script.get_text()
        if json_str:
            try:
                data = json.loads(json_str)
                extracted = "\n".join(extract_text_from_json_state(data.get("props", {})))
                if len(extracted.strip()) >= 150:
                    return clean_extracted_text(extracted)
            except (TypeError, ValueError, json.JSONDecodeError):
                pass
    for element in soup(["style", "noscript", "svg"]):
        element.decompose()
    for element in soup(["nav", "footer", "header"]):
        element_text = element.get_text().lower()
        if "privacy" not in element_text and "terms" not in element_text:
            element.decompose()
    main_container = soup.find(["main", "article"]) or soup.find(
        attrs={"class": re.compile(r"privacy|legal|terms|policy|content|main", re.I)}
    )
    return clean_extracted_text((main_container or soup).get_text(separator="\n"))


def extract_text_from_url(url: str) -> str:
    """Extract real policy text from a public URL or fail without fabrication."""
    url_clean = _normalize_and_validate_public_url(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; AuditWeave/1.0; +privacy-policy-audit)",
        "Accept": "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9",
    }
    failures: list[URLExtractionError] = []
    try:
        direct_text = _extract_policy_from_html(
            _fetch_public_text(
                url_clean,
                headers=headers,
                deadline_seconds=DIRECT_FETCH_DEADLINE_SECONDS,
            )
        )
        if len(direct_text.strip()) >= 150:
            return direct_text
        failures.append(URLExtractionError("The policy page did not contain enough readable text."))
    except UnsafePolicyURLError:
        raise
    except URLExtractionError as exc:
        failures.append(exc)

    try:
        jina_text = clean_extracted_text(
            _fetch_public_text(
                "https://r.jina.ai/" + url_clean,
                headers=None,
                deadline_seconds=JINA_FETCH_DEADLINE_SECONDS,
            )
        )
        if len(jina_text.strip()) >= 150:
            return jina_text
        failures.append(URLExtractionError("The fallback reader returned insufficient policy text."))
    except UnsafePolicyURLError:
        raise
    except URLExtractionError as exc:
        failures.append(exc)

    if failures and all(isinstance(failure, URLFetchTimeout) for failure in failures):
        raise URLFetchTimeout(
            "The policy page timed out. Verify the URL is publicly reachable and try again."
        )
    raise URLExtractionError(
        "The privacy policy could not be extracted from this URL. Verify that the page is public and contains the full policy text, or paste/upload the policy instead."
    )

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using PyPDF."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text_pages = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_pages.append(f"[Page {i+1}]\n{page_text}")
        return clean_extracted_text("\n".join(text_pages))
    except Exception as e:
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from DOCX bytes using python-docx."""
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = docx.Document(docx_file)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        return clean_extracted_text("\n".join(full_text))
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")
