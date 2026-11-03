"""Email-client-safe transactional templates for AuditWeave.

Rendering is intentionally separate from SMTP and Resend delivery. Templates
use text branding, inline critical styles, and conservative table layouts.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape


DEEP_GREEN = "#0D3A35"
BRAND_GREEN = "#276152"
CREAM = "#FBF6F0"
WHITE = "#FFFFFF"
EMAIL_MAX_WIDTH = 600


@dataclass(frozen=True)
class EmailContent:
    subject: str
    text: str
    html: str


def _safe(value: object) -> str:
    return escape(str(value), quote=True)


def _paragraph(content: str, *, last: bool = False) -> str:
    margin = "0" if last else "0 0 20px"
    return (
        f'<p style="margin:{margin};font-family:Arial,Helvetica,sans-serif;'
        f'font-size:16px;line-height:1.6;color:{DEEP_GREEN};">{content}</p>'
    )


def _security_notice(lines: list[str]) -> str:
    content = "".join(
        f'<p style="margin:{"0" if index == len(lines) - 1 else "0 0 8px"};'
        f'font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;'
        f'color:{DEEP_GREEN};">{line}</p>'
        for index, line in enumerate(lines)
    )
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="width:100%;border-collapse:separate;background-color:{CREAM};
              border:1px solid {BRAND_GREEN};border-left:4px solid {BRAND_GREEN};
              border-radius:10px;margin:28px 0 24px;">
  <tr>
    <td style="padding:18px 20px;">
      <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;
                font-size:12px;line-height:1.4;font-weight:700;
                letter-spacing:1px;color:{BRAND_GREEN};">SECURITY NOTICE</p>
      {content}
    </td>
  </tr>
</table>"""


