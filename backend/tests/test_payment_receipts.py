import asyncio
import datetime
import io
import os
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_DIR))
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://unused:unused@127.0.0.1:5432/unused")
os.environ.setdefault("JWT_SECRET", "test-only-signing-key")

from app import main as main_module
from app.main import create_payment_order, download_payment_receipt, get_payment_history, verify_payment
from app.models import Base, CreditTransaction, PaymentOrder, PaymentReceipt, User
from app.schemas import CreateOrderRequest, VerifyPaymentRequest
from app.services.receipt_email import SmtpReceiptEmailSender, deliver_receipt_email
from app.services.receipt_pdf import generate_receipt_pdf


class FakeRazorpayClient:
    class OrderApi:
        def __init__(self, parent):
            self.parent = parent

        def create(self, payload):
            order_id = f"order_{len(self.parent.orders) + 1}"
            self.parent.orders.append({"id": order_id, **payload})
            return dict(self.parent.orders[-1])

    class UtilityApi:
        @staticmethod
        def verify_payment_signature(payload):
            return None

    class PaymentApi:
        def __init__(self, parent):
            self.parent = parent

        def fetch(self, payment_id):
            return dict(self.parent.payments[payment_id])

    def __init__(self):
        self.orders = []
        self.payments = {}
        self.order = self.OrderApi(self)
        self.utility = self.UtilityApi()
        self.payment = self.PaymentApi(self)


class CapturingSender:
    def __init__(self):
        self.messages = []

    def send(self, receipt, pdf_bytes):
        self.messages.append({
            "recipient": receipt.customer_email,
            "receipt_number": receipt.receipt_number,
            "plan_name": receipt.plan_name,
            "amount_paid": receipt.amount_paid,
            "pdf": pdf_bytes,
        })


class FailingSender:
    @staticmethod
    def send(receipt, pdf_bytes):
        raise RuntimeError("provider-secret-detail-that-must-not-be-stored")


@pytest.fixture()
def db(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'receipt-tests.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def user(db):
    value = User(first_name="Receipt User", email="receipt-user@example.com", password_hash="hash", role="user", credits_balance=1)
    db.add(value)
    db.commit()
    return value


def configure_successful_payment(fake_razorpay, order_data, payment_id):
    fake_razorpay.payments[payment_id] = {
        "order_id": order_data["id"],
        "amount": order_data["amount"],
        "currency": order_data["currency"],
        "status": "captured",
    }
    return VerifyPaymentRequest(
        razorpay_order_id=order_data["id"],
        razorpay_payment_id=payment_id,
        razorpay_signature="valid",
    )


def test_new_and_duplicate_payments_create_one_receipt_and_email_each(db, user, monkeypatch):
    fake_razorpay = FakeRazorpayClient()
    sender = CapturingSender()
    monkeypatch.setattr(main_module, "razorpay_client", fake_razorpay)
    monkeypatch.setattr(
        main_module,
        "deliver_receipt_email",
        lambda session, receipt_id: deliver_receipt_email(session, receipt_id, sender),
    )

    first_order = asyncio.run(create_payment_order(CreateOrderRequest(plan_id="pro"), db, user))
    first_request = configure_successful_payment(fake_razorpay, first_order, "pay_first")
    first = asyncio.run(verify_payment(first_request, db, user))
    replay = asyncio.run(verify_payment(first_request, db, user))

    assert first["new_balance"] == 21
    assert first["receipt_available"] is True
    assert first["receipt_email_status"] == "sent"
    assert replay["already_processed"] is True
    assert replay["new_balance"] == 21
    assert len(sender.messages) == 1
    assert db.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 1
    assert db.query(PaymentReceipt).count() == 1

    second_order = asyncio.run(create_payment_order(CreateOrderRequest(plan_id="pro"), db, user))
    second_request = configure_successful_payment(fake_razorpay, second_order, "pay_second")
    second = asyncio.run(verify_payment(second_request, db, user))

    assert second["new_balance"] == 41
    assert second["receipt_number"] != first["receipt_number"]
    assert len(sender.messages) == 2
    assert db.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 2
    assert db.query(PaymentReceipt).count() == 2
    assert all(message["recipient"] == user.email for message in sender.messages)
    assert all(message["plan_name"] == "Pro Pack" and message["amount_paid"] == 35000 for message in sender.messages)
    assert all(message["pdf"].startswith(b"%PDF-") and len(message["pdf"]) > 1000 for message in sender.messages)


def test_email_failure_does_not_rollback_payment_or_expose_provider_error(db, user, monkeypatch):
    fake_razorpay = FakeRazorpayClient()
    monkeypatch.setattr(main_module, "razorpay_client", fake_razorpay)
    monkeypatch.setattr(
        main_module,
        "deliver_receipt_email",
        lambda session, receipt_id: deliver_receipt_email(session, receipt_id, FailingSender()),
    )
    order = asyncio.run(create_payment_order(CreateOrderRequest(plan_id="pro"), db, user))
    request = configure_successful_payment(fake_razorpay, order, "pay_failure")

    result = asyncio.run(verify_payment(request, db, user))
    receipt = db.query(PaymentReceipt).one()

    assert result["success"] is True and result["new_balance"] == 21
    assert result["receipt_available"] is True and result["receipt_email_status"] == "failed"
    assert db.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 1
    assert receipt.email_status == "failed" and receipt.email_attempts == 1
    assert receipt.last_email_error == "Receipt email delivery failed."
    assert "provider-secret-detail" not in receipt.last_email_error


def test_smtp_message_uses_registered_recipient_and_pdf_attachment(monkeypatch):

    sent = []
    monkeypatch.setenv("RECEIPT_EMAIL_FROM", "AuditWeave <receipts@example.com>")

    def send_email_stub(**payload):
        sent.append(payload)
        return True

    monkeypatch.setattr("app.services.receipt_email.send_email", send_email_stub)
    receipt = PaymentReceipt(
        receipt_number="AW-RCP-2026-EMAIL",
        plan_id="pro",
        plan_name="Pro Pack",
        credits_purchased=20,
        amount_paid=35000,
        currency="INR",
        provider="Razorpay",
        provider_order_reference="order_email",
        payment_reference="pay_email",
        customer_name="Receipt User",
        customer_email="registered@example.com",
        paid_at=datetime.datetime(2026, 9, 15, 12, 0),
    )
    pdf_bytes = generate_receipt_pdf(receipt)

    SmtpReceiptEmailSender().send(receipt, pdf_bytes)

    assert len(sent) == 1
    message = sent[0]
    assert message["to"] == "registered@example.com"
    assert message["subject"] == "AuditWeave Payment Receipt — AW-RCP-2026-EMAIL"
    assert "Plan: Pro Pack" in message["text"]
    assert "Credits: 20" in message["text"]
    assert "Amount Paid: ₹350" in message["text"]
    assert "AW-RCP-2026-EMAIL" in message["html"]
    assert "Pro Pack" in message["html"]
    assert "20" in message["html"]
    assert "₹350" in message["html"]
    assert "Powered by Axoreon" in message["html"]
    attachment_name, attachment_content, attachment_type = message["attachments"][0]
    assert attachment_name == "AuditWeave-Receipt-AW-RCP-2026-EMAIL.pdf"
    assert attachment_content == pdf_bytes
    assert attachment_type == "application/pdf"


@pytest.mark.parametrize(("amount_paise", "amount_text"), [(10000, "₹100"), (35000, "₹350"), (150000, "₹1,500")])
def test_receipt_pdf_contains_snapshot_and_rupee_glyph(amount_paise, amount_text):
    receipt = PaymentReceipt(
        receipt_number=f"AW-RCP-2026-{amount_paise}",
        plan_id="pro",
        plan_name="Pro Pack",
        credits_purchased=20,
        amount_paid=amount_paise,
        currency="INR",
        provider="Razorpay",
        provider_order_reference="order_test",
        payment_reference="pay_test_1234",
        customer_name="Receipt User",
        customer_email="receipt-user@example.com",
        paid_at=datetime.datetime(2026, 9, 15, 12, 0),
    )

    first = generate_receipt_pdf(receipt)
    second = generate_receipt_pdf(receipt)
    extracted = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(first)).pages)

    assert first.startswith(b"%PDF-") and second.startswith(b"%PDF-")
    assert len(first) > 1000 and len(second) > 1000
    assert first == second
    assert receipt.receipt_number in extracted
    assert "Pro Pack" in extracted and "20" in extracted and "Paid" in extracted
    assert "Receipt User" in extracted and "receipt-user@example.com" in extracted
    assert amount_text in extracted


