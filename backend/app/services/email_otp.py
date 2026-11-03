"""
email_otp.py — Cryptographically secure OTP generation & SMTP delivery.

SECURITY NOTES:
- OTPs are generated with secrets.SystemRandom (CSPRNG).
- Only the SHA-256 hash of the OTP is persisted; never the plaintext.
- SMTP credentials are read exclusively from environment variables.
- This module MUST NOT log OTPs, passwords, JWT secrets, or API keys.
"""
from __future__ import annotations

import hashlib
import logging
import os
import secrets
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .email_templates import (
    render_account_verified_email,
    render_password_reset_email,
    render_signup_verification_email,
)

logger = logging.getLogger(__name__)

AUTH_OTP_EXPIRY_MINUTES = 10

# ---------------------------------------------------------------------------
# Local development controls
# ---------------------------------------------------------------------------

def email_verification_disabled() -> bool:
    """Return True when email verification is intentionally skipped for local development.

    In local/dev setups we also automatically disable verification when the SMTP
    config is absent or incomplete, so signup/login is not blocked by a missing
    mail provider.
    """
    raw = os.getenv("ENABLE_EMAIL_VERIFICATION", "").strip().lower()
    if raw in {"0", "false", "no", "disabled"}:
        return True
    if raw in {"1", "true", "yes", "enabled"}:
        return False

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
    if not smtp_host or not smtp_username or not smtp_password or not smtp_from_email:
        return True
    return False


def _get_smtp_config() -> dict:
    """
    Load SMTP settings from environment.  Raises RuntimeError if mandatory
    keys are absent so the caller can surface a safe error to the user.
    """
    host = os.getenv("SMTP_HOST", "").strip()
    port_str = os.getenv("SMTP_PORT", "587").strip()
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", "").strip()
    from_name = os.getenv("SMTP_FROM_NAME", "AuditWeave").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").strip().lower() not in ("0", "false", "no")

    if not host or not username or not password or not from_email:
        raise RuntimeError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, "
            "and SMTP_FROM_EMAIL environment variables."
        )

    try:
        port = int(port_str)
    except ValueError:
        raise RuntimeError(f"SMTP_PORT must be an integer, got: {port_str!r}")

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "from_name": from_name,
        "use_tls": use_tls,
    }


# ---------------------------------------------------------------------------
# OTP helpers
# ---------------------------------------------------------------------------

OTP_LENGTH = 6  # digits


def generate_otp() -> str:
    """Return a cryptographically secure 6-digit OTP string (zero-padded)."""
    return str(secrets.randbelow(10 ** OTP_LENGTH)).zfill(OTP_LENGTH)


def hash_otp(otp: str) -> str:
    """Return the hex SHA-256 digest of *otp*.  NEVER store the plaintext."""
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def verify_otp_hash(candidate: str, stored_hash: str) -> bool:
    """Constant-time comparison of sha256(candidate) against stored_hash."""
    candidate_hash = hashlib.sha256(candidate.encode("utf-8")).hexdigest()
    return secrets.compare_digest(candidate_hash, stored_hash)


# ---------------------------------------------------------------------------
# Email delivery
# ---------------------------------------------------------------------------

def _mask_email(email: str) -> str:
    """Return a privacy-masked form: j***@example.com"""
    try:
        local, domain = email.split("@", 1)
        visible = local[:1] if local else "*"
        return f"{visible}***@{domain}"
    except ValueError:
        return "***"


def _build_otp_email(to_email: str, first_name: str, otp: str, cfg: dict) -> MIMEMultipart:
    """Construct the OTP verification email (HTML + plain-text fallback)."""
    content = render_signup_verification_email(
        first_name,
        otp,
        expiry_minutes=AUTH_OTP_EXPIRY_MINUTES,
    )

    from_header = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = content.subject
    msg["From"] = from_header
    msg["To"] = to_email
    msg.attach(MIMEText(content.text, "plain", "utf-8"))
    msg.attach(MIMEText(content.html, "html", "utf-8"))
    return msg


class SmtpDeliveryError(Exception):
    """Raised when the OTP email cannot be delivered."""


def _send_security_email(to_email: str, msg_builder) -> None:
    """Send a prepared security email without logging its contents."""
    if email_verification_disabled():
        logger.warning("Skipping email delivery because local development mode disables email verification.")
        return

    try:
        cfg = _get_smtp_config()
    except RuntimeError as exc:
        logger.error("SMTP configuration error: %s", exc)
        raise SmtpDeliveryError("Email service is not configured.") from exc

    try:
        msg = msg_builder(cfg)

        ctx = ssl.create_default_context()

        if cfg["port"] == 465:
            # Implicit TLS (SMTPS)
            with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=ctx) as server:
                server.login(cfg["username"], cfg["password"])
                server.sendmail(cfg["from_email"], [to_email], msg.as_bytes())
        else:
            # STARTTLS (587 / 25)
            with smtplib.SMTP(cfg["host"], cfg["port"]) as server:
                server.ehlo()
                if cfg["use_tls"]:
                    server.starttls(context=ctx)
                    server.ehlo()
                server.login(cfg["username"], cfg["password"])
                server.sendmail(cfg["from_email"], [to_email], msg.as_bytes())

        logger.info("Security email sent to %s", _mask_email(to_email))

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed for host %s", cfg.get("host"))
        raise SmtpDeliveryError("Email delivery failed (auth). Check SMTP credentials.") from None
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending OTP email: %s", type(exc).__name__)
        raise SmtpDeliveryError("Email delivery failed. Please try again later.") from exc
    except OSError as exc:
        logger.error("Network error connecting to SMTP host: %s", type(exc).__name__)
        raise SmtpDeliveryError("Unable to reach email server. Please try again later.") from exc


def send_verification_otp(to_email: str, first_name: str, otp: str) -> None:
    """Build and send the signup verification OTP without logging the code."""
    _send_security_email(
        to_email,
        lambda cfg: _build_otp_email(to_email, first_name, otp, cfg),
    )


def _build_password_reset_email(
    to_email: str, first_name: str, otp: str, cfg: dict
) -> MIMEMultipart:
    content = render_password_reset_email(
        first_name,
        otp,
        expiry_minutes=AUTH_OTP_EXPIRY_MINUTES,
    )
    msg = MIMEMultipart("alternative")
    msg["Subject"] = content.subject
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to_email
    msg.attach(MIMEText(content.text, "plain", "utf-8"))
    msg.attach(MIMEText(content.html, "html", "utf-8"))
    return msg


def send_password_reset_otp(to_email: str, first_name: str, otp: str) -> None:
    """Send a password-reset OTP without logging the code."""
    _send_security_email(
        to_email,
        lambda cfg: _build_password_reset_email(to_email, first_name, otp, cfg),
    )


def _build_account_verified_email(
    to_email: str, first_name: str, cfg: dict
) -> MIMEMultipart:
    content = render_account_verified_email(first_name)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = content.subject
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to_email
    msg.attach(MIMEText(content.text, "plain", "utf-8"))
    msg.attach(MIMEText(content.html, "html", "utf-8"))
    return msg


def send_account_verified_email(to_email: str, first_name: str) -> None:
    """Send the welcome email after genuine verification succeeds."""
    _send_security_email(
        to_email,
        lambda cfg: _build_account_verified_email(to_email, first_name, cfg),
    )