def _otp_block(otp: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="width:100%;border-collapse:collapse;margin:28px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"
             style="border-collapse:separate;background-color:{CREAM};
                    border:2px solid {BRAND_GREEN};border-radius:14px;
                    box-shadow:0 8px 20px rgba(13,58,53,0.08);">
        <tr>
          <td align="center" style="padding:15px 20px 0;font-family:Arial,
                    Helvetica,sans-serif;font-size:11px;line-height:1.4;
                    font-weight:700;letter-spacing:1.2px;color:{BRAND_GREEN};">
            YOUR 6-DIGIT CODE
          </td>
        </tr>
        <tr>
          <td class="aw-otp" style="padding:10px 24px 18px;font-family:Consolas,
                    'Courier New',monospace;font-size:34px;line-height:1.2;
                    font-weight:700;letter-spacing:4px;white-space:nowrap;
                    color:{DEEP_GREEN};text-align:center;">{_safe(otp)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""


def _status_panel(title: str, message: str) -> str:
    return f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="width:100%;border-collapse:separate;background-color:{CREAM};
              border:1px solid {BRAND_GREEN};border-radius:12px;margin:24px 0;">
  <tr>
    <td width="42" valign="top" style="width:42px;padding:18px 0 18px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" valign="middle" width="28" height="28"
              style="width:28px;height:28px;border-radius:14px;
                     background-color:{BRAND_GREEN};font-family:Arial,
                     Helvetica,sans-serif;font-size:16px;font-weight:700;
                     color:{WHITE};">&#10003;</td>
        </tr>
      </table>
    </td>
    <td style="padding:17px 18px 17px 12px;">
      <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;
                font-size:15px;line-height:1.45;font-weight:700;
                color:{DEEP_GREEN};">{_safe(title)}</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;
                line-height:1.5;color:{DEEP_GREEN};">{_safe(message)}</p>
    </td>
  </tr>
</table>"""


def _render_email(
    *,
    preheader: str,
    eyebrow: str,
    heading: str,
    body_html: str,
) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>{_safe(heading)}</title>
  <style>
    :root {{ color-scheme: light; supported-color-schemes: light; }}
    table {{ border-spacing: 0; }}
    td {{ word-break: normal; overflow-wrap: anywhere; }}
    @media only screen and (max-width:600px) {{
      .aw-page {{ padding:16px 8px !important; }}
      .aw-header {{ padding:22px 20px !important; }}
      .aw-body {{ padding:28px 20px !important; }}
      .aw-footer {{ padding:18px 20px !important; }}
      .aw-heading {{ font-size:24px !important; }}
      .aw-header-meta {{ display:none !important; }}
      .aw-otp {{ font-size:30px !important;letter-spacing:3px !important;
                 padding:10px 18px 16px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:{CREAM};color:{DEEP_GREEN};
             font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;
             -ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;
              color:transparent;mso-hide:all;">{_safe(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="width:100%;border-collapse:collapse;background-color:{CREAM};">
    <tr>
      <td class="aw-page" align="center" style="padding:32px 12px;">
        <!--[if mso]>
        <table role="presentation" width="{EMAIL_MAX_WIDTH}" cellpadding="0" cellspacing="0">
          <tr><td>
        <![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:{EMAIL_MAX_WIDTH}px;border-collapse:separate;
                      background-color:{WHITE};border:1px solid {BRAND_GREEN};
                      border-radius:16px;overflow:hidden;
                      box-shadow:0 14px 38px rgba(13,58,53,0.10);">
          <tr>
            <td class="aw-header" style="padding:24px 28px;background-color:{DEEP_GREEN};
                                         border-bottom:4px solid {BRAND_GREEN};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="52" valign="middle" style="width:52px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="aw-brand-mark" align="center" valign="middle"
                            width="42" height="42"
                            style="width:42px;height:42px;border-radius:10px;
                                   background-color:{CREAM};font-family:Georgia,
                                   'Times New Roman',serif;font-size:17px;
                                   font-weight:700;color:{DEEP_GREEN};">AW</td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle">
                    <div style="font-family:Georgia,'Times New Roman',serif;
                                font-size:24px;line-height:1.15;font-weight:700;
                                color:{WHITE};">AuditWeave</div>
                    <div style="margin-top:5px;font-family:Arial,Helvetica,sans-serif;
                                font-size:10px;line-height:1.4;font-weight:700;
                                letter-spacing:1.3px;color:{WHITE};">POWERED BY AXOREON</div>
                  </td>
                  <td class="aw-header-meta" align="right" valign="middle"
                      style="font-family:Arial,Helvetica,sans-serif;font-size:10px;
                             line-height:1.4;font-weight:700;letter-spacing:1px;
                             color:{WHITE};">SECURE ACCOUNT EMAIL</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="aw-body" style="padding:36px 40px;">
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;
                        font-size:12px;line-height:1.4;font-weight:700;
                        letter-spacing:1.2px;color:{BRAND_GREEN};">{_safe(eyebrow)}</p>
              <h1 class="aw-heading" style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;
                         font-size:26px;line-height:1.25;font-weight:700;
                         color:{DEEP_GREEN};">{_safe(heading)}</h1>
              <div style="width:48px;height:3px;margin:0 0 24px;
                          background-color:{BRAND_GREEN};border-radius:2px;"></div>
              {body_html}
            </td>
          </tr>
          <tr>
            <td class="aw-footer" align="center"
                style="padding:20px 24px;background-color:{CREAM};
                       border-top:1px solid {BRAND_GREEN};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;
                        font-size:13px;line-height:1.6;font-weight:600;color:{DEEP_GREEN};">
                AuditWeave &middot; Powered by Axoreon
              </p>
              <p style="margin:5px 0 0;font-family:Arial,Helvetica,sans-serif;
                        font-size:11px;line-height:1.5;color:{BRAND_GREEN};">
                Privacy and compliance, made clearer.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
          </td></tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_signup_verification_email(
    first_name: str,
    otp: str,
    expiry_minutes: int,
) -> EmailContent:
    display_name = first_name or "there"
    safe_name = _safe(display_name)
    body_html = (
        _paragraph(f"Hi {safe_name},")
        + _paragraph(
            "Use this six-digit code to verify your AuditWeave email address."
        )
        + _otp_block(otp)
        + _paragraph(
            f"This code expires in <strong>{expiry_minutes} minutes</strong>."
        )
        + _security_notice([
            "Never share this code with anyone.",
            "AuditWeave support will never ask you for this code.",
        ])
        + _paragraph(
            "If you did not create an AuditWeave account, you can safely ignore "
            "this email. No account has been activated.",
            last=True,
        )
    )
    text = (
        f"VERIFY YOUR EMAIL\n\n"
        f"Hi {display_name},\n\n"
        "Use this six-digit code to verify your AuditWeave email address.\n\n"
        f"Verification code: {otp}\n\n"
        f"This code expires in {expiry_minutes} minutes.\n\n"
        "SECURITY NOTICE\n"
        "Never share this code with anyone.\n"
        "AuditWeave support will never ask you for this code.\n\n"
        "If you did not create an AuditWeave account, you can safely ignore "
        "this email. No account has been activated.\n\n"
        "AuditWeave · Powered by Axoreon"
    )
    return EmailContent(
        subject="Your AuditWeave verification code",
        text=text,
        html=_render_email(
            preheader=f"Your AuditWeave verification code expires in {expiry_minutes} minutes.",
            eyebrow="EMAIL VERIFICATION",
            heading="Verify your email",
            body_html=body_html,
        ),
    )


def render_password_reset_email(
    first_name: str,
    otp: str,
    expiry_minutes: int,
) -> EmailContent:
    display_name = first_name or "there"
    safe_name = _safe(display_name)
    body_html = (
        _paragraph(f"Hi {safe_name},")
        + _paragraph(
            "We received a request to reset your AuditWeave password. Use this "
            "six-digit code to continue."
        )
        + _otp_block(otp)
        + _paragraph(
            f"This code expires in <strong>{expiry_minutes} minutes</strong>."
        )
        + _security_notice([
            "Never share this code with anyone.",
            "AuditWeave support will never ask you for this code.",
        ])
        + _paragraph(
            "If you did not request a password reset, you can safely ignore this "
            "email. Your password will remain unchanged.",
            last=True,
        )
    )
    text = (
        "RESET YOUR PASSWORD\n\n"
        f"Hi {display_name},\n\n"
        "We received a request to reset your AuditWeave password. Use this "
        "six-digit code to continue.\n\n"
        f"Password reset code: {otp}\n\n"
        f"This code expires in {expiry_minutes} minutes.\n\n"
        "SECURITY NOTICE\n"
        "Never share this code with anyone.\n"
        "AuditWeave support will never ask you for this code.\n\n"
        "If you did not request a password reset, you can safely ignore this "
        "email. Your password will remain unchanged.\n\n"
        "AuditWeave · Powered by Axoreon"
    )
    return EmailContent(
        subject="Reset your AuditWeave password",
        text=text,
        html=_render_email(
            preheader=f"Your AuditWeave password reset code expires in {expiry_minutes} minutes.",
            eyebrow="ACCOUNT SECURITY",
            heading="Reset your password",
            body_html=body_html,
        ),
    )


def render_account_verified_email(first_name: str) -> EmailContent:
    """Render the post-verification welcome email without an unconfigured CTA."""
    display_name = first_name or "there"
    safe_name = _safe(display_name)
    body_html = (
        _paragraph(f"Hi {safe_name},")
        + _paragraph("Your email has been successfully verified.")
        + _status_panel(
            "Email verification complete",
            "Your AuditWeave account is ready for secure access.",
        )
        + _paragraph(
            "You can now log in to your AuditWeave account and begin reviewing "
            "privacy policies and compliance assessments."
        )
        + _paragraph(
            "If you need help getting started, use Contact &amp; Support on the "
            "AuditWeave website.",
            last=True,
        )
    )
    text = (
        "ACCOUNT VERIFIED\n\n"
        "Welcome to AuditWeave\n\n"
        f"Hi {display_name},\n\n"
        "Your email has been successfully verified.\n\n"
        "You can now log in to your AuditWeave account and begin reviewing "
        "privacy policies and compliance assessments.\n\n"
        "If you need help getting started, use Contact & Support on the "
        "AuditWeave website.\n\n"
        "AuditWeave · Powered by Axoreon"
    )
    return EmailContent(
        subject="Welcome to AuditWeave — your account is verified",
        text=text,
        html=_render_email(
            preheader="Your AuditWeave email has been successfully verified.",
            eyebrow="ACCOUNT VERIFIED",
            heading="Welcome to AuditWeave",
            body_html=body_html,
        ),
    )


def render_contact_acknowledgement_email(name: str) -> EmailContent:
    display_name = name or "there"
    safe_name = _safe(display_name)
    body_html = (
        _paragraph(f"Hi {safe_name},")
        + _paragraph(
            "Thank you for contacting AuditWeave. We have received your message."
        )
        + _paragraph(
            "Our GRC compliance team will respond within "
            "<strong>12 business hours</strong>.",
            last=True,
        )
    )
    text = (
        f"Hi {display_name},\n\n"
        "Thank you for contacting AuditWeave. We've received your message "
        "and our GRC compliance team will respond within 12 business hours.\n\n"
        "— AuditWeave Team (Powered by Axoreon)"
    )
    return EmailContent(
        subject="We received your message — AuditWeave Support",
        text=text,
        html=_render_email(
            preheader="AuditWeave Support has received your message.",
            eyebrow="CONTACT & SUPPORT",
            heading="We received your message",
            body_html=body_html,
        ),
    )


def _detail_row(label: str, value: object) -> str:
    return f"""
<tr>
  <td width="40%" valign="top"
      style="width:40%;padding:12px 10px 12px 0;border-bottom:1px solid {BRAND_GREEN};
             font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;
             font-weight:700;color:{DEEP_GREEN};">{_safe(label)}</td>
  <td width="60%" valign="top"
      style="width:60%;padding:12px 0 12px 10px;border-bottom:1px solid {BRAND_GREEN};
             font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;
             color:{DEEP_GREEN};overflow-wrap:anywhere;">{_safe(value)}</td>
</tr>"""


def render_payment_receipt_email(
    *,
    customer_name: str,
    receipt_number: str,
    plan_name: str,
    credits_purchased: int,
    amount_paid: str,
    payment_date: str,
) -> EmailContent:
    display_name = customer_name or "there"
    rows = "".join([
        _detail_row("Receipt number", receipt_number),
        _detail_row("Plan", plan_name),
        _detail_row("Credits", f"{credits_purchased:,}"),
        _detail_row("Amount paid", amount_paid),
        _detail_row("Payment date", payment_date),
    ])
    body_html = (
        _paragraph(f"Hello {_safe(display_name)},")
        + _paragraph(
            "Your AuditWeave credit purchase was successful. Your credits are "
            "now available in your account."
        )
        + f"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="width:100%;table-layout:fixed;border-collapse:collapse;
              margin:24px 0 26px;">{rows}</table>"""
        + _paragraph("The PDF payment receipt is attached.")
        + _paragraph(
            "<strong>This is a one-time credit purchase. There is no automatic "
            "renewal.</strong>",
            last=True,
        )
    )
    text = (
        "Payment successful\n\n"
        f"Hello {display_name},\n\n"
        "Your AuditWeave credit purchase was successful.\n\n"
        f"Receipt Number: {receipt_number}\n"
        f"Plan: {plan_name}\n"
        f"Credits: {credits_purchased}\n"
        f"Amount Paid: {amount_paid}\n"
        f"Payment Date: {payment_date}\n\n"
        "Your credits are now available in your account.\n"
        "The PDF payment receipt is attached.\n\n"
        "This is a one-time credit purchase.\n"
        "There is no automatic renewal.\n\n"
        "AuditWeave · Powered by Axoreon"
    )
    return EmailContent(
        subject=f"AuditWeave Payment Receipt — {receipt_number}",
        text=text,
        html=_render_email(
            preheader=f"Payment receipt {receipt_number} for your AuditWeave credit purchase.",
            eyebrow="PAYMENT RECEIPT",
            heading="Payment successful",
            body_html=body_html,
        ),
    )