def test_receipt_download_is_authenticated_owner_only(db, user):
    order = PaymentOrder(
        user_id=user.id,
        plan_id="pro",
        plan_name="Pro Pack",
        razorpay_order_id="order_download",
        razorpay_payment_id="pay_download",
        credits_purchased=20,
        amount_paid=35000,
        currency="INR",
        status="verified",
        verified_at=datetime.datetime(2026, 9, 15, 12, 0),
    )
    db.add(order)
    db.flush()
    receipt = PaymentReceipt(
        public_id="a" * 32,
        receipt_number="AW-RCP-2026-DOWNLOAD",
        user_id=user.id,
        payment_order_id=order.id,
        plan_id="pro",
        plan_name="Pro Pack",
        credits_purchased=20,
        amount_paid=35000,
        currency="INR",
        provider="Razorpay",
        provider_order_reference="order_download",
        payment_reference="pay_download",
        customer_name=user.first_name,
        customer_email=user.email,
        paid_at=datetime.datetime(2026, 9, 15, 12, 0),
    )
    other = User(first_name="Other", email="other-receipt@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add_all([receipt, other])
    db.commit()

    response = download_payment_receipt(receipt.receipt_number, db, user)
    assert response.status_code == 200
    assert response.media_type == "application/pdf"
    assert response.body.startswith(b"%PDF-")
    assert "attachment" in response.headers["content-disposition"]

    with pytest.raises(HTTPException) as forbidden:
        download_payment_receipt(receipt.receipt_number, db, other)
    assert forbidden.value.status_code == 404
    with pytest.raises(HTTPException) as guessed:
        download_payment_receipt("AW-RCP-2026-GUESSED", db, user)
    assert guessed.value.status_code == 404

    unauthenticated = TestClient(main_module.app).get(f"/api/receipts/{receipt.receipt_number}/pdf")
    assert unauthenticated.status_code == 401


def test_history_exposes_receipt_only_to_own_verified_order(db, user):
    other = User(first_name="Other", email="history-other@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add(other)
    db.flush()
    own_order = PaymentOrder(user_id=user.id, plan_id="pro", plan_name="Pro Pack", razorpay_order_id="order_own", razorpay_payment_id="pay_own", credits_purchased=20, amount_paid=35000, currency="INR", status="verified")
    other_order = PaymentOrder(user_id=other.id, plan_id="pro", plan_name="Pro Pack", razorpay_order_id="order_other", razorpay_payment_id="pay_other", credits_purchased=20, amount_paid=35000, currency="INR", status="verified")
    db.add_all([own_order, other_order])
    db.flush()
    db.add_all([
        PaymentReceipt(public_id="b" * 32, receipt_number="AW-RCP-2026-OWN", user_id=user.id, payment_order_id=own_order.id, plan_id="pro", plan_name="Pro Pack", credits_purchased=20, amount_paid=35000, currency="INR", provider="Razorpay", provider_order_reference="order_own", payment_reference="pay_own", customer_name=user.first_name, customer_email=user.email, paid_at=datetime.datetime.utcnow()),
        PaymentReceipt(public_id="c" * 32, receipt_number="AW-RCP-2026-OTHER", user_id=other.id, payment_order_id=other_order.id, plan_id="pro", plan_name="Pro Pack", credits_purchased=20, amount_paid=35000, currency="INR", provider="Razorpay", provider_order_reference="order_other", payment_reference="pay_other", customer_name=other.first_name, customer_email=other.email, paid_at=datetime.datetime.utcnow()),
    ])
    db.commit()

    history = get_payment_history(1, 10, "", "all", db, user)
    assert history["total"] == 1
    assert history["items"][0]["receipt_available"] is True
    assert history["items"][0]["receipt_number"] == "AW-RCP-2026-OWN"
    assert "OTHER" not in str(history)
