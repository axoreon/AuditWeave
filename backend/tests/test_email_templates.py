from __future__ import annotations

from app.services.email_otp import (
    _build_account_verified_email,
    _build_otp_email,
    _build_password_reset_email,
)
from app.services.email_templates import (
    BRAND_GREEN,
    CREAM,
    DEEP_GREEN,
    WHITE,
    render_account_verified_email,
    render_contact_acknowledgement_email,
    render_password_reset_email,
    render_payment_receipt_email,
    render_signup_verification_email,
)


SMTP_CONFIG = {
    "from_name": "AuditWeave",
    "from_email": "noreply@example.com",
}


def _mime_parts(message) -> tuple[str, str]:
    plain, html = message.get_payload()
    plain_text = plain.get_payload(decode=True).decode(plain.get_content_charset())
    html_text = html.get_payload(decode=True).decode(html.get_content_charset())
    return plain_text, html_text


def test_signup_otp_has_consistent_html_text_security_and_escaping():
    content = render_signup_verification_email(
        "<Admin & Owner>",
        "123456",
        expiry_minutes=10,
    )

    assert content.subject == "Your AuditWeave verification code"
    assert "123456" in content.text and "123456" in content.html
    assert "10 minutes" in content.text and "10 minutes" in content.html
    assert "Never share this code" in content.text
    assert "Never share this code" in content.html
    assert "Powered by Axoreon" in content.text
    assert "Powered by Axoreon" in content.html
    assert "<Admin & Owner>" not in content.html
    assert "&lt;Admin &amp; Owner&gt;" in content.html


def test_password_reset_has_required_trust_language_in_both_parts():
    content = render_password_reset_email("Priya", "654321", expiry_minutes=10)

    assert content.subject == "Reset your AuditWeave password"
    for value in (
        "654321",
        "10 minutes",
        "Never share this code",
        "did not request a password reset",
        "password will remain unchanged",
        "Powered by Axoreon",
    ):
        assert value in content.text
        assert value in content.html


def test_account_verified_email_is_branded_escaped_and_has_no_unconfigured_cta():
    content = render_account_verified_email("<Verified & Ready>")

    assert content.subject == "Welcome to AuditWeave — your account is verified"
    for value in (
        "ACCOUNT VERIFIED",
        "Welcome to AuditWeave",
        "successfully verified",
        "privacy policies and compliance assessments",
        "Powered by Axoreon",
    ):
        assert value in content.text
        assert value in content.html
    assert "<Verified & Ready>" not in content.html
    assert "&lt;Verified &amp; Ready&gt;" in content.html
    assert "href=" not in content.html
    assert "Email verification complete" in content.html
    assert "Your AuditWeave account is ready for secure access." in content.html


def test_smtp_builders_remain_multipart_alternative():
    signup = _build_otp_email(
        "person@example.com",
        "Person",
        "123456",
        SMTP_CONFIG,
    )
    reset = _build_password_reset_email(
        "person@example.com",
        "Person",
        "654321",
        SMTP_CONFIG,
    )
    verified = _build_account_verified_email(
        "person@example.com",
        "Person",
        SMTP_CONFIG,
    )

    assert signup.get_content_type() == "multipart/alternative"
    assert reset.get_content_type() == "multipart/alternative"
    assert verified.get_content_type() == "multipart/alternative"
    assert [part.get_content_type() for part in signup.get_payload()] == [
        "text/plain",
        "text/html",
    ]
    assert [part.get_content_type() for part in reset.get_payload()] == [
        "text/plain",
        "text/html",
    ]
    assert [part.get_content_type() for part in verified.get_payload()] == [
        "text/plain",
        "text/html",
    ]
    signup_text, signup_html = _mime_parts(signup)
    reset_text, reset_html = _mime_parts(reset)
    verified_text, verified_html = _mime_parts(verified)
    assert "123456" in signup_text and "123456" in signup_html
    assert "654321" in reset_text and "654321" in reset_html
    assert "successfully verified" in verified_text and "successfully verified" in verified_html


def test_shared_wrapper_is_responsive_email_safe_and_brand_exact():
    html = render_contact_acknowledgement_email("Visitor").html

    assert '<html lang="en">' in html
    assert 'name="viewport"' in html
    assert "display:none;max-height:0" in html
    assert html.count('role="presentation"') >= 2
    assert 'width="100%"' in html
    assert "width:100%;max-width:600px" in html
    assert "@media only screen and (max-width:600px)" in html
    assert "letter-spacing:4px" not in html  # Non-OTP templates stay compact.
    for color in (DEEP_GREEN, BRAND_GREEN, CREAM, WHITE):
        assert color in html
    assert 'src="/' not in html
    assert "<script" not in html.lower()
    assert "display:flex" not in html.replace(" ", "").lower()
    assert "display:grid" not in html.replace(" ", "").lower()
    assert "aw-brand-mark" in html
    assert "SECURE ACCOUNT EMAIL" in html
    assert "Privacy and compliance, made clearer." in html


def test_otp_defaults_fit_narrow_clients_without_fixed_card_width():
    html = render_signup_verification_email("Person", "123456", 10).html

    assert 'width="520"' not in html
    assert 'width="600"' in html  # Outlook-only ghost table.
    assert "width:100%;max-width:600px" in html
    assert "padding:32px 12px" in html
    assert "font-size:34px" in html
    assert "letter-spacing:4px" in html
    assert "white-space:nowrap" in html
    assert "YOUR 6-DIGIT CODE" in html


def test_contact_acknowledgement_is_branded_without_message_repetition():
    content = render_contact_acknowledgement_email("<Visitor>")

    assert content.subject == "We received your message — AuditWeave Support"
    assert "12 business hours" in content.text
    assert "12 business hours" in content.html
    assert "Powered by Axoreon" in content.text
    assert "&lt;Visitor&gt;" in content.html


def test_receipt_details_are_present_and_html_escaped():
    content = render_payment_receipt_email(
        customer_name="<Receipt User>",
        receipt_number="AW-RCP-2026-EMAIL",
        plan_name="Pro & Enterprise",
        credits_purchased=20,
        amount_paid="₹350",
        payment_date="15 Sep 2026, 12:00 UTC",
    )

    for value in (
        "AW-RCP-2026-EMAIL",
        "Pro & Enterprise",
        "20",
        "₹350",
        "15 Sep 2026, 12:00 UTC",
        "one-time credit purchase",
        "no automatic renewal",
    ):
        assert value.lower() in content.text.lower()
    assert "&lt;Receipt User&gt;" in content.html
    assert "Pro &amp; Enterprise" in content.html
    assert "table-layout:fixed" in content.html
    assert "overflow-wrap:anywhere" in content.html
