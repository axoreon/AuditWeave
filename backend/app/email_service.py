import logging
import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr, parseaddr

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.zeptomail.in")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "emailapikey")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@axoreon.com")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "AuditWeave")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"


def _split_mime_type(content_type: str | None) -> tuple[str, str]:
    if not content_type or "/" not in content_type:
        return "application", "octet-stream"
    maintype, subtype = content_type.split("/", 1)
    return maintype.strip() or "application", subtype.strip() or "octet-stream"


def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    from_address: str | None = None,
    reply_to: str | None = None,
    attachments: list[tuple[str, bytes, str | None]] | None = None,
) -> bool:
    """Send an email through SMTP. Returns True on success."""
    recipients = [to] if isinstance(to, str) else to

    if from_address:
        name, addr = parseaddr(from_address)
        sender = formataddr((name or SMTP_FROM_NAME, addr))
    else:
        sender = formataddr((SMTP_FROM_NAME, SMTP_FROM_EMAIL))

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    msg.set_content(text or "Please view this email in an HTML-capable client.")
    msg.add_alternative(html, subtype="html")

    for filename, content, content_type in attachments or []:
        maintype, subtype = _split_mime_type(content_type)
        msg.add_attachment(
            content,
            maintype=maintype,
            subtype=subtype,
            filename=filename,
        )

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s: %s", recipients, subject)
        return True
    except Exception as exc:
        logger.error("Email to %s failed: %s", recipients, exc)
        return False