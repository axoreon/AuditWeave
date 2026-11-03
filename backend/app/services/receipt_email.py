import base64
import datetime
import os
from typing import Protocol

from sqlalchemy import update
from sqlalchemy.orm import Session

from ..models import PaymentReceipt
from .email_templates import render_payment_receipt_email
from .receipt_pdf import format_receipt_amount, generate_receipt_pdf


class ReceiptEmailSender(Protocol):
    def send(self, receipt: PaymentReceipt, pdf_bytes: bytes) -> None: ...


class ResendReceiptEmailSender:
    def __init__(self) -> None:
        self.api_key = os.getenv("RESEND_API_KEY", "").strip()
        self.from_address = os.getenv("RECEIPT_EMAIL_FROM", "").strip()

    def send(self, receipt: PaymentReceipt, pdf_bytes: bytes) -> None:
        if not self.api_key or not self.from_address:
            raise RuntimeError("Receipt email provider is not configured")

        import resend

        resend.api_key = self.api_key
        customer_name = receipt.customer_name or "there"
        payment_date = receipt.paid_at.strftime("%d %b %Y, %H:%M UTC")
        content = render_payment_receipt_email(
            customer_name=customer_name,
            receipt_number=receipt.receipt_number,
            plan_name=receipt.plan_name,
            credits_purchased=receipt.credits_purchased,
            amount_paid=format_receipt_amount(receipt.amount_paid),
            payment_date=payment_date,
        )
        resend.Emails.send({
            "from": self.from_address,
            "to": [receipt.customer_email],
            "subject": content.subject,
            "text": content.text,
            "html": content.html,
            "attachments": [{
                "filename": f"AuditWeave-Receipt-{receipt.receipt_number}.pdf",
                "content": base64.b64encode(pdf_bytes).decode("ascii"),
            }],
        })


def deliver_receipt_email(
    db: Session,
    receipt_id: int,
    sender: ReceiptEmailSender | None = None,
    *,
    retry_failed: bool = False,
) -> str:
    """Claim and deliver one receipt email without affecting its payment transaction."""
    eligible_statuses = ["pending"] + (["failed"] if retry_failed else [])
    claimed = db.execute(
        update(PaymentReceipt)
        .where(
            PaymentReceipt.id == receipt_id,
            PaymentReceipt.email_status.in_(eligible_statuses),
        )
        .values(
            email_status="sending",
            email_attempts=PaymentReceipt.email_attempts + 1,
            last_email_error=None,
        )
        .returning(PaymentReceipt.id)
        .execution_options(synchronize_session=False)
    ).first()
    db.commit()
    if claimed is None:
        current_status = db.query(PaymentReceipt.email_status).filter(PaymentReceipt.id == receipt_id).scalar()
        return str(current_status or "unavailable")

    receipt = db.query(PaymentReceipt).filter(PaymentReceipt.id == receipt_id).one()
    try:
        pdf_bytes = generate_receipt_pdf(receipt)
        (sender or ResendReceiptEmailSender()).send(receipt, pdf_bytes)
    except Exception:
        db.execute(
            update(PaymentReceipt)
            .where(PaymentReceipt.id == receipt_id, PaymentReceipt.email_status == "sending")
            .values(
                email_status="failed",
                last_email_error="Receipt email delivery failed.",
            )
            .execution_options(synchronize_session=False)
        )
        db.commit()
        return "failed"

    db.execute(
        update(PaymentReceipt)
        .where(PaymentReceipt.id == receipt_id, PaymentReceipt.email_status == "sending")
        .values(
            email_status="sent",
            email_sent_at=datetime.datetime.utcnow(),
            last_email_error=None,
        )
        .execution_options(synchronize_session=False)
    )
    db.commit()
    return "sent"
