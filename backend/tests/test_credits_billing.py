import asyncio
import datetime
import io
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Barrier

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent
sys.path.append(str(BACKEND_DIR))
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://unused:unused@127.0.0.1:5432/unused")
os.environ.setdefault("JWT_SECRET", "test-only-signing-key")

from app import main as main_module
from app.main import (
    audit_policy,
    audit_policy_batch,
    audit_policy_file,
    create_payment_order,
    extract_policy_file_for_batch,
    get_credit_summary,
    get_credit_transactions,
    get_credit_plans,
    get_payment_history,
    verify_payment,
)
from app.models import Audit, Base, Company, CreditTransaction, PaymentOrder, PaymentReceipt, Policy, User
from app.schemas import AuditRequest, BatchAuditItem, BatchAuditRequest, CreateOrderRequest, VerifyPaymentRequest
from app.services.credits import (
    InsufficientCreditsError,
    finalize_audit_reservation,
    finalize_payment_purchase,
    get_credit_pack,
    list_credit_packs,
    recover_stale_audit_reservations,
    release_audit_reservation,
    reserve_audit_credits,
)
from app.services import user_auth as user_auth_service
from app.services.user_auth import create_user


class FakeRazorpayClient:
    class OrderApi:
        def __init__(self, parent):
            self.parent = parent

        def create(self, payload):
            self.parent.created_payloads.append(payload)
            return {"id": f"order_{len(self.parent.created_payloads)}", **payload}

    class UtilityApi:
        def __init__(self, parent):
            self.parent = parent

        def verify_payment_signature(self, payload):
            if self.parent.invalid_signature:
                raise main_module.razorpay.errors.SignatureVerificationError("invalid")

    class PaymentApi:
        def __init__(self, parent):
            self.parent = parent

        def fetch(self, payment_id):
            return dict(self.parent.payments[payment_id])

    def __init__(self):
        self.created_payloads = []
        self.invalid_signature = False
        self.payments = {}
        self.order = self.OrderApi(self)
        self.utility = self.UtilityApi(self)
        self.payment = self.PaymentApi(self)


@pytest.fixture()
def db(tmp_path):
    database_file = tmp_path / "credits-tests.db"
    engine = create_engine(
        f"sqlite+pysqlite:///{database_file}",
        connect_args={"check_same_thread": False, "timeout": 30},
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
    value = User(email="user@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add(value)
    db.commit()
    db.refresh(value)
    return value


@pytest.fixture()
def fake_razorpay(monkeypatch):
    client = FakeRazorpayClient()
    monkeypatch.setattr(main_module, "razorpay_client", client)
    return client


def create_local_order(db, user, *, order_id="order_owned", plan_id="pro"):
    pack = get_credit_pack(plan_id)
    order = PaymentOrder(
        user_id=user.id,
        plan_id=pack["id"],
        plan_name=pack["title"],
        razorpay_order_id=order_id,
        credits_purchased=pack["credits"],
        amount_paid=pack["price_inr"] * 100,
        currency=pack["currency"],
        status="created",
    )
    db.add(order)
    db.commit()
    return order


def fake_successful_audit(company_name, industry, policy_text, policy_url, db, user_id=None, prepared_analysis=None):
    domain = company_name.lower().replace(" ", "") + ".test"
    company = db.query(Company).filter(Company.name == company_name).first()
    if company is None:
        company = Company(name=company_name, domain=domain, industry=industry, size="SME")
        db.add(company)
        db.flush()
    policy = Policy(company_id=company.id, policy_text=policy_text, policy_url=policy_url)
    db.add(policy)
    db.flush()
    audit = Audit(
        policy_id=policy.id,
        compliance_score=80,
        risk_score=20,
        status="Good",
        overall_summary="Test result",
        rules_passed_count=8,
        rules_failed_count=3,
        ai_observations_count=0,
        created_by=user_id,
    )
    db.add(audit)
    db.flush()
    return audit


def make_request():
    from starlette.requests import Request

    return Request({"type": "http", "method": "POST", "path": "/", "headers": [], "client": ("127.0.0.1", 1)})


def test_server_returns_only_approved_plans():
    assert [plan["id"] for plan in list_credit_packs()] == ["starter", "pro", "enterprise"]
    assert [plan["id"] for plan in get_credit_plans()] == ["starter", "pro", "enterprise"]


@pytest.mark.parametrize(
    ("plan_id", "credits", "price"),
    [("starter", 5, 100), ("pro", 20, 350), ("enterprise", 100, 1500)],
)
def test_approved_plan_values(plan_id, credits, price):
    plan = get_credit_pack(plan_id)
    assert plan["credits"] == credits
    assert plan["price_inr"] == price
    assert plan["currency"] == "INR"


def test_unknown_plan_and_browser_credit_override_rejected():
    assert get_credit_pack("custom") is None
    with pytest.raises(ValidationError):
        CreateOrderRequest.model_validate({"plan_id": "pro", "credits": 999, "amount": 1})


def test_unauthenticated_order_creation_is_rejected():
    route = next(route for route in main_module.app.routes if getattr(route, "path", None) == "/api/payments/create-order")
    dependency_calls = {dependency.call for dependency in route.dependant.dependencies}
    assert main_module.get_current_user in dependency_calls
    response = TestClient(main_module.app).post("/api/payments/create-order", json={"plan_id": "starter"})
    assert response.status_code == 401


def test_authenticated_user_creates_server_priced_order(db, user, fake_razorpay):
    result = asyncio.run(create_payment_order(CreateOrderRequest(plan_id="pro"), db, user))
    assert result["amount"] == 35000
    order = db.query(PaymentOrder).one()
    assert (order.user_id, order.plan_id, order.credits_purchased, order.amount_paid) == (user.id, "pro", 20, 35000)


def test_unknown_plan_route_rejected_before_provider_call(db, user, fake_razorpay):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(create_payment_order(CreateOrderRequest(plan_id="unknown"), db, user))
    assert exc.value.status_code == 400
    assert fake_razorpay.created_payloads == []


def test_another_user_cannot_verify_or_fail_owned_order(db, user, fake_razorpay):
    create_local_order(db, user)
    other = User(email="other@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add(other)
    db.commit()
    fake_razorpay.invalid_signature = True
    request = VerifyPaymentRequest(razorpay_order_id="order_owned", razorpay_payment_id="pay_1", razorpay_signature="bad")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(verify_payment(request, db, other))
    assert exc.value.status_code == 404
    assert db.query(PaymentOrder).one().status == "created"
    assert other.credits_balance == 2


def test_invalid_signature_does_not_grant_or_mutate_order(db, user, fake_razorpay):
    create_local_order(db, user)
    fake_razorpay.invalid_signature = True
    request = VerifyPaymentRequest(razorpay_order_id="order_owned", razorpay_payment_id="pay_1", razorpay_signature="bad")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(verify_payment(request, db, user))
    assert exc.value.status_code == 400
    assert db.get(User, user.id).credits_balance == 2
    assert db.query(PaymentOrder).one().status == "created"
    assert db.query(CreditTransaction).count() == 0


def test_successful_payment_grants_exactly_once_and_ledgers_once(db, user, fake_razorpay):
    create_local_order(db, user)
    fake_razorpay.payments["pay_1"] = {"order_id": "order_owned", "amount": 35000, "currency": "INR", "status": "captured"}
    request = VerifyPaymentRequest(razorpay_order_id="order_owned", razorpay_payment_id="pay_1", razorpay_signature="valid")

    first = asyncio.run(verify_payment(request, db, user))
    second = asyncio.run(verify_payment(request, db, user))

    assert first["success"] is True
    assert first["new_balance"] == 22
    assert first["already_processed"] is False
    assert first["receipt_available"] is True
    assert first["receipt_number"].startswith("AW-RCP-")
    assert first["receipt_email_status"] == "failed"
    assert second["already_processed"] is True
    assert db.get(User, user.id).credits_balance == 22
    transactions = db.query(CreditTransaction).all()
    assert len(transactions) == 1
    assert (transactions[0].amount, transactions[0].reference_id, transactions[0].balance_after) == (20, "pay_1", 22)
    assert db.query(PaymentReceipt).count() == 1


def test_distinct_legitimate_payments_allow_repeated_plan_purchases(db, user, fake_razorpay):
    user.credits_balance = 1
    db.commit()

    purchases = [
        ("pro", "pay_pro_1", 21),
        ("pro", "pay_pro_2", 41),
        ("starter", "pay_starter_1", 46),
    ]
    requests = []
    for plan_id, payment_id, expected_balance in purchases:
        order_data = asyncio.run(create_payment_order(CreateOrderRequest(plan_id=plan_id), db, user))
        fake_razorpay.payments[payment_id] = {
            "order_id": order_data["id"],
            "amount": order_data["amount"],
            "currency": "INR",
            "status": "captured",
        }
        request = VerifyPaymentRequest(
            razorpay_order_id=order_data["id"],
            razorpay_payment_id=payment_id,
            razorpay_signature="valid",
        )
        requests.append(request)
        assert asyncio.run(verify_payment(request, db, user))["new_balance"] == expected_balance

    replay = asyncio.run(verify_payment(requests[0], db, user))
    assert replay["already_processed"] is True
    assert replay["new_balance"] == 46
    assert db.get(User, user.id).credits_balance == 46
    assert db.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 3
    assert db.query(PaymentReceipt).count() == 3


def test_provider_amount_mismatch_does_not_grant(db, user, fake_razorpay):
    create_local_order(db, user)
    fake_razorpay.payments["pay_1"] = {"order_id": "order_owned", "amount": 1, "currency": "INR", "status": "captured"}
    request = VerifyPaymentRequest(razorpay_order_id="order_owned", razorpay_payment_id="pay_1", razorpay_signature="valid")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(verify_payment(request, db, user))
    assert exc.value.status_code == 400
    assert db.get(User, user.id).credits_balance == 2


def test_provider_authorized_but_not_captured_does_not_grant(db, user, fake_razorpay):
    create_local_order(db, user)
    fake_razorpay.payments["pay_1"] = {
        "order_id": "order_owned",
        "amount": 35000,
        "currency": "INR",
        "status": "authorized",
    }
    request = VerifyPaymentRequest(
        razorpay_order_id="order_owned",
        razorpay_payment_id="pay_1",
        razorpay_signature="valid",
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(verify_payment(request, db, user))
    assert exc.value.status_code == 400
    assert db.get(User, user.id).credits_balance == 2


def test_atomic_payment_claim_is_idempotent(db, user):
    create_local_order(db, user)
    assert finalize_payment_purchase(db, user.id, "order_owned", "pay_1") == (22, False)
    assert finalize_payment_purchase(db, user.id, "order_owned", "pay_1") == (22, True)
    assert db.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 1


def test_concurrent_payment_finalization_grants_once(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'payment-race.db'}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    setup = Session()
    racing_user = User(email="payment-race@example.com", password_hash="hash", role="user", credits_balance=2)
    setup.add(racing_user)
    setup.commit()
    create_local_order(setup, racing_user, order_id="order_race")
    user_id = racing_user.id
    setup.close()

    def attempt():
        session = Session()
        try:
            return finalize_payment_purchase(session, user_id, "order_race", "pay_race")
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt(), range(2)))

    check = Session()
    assert sorted(results, key=lambda result: result[1]) == [(22, False), (22, True)]
    assert check.get(User, user_id).credits_balance == 22
    assert check.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 1
    assert check.query(PaymentReceipt).count() == 1
    check.close()
    engine.dispose()


def test_signup_keeps_two_credits_and_creates_welcome_ledger(db, monkeypatch):
    monkeypatch.setattr(user_auth_service, "send_verification_otp", lambda *args: None)
    created = create_user(db, "new@example.com", "strong-password", "New")
    transaction = db.query(CreditTransaction).filter_by(user_id=created.id).one()
    assert created.credits_balance == 2
    assert (transaction.transaction_type, transaction.amount, transaction.balance_after) == ("welcome_bonus", 2, 2)


def test_sufficient_credit_reservation_finalizes_with_audit_reference(db, user):
    reservation = reserve_audit_credits(db, user.id, 1)
    finalize_audit_reservation(db, reservation, [12])
    db.commit()
    db.refresh(user)
    transaction = db.query(CreditTransaction).one()
    assert user.credits_balance == 1
    assert (transaction.transaction_type, transaction.reference_type, transaction.reference_id) == ("audit_usage", "audit", "12")
    assert transaction.balance_after == 1


def test_insufficient_credit_rejected_without_negative_balance(db, user):
    reserve_audit_credits(db, user.id, 2)
    with pytest.raises(InsufficientCreditsError):
        reserve_audit_credits(db, user.id, 1)
    assert db.get(User, user.id).credits_balance == 0


def test_failed_reservation_release_restores_balance_and_removes_pending(db, user):
    reservation = reserve_audit_credits(db, user.id, 1)
    assert release_audit_reservation(db, reservation) is True
    assert db.get(User, user.id).credits_balance == 2
    assert db.query(CreditTransaction).count() == 0


def test_purchase_during_reservation_keeps_authoritative_audit_balance_after(db, user):
    reservation = reserve_audit_credits(db, user.id, 1)
    create_local_order(db, user)
    assert finalize_payment_purchase(db, user.id, "order_owned", "pay_interleaved") == (21, False)

    finalize_audit_reservation(db, reservation, [12])
    db.commit()

    assert db.get(User, user.id).credits_balance == 21
    usage = db.query(CreditTransaction).filter_by(transaction_type="audit_usage").one()
    assert usage.balance_after == 21


def test_two_concurrent_reservations_from_two_credits_both_succeed(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'two-reservations.db'}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    setup = Session()
    value = User(email="two@example.com", password_hash="hash", role="user", credits_balance=2)
    setup.add(value)
    setup.commit()
    user_id = value.id
    setup.close()
    barrier = Barrier(2)

    def attempt():
        session = Session()
        try:
            barrier.wait()
            return reserve_audit_credits(session, user_id, 1)
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        reservations = list(pool.map(lambda _: attempt(), range(2)))

    check = Session()
    assert len({reservation.transaction_id for reservation in reservations}) == 2
    assert check.get(User, user_id).credits_balance == 0
    assert check.query(CreditTransaction).filter_by(status="pending").count() == 2
    finalize_audit_reservation(check, reservations[0], [12])
    finalize_audit_reservation(check, reservations[1], [13])
    check.commit()
    assert check.get(User, user_id).credits_balance == 0
    assert {
        transaction.balance_after
        for transaction in check.query(CreditTransaction).filter_by(transaction_type="audit_usage").all()
    } == {0}
    check.close()
    engine.dispose()


def test_one_reserved_audit_succeeds_and_one_releases(db, user):
    first = reserve_audit_credits(db, user.id, 1)
    second = reserve_audit_credits(db, user.id, 1)
    finalize_audit_reservation(db, first, [12])
    db.commit()
    assert release_audit_reservation(db, second) is True

    assert db.get(User, user.id).credits_balance == 1
    assert db.query(CreditTransaction).filter_by(transaction_type="audit_usage").count() == 1
    assert db.query(CreditTransaction).filter_by(status="pending").count() == 0


def test_purchase_racing_with_release_has_no_lost_update(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'purchase-release.db'}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    setup = Session()
    value = User(email="purchase-release@example.com", password_hash="hash", role="user", credits_balance=1)
    setup.add(value)
    setup.commit()
    reservation = reserve_audit_credits(setup, value.id, 1)
    create_local_order(setup, value, order_id="order_purchase_release", plan_id="starter")
    user_id = value.id
    setup.close()
    barrier = Barrier(2)

    def purchase():
        session = Session()
        try:
            barrier.wait()
            return finalize_payment_purchase(session, user_id, "order_purchase_release", "pay_purchase_release")
        finally:
            session.close()

    def release():
        session = Session()
        try:
            barrier.wait()
            return release_audit_reservation(session, reservation)
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        purchase_result = pool.submit(purchase)
        release_result = pool.submit(release)
        assert purchase_result.result()[0] in {5, 6}
        assert release_result.result() is True

    check = Session()
    assert check.get(User, user_id).credits_balance == 6
    assert check.query(CreditTransaction).filter_by(transaction_type="purchase").count() == 1
    assert check.query(CreditTransaction).filter_by(status="pending").count() == 0
    check.close()
    engine.dispose()


def test_stale_reservation_is_recovered_exactly_once(db, user):
    reservation = reserve_audit_credits(db, user.id, 2)
    pending = db.get(CreditTransaction, reservation.transaction_id)
    pending.created_at = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    db.commit()

    assert recover_stale_audit_reservations(db, user_id=user.id) == 1
    assert recover_stale_audit_reservations(db, user_id=user.id) == 0
    assert db.get(User, user.id).credits_balance == 2
    assert db.query(CreditTransaction).count() == 0


def test_recent_pending_reservation_is_not_recovered(db, user):
    reservation = reserve_audit_credits(db, user.id, 1)
    assert recover_stale_audit_reservations(db, user_id=user.id) == 0
    assert db.get(User, user.id).credits_balance == 1
    assert db.get(CreditTransaction, reservation.transaction_id).status == "pending"


def test_recovery_racing_with_finalization_has_one_terminal_outcome(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'recovery-finalize.db'}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    setup = Session()
    value = User(email="recovery-race@example.com", password_hash="hash", role="user", credits_balance=2)
    setup.add(value)
    setup.commit()
    reservation = reserve_audit_credits(setup, value.id, 1)
    pending = setup.get(CreditTransaction, reservation.transaction_id)
    pending.created_at = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    setup.commit()
    user_id = value.id
    setup.close()
    barrier = Barrier(2)

    def finalize():
        session = Session()
        try:
            barrier.wait()
            finalize_audit_reservation(session, reservation, [12])
            session.commit()
            return True
        except RuntimeError:
            session.rollback()
            return False
        finally:
            session.close()

    def recover():
        session = Session()
        try:
            barrier.wait()
            return recover_stale_audit_reservations(session, user_id=user_id)
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        finalized_future = pool.submit(finalize)
        recovered_future = pool.submit(recover)
        finalized = finalized_future.result()
        recovered = recovered_future.result()

    check = Session()
    assert (finalized, recovered) in {(True, 0), (False, 1)}
    assert check.query(CreditTransaction).filter_by(status="pending").count() == 0
    assert check.query(CreditTransaction).filter_by(transaction_type="audit_usage").count() == int(finalized)
    assert check.get(User, user_id).credits_balance == (1 if finalized else 2)
    check.close()
    engine.dispose()


def test_completed_usage_is_never_recovered(db, user):
    reservation = reserve_audit_credits(db, user.id, 1)
    finalize_audit_reservation(db, reservation, [12])
    db.commit()
    usage = db.query(CreditTransaction).filter_by(transaction_type="audit_usage").one()
    usage.created_at = datetime.datetime.utcnow() - datetime.timedelta(days=1)
    db.commit()

    assert recover_stale_audit_reservations(db, user_id=user.id) == 0
    assert db.get(User, user.id).credits_balance == 1
    assert db.query(CreditTransaction).filter_by(transaction_type="audit_usage").count() == 1


def test_concurrent_consumption_cannot_overspend(tmp_path):
    engine = create_engine(
        f"sqlite+pysqlite:///{tmp_path / 'concurrent.db'}",
        connect_args={"check_same_thread": False, "timeout": 30},
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    setup = Session()
    setup.add(User(email="race@example.com", password_hash="hash", role="user", credits_balance=1))
    setup.commit()
    user_id = setup.query(User.id).scalar()
    setup.close()

    def attempt():
        session = Session()
        try:
            return reserve_audit_credits(session, user_id, 1)
        except InsufficientCreditsError:
            return None
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: attempt(), range(2)))
    check = Session()
    assert sum(result is not None for result in results) == 1
    assert check.get(User, user_id).credits_balance == 0
    assert check.query(CreditTransaction).filter_by(status="pending").count() == 1
    check.close()
    engine.dispose()


def test_successful_text_audit_consumes_one_and_links_ledger(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)
    request = AuditRequest(company_name="Text Co", industry="SaaS", policy_text="privacy " * 30)
    result = audit_policy(request, make_request(), db, user)
    db.refresh(user)
    transaction = db.query(CreditTransaction).filter_by(transaction_type="audit_usage").one()
    assert user.credits_balance == 1
    assert transaction.reference_id == str(result.id)


def test_successful_url_audit_consumes_one(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "extract_text_from_url", lambda url: "privacy " * 30)
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)
    request = AuditRequest(company_name="URL Co", industry="SaaS", policy_url="https://example.com/privacy")
    audit_policy(request, make_request(), db, user)
    db.refresh(user)
    assert user.credits_balance == 1
    assert db.query(CreditTransaction).filter_by(transaction_type="audit_usage").count() == 1


def test_failed_text_audit_does_not_consume_credit(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "perform_compliance_audit", lambda **kwargs: (_ for _ in ()).throw(RuntimeError("failed")))
    request = AuditRequest(company_name="Fail Co", industry="SaaS", policy_text="privacy " * 30)
    with pytest.raises(RuntimeError):
        audit_policy(request, make_request(), db, user)
    db.refresh(user)
    assert user.credits_balance == 2
    assert db.query(CreditTransaction).count() == 0


def test_successful_file_audit_consumes_one(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "extract_uploaded_policy", lambda file: "privacy " * 30)
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)
    from fastapi import UploadFile

    result = audit_policy_file(make_request(), "File Co", "SaaS", UploadFile(filename="policy.pdf", file=io.BytesIO(b"x")), db, user)
    db.refresh(user)
    assert user.credits_balance == 1
    assert db.query(CreditTransaction).one().reference_id == str(result.id)


def test_failed_file_audit_does_not_consume_credit(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "extract_uploaded_policy", lambda file: "privacy " * 30)
    monkeypatch.setattr(main_module, "perform_compliance_audit", lambda **kwargs: (_ for _ in ()).throw(RuntimeError("failed")))
    from fastapi import UploadFile

    with pytest.raises(RuntimeError):
        audit_policy_file(make_request(), "File Fail", "SaaS", UploadFile(filename="policy.pdf", file=io.BytesIO(b"x")), db, user)
    db.refresh(user)
    assert user.credits_balance == 2


def test_batch_cost_is_per_item_and_each_usage_links_to_audit(db, user, monkeypatch):
    user.credits_balance = 3
    db.commit()
    monkeypatch.setattr(main_module, "prepare_compliance_analysis", lambda *args: {})
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)
    request = BatchAuditRequest(items=[
        BatchAuditItem(company_name="URL Co", industry="SaaS", policy_text="privacy " * 30),
        BatchAuditItem(company_name="File Co", industry="FinTech", policy_text="privacy " * 30),
    ])
    result = audit_policy_batch(request, db, user)
    db.refresh(user)
    usage = db.query(CreditTransaction).filter_by(transaction_type="audit_usage").all()
    assert result["total_companies"] == 2
    assert user.credits_balance == 1
    assert {row.reference_id for row in usage} == {str(audit["id"]) for audit in result["audits"]}


def test_batch_finishes_external_analysis_before_persistence(db, user, monkeypatch):
    sequence = []

    def prepare(*args):
        assert not db.in_transaction()
        sequence.append("analyze")
        return {}

    def persist(**kwargs):
        sequence.append("persist")
        return fake_successful_audit(**kwargs)

    monkeypatch.setattr(main_module, "prepare_compliance_analysis", prepare)
    monkeypatch.setattr(main_module, "perform_compliance_audit", persist)
    audit_policy_batch(
        BatchAuditRequest(items=[
            BatchAuditItem(company_name="First", industry="SaaS", policy_text="privacy " * 30),
            BatchAuditItem(company_name="Second", industry="SaaS", policy_text="privacy " * 30),
        ]),
        db,
        user,
    )
    assert sequence == ["analyze", "analyze", "persist", "persist"]


def test_failed_batch_analysis_releases_full_reservation(db, user, monkeypatch):
    calls = 0

    def prepare(*args):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise RuntimeError("analysis failed")
        return {}

    monkeypatch.setattr(main_module, "prepare_compliance_analysis", prepare)
    with pytest.raises(RuntimeError):
        audit_policy_batch(
            BatchAuditRequest(items=[
                BatchAuditItem(company_name="First", industry="SaaS", policy_text="privacy " * 30),
                BatchAuditItem(company_name="Second", industry="SaaS", policy_text="privacy " * 30),
            ]),
            db,
            user,
        )
    db.refresh(user)
    assert user.credits_balance == 2
    assert db.query(CreditTransaction).count() == 0


def test_failed_batch_persistence_rolls_back_and_releases_full_reservation(db, user, monkeypatch):
    persistence_calls = 0

    def persist(**kwargs):
        nonlocal persistence_calls
        persistence_calls += 1
        if persistence_calls == 2:
            raise RuntimeError("persistence failed")
        return fake_successful_audit(**kwargs)

    monkeypatch.setattr(main_module, "prepare_compliance_analysis", lambda *args: {})
    monkeypatch.setattr(main_module, "perform_compliance_audit", persist)
    with pytest.raises(RuntimeError):
        audit_policy_batch(
            BatchAuditRequest(items=[
                BatchAuditItem(company_name="First", industry="SaaS", policy_text="privacy " * 30),
                BatchAuditItem(company_name="Second", industry="SaaS", policy_text="privacy " * 30),
            ]),
            db,
            user,
        )

    db.refresh(user)
    assert user.credits_balance == 2
    assert db.query(CreditTransaction).count() == 0
    assert db.query(Audit).count() == 0
    assert db.query(Policy).count() == 0
    assert db.query(Company).count() == 0


def test_batch_file_extraction_is_authenticated_and_never_bills(db, user, monkeypatch):
    monkeypatch.setattr(main_module, "extract_uploaded_policy", lambda file: "privacy " * 30)
    from fastapi import UploadFile

    result = extract_policy_file_for_batch(UploadFile(filename="policy.pdf", file=io.BytesIO(b"x")), user)
    assert result["policy_text"].startswith("privacy")
    assert db.get(User, user.id).credits_balance == 2
    assert db.query(CreditTransaction).count() == 0
    route = next(route for route in main_module.app.routes if getattr(route, "path", None) == "/api/audit/extract-file")
    assert main_module.get_current_user in {dependency.call for dependency in route.dependant.dependencies}


def test_realistic_phase_one_credit_scenario(db, fake_razorpay, monkeypatch):
    monkeypatch.setattr(user_auth_service, "send_verification_otp", lambda *args: None)
    scenario_user = create_user(db, "scenario@example.com", "strong-password", "Scenario")
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)

    first = audit_policy(
        AuditRequest(company_name="First Co", industry="SaaS", policy_text="privacy " * 30),
        make_request(),
        db,
        scenario_user,
    )
    db.refresh(scenario_user)
    assert scenario_user.credits_balance == 1
    assert db.query(CreditTransaction).filter_by(reference_id=str(first.id), transaction_type="audit_usage").count() == 1

    monkeypatch.setattr(main_module, "perform_compliance_audit", lambda **kwargs: (_ for _ in ()).throw(RuntimeError("failed")))
    with pytest.raises(RuntimeError):
        audit_policy(
            AuditRequest(company_name="Failed Co", industry="SaaS", policy_text="privacy " * 30),
            make_request(),
            db,
            scenario_user,
        )
    db.refresh(scenario_user)
    assert scenario_user.credits_balance == 1

    create_local_order(db, scenario_user, order_id="order_scenario", plan_id="pro")
    fake_razorpay.payments["pay_scenario"] = {
        "order_id": "order_scenario", "amount": 35000, "currency": "INR", "status": "captured"
    }
    payment_request = VerifyPaymentRequest(
        razorpay_order_id="order_scenario", razorpay_payment_id="pay_scenario", razorpay_signature="valid"
    )
    assert asyncio.run(verify_payment(payment_request, db, scenario_user))["new_balance"] == 21
    assert asyncio.run(verify_payment(payment_request, db, scenario_user))["already_processed"] is True

    monkeypatch.setattr(main_module, "prepare_compliance_analysis", lambda *args: {})
    monkeypatch.setattr(main_module, "perform_compliance_audit", fake_successful_audit)
    batch = audit_policy_batch(
        BatchAuditRequest(items=[
            BatchAuditItem(company_name="Batch URL", industry="SaaS", policy_text="privacy " * 30),
            BatchAuditItem(company_name="Batch File", industry="FinTech", policy_text="privacy " * 30),
        ]),
        db,
        scenario_user,
    )
    db.refresh(scenario_user)
    assert batch["total_companies"] == 2
    assert scenario_user.credits_balance == 19
    assert db.query(CreditTransaction).filter_by(user_id=scenario_user.id, transaction_type="purchase").count() == 1
    assert db.query(CreditTransaction).filter_by(user_id=scenario_user.id, transaction_type="audit_usage").count() == 3


@pytest.mark.parametrize("path", ["/api/credits/summary", "/api/credits/transactions", "/api/payments/history"])
def test_billing_history_endpoints_require_authentication(path):
    assert TestClient(main_module.app).get(path).status_code == 401


def test_credit_summary_uses_only_owner_completed_recorded_activity(db, user):
    user.credits_balance = 15
    other = User(email="summary-other@example.com", password_hash="hash", role="user", credits_balance=99)
    db.add(other)
    db.flush()
    db.add_all([
        CreditTransaction(user_id=user.id, amount=2, transaction_type="welcome_bonus", status="completed", reference_type="signup", reference_id=str(user.id), balance_after=2),
        CreditTransaction(user_id=user.id, amount=20, transaction_type="purchase", status="completed", reference_type="payment", reference_id="pay_summary", balance_after=22),
        CreditTransaction(user_id=user.id, amount=-1, transaction_type="audit_usage", status="completed", reference_type="audit", reference_id="10", balance_after=21),
        CreditTransaction(user_id=user.id, amount=-1, transaction_type="audit_reservation", status="pending", reference_type="audit", balance_after=20),
        CreditTransaction(user_id=user.id, amount=100, transaction_type="purchase", status="failed", reference_type="payment", balance_after=121),
        CreditTransaction(user_id=other.id, amount=100, transaction_type="purchase", status="completed", reference_type="payment", balance_after=199),
        CreditTransaction(user_id=other.id, amount=-10, transaction_type="audit_usage", status="completed", reference_type="audit", balance_after=189),
    ])
    db.commit()

    summary = get_credit_summary(db, user)
    assert summary == {
        "available_credits": 15,
        "recorded_purchased_credits": 20,
        "recorded_used_credits": 1,
        "has_incomplete_history": False,
    }


def test_credit_summary_marks_legacy_or_null_balance_history_incomplete(db, user):
    user.credits_balance = 15
    db.add(CreditTransaction(
        user_id=user.id,
        amount=20,
        transaction_type="purchase",
        status="completed",
        reference_type="payment",
        reference_id="pay_legacy",
        balance_after=None,
    ))
    db.commit()

    summary = get_credit_summary(db, user)
    assert summary["available_credits"] == 15
    assert summary["recorded_purchased_credits"] == 20
    assert summary["recorded_used_credits"] == 0
    assert summary["has_incomplete_history"] is True


def add_activity(db, user_id, *, amount, transaction_type, created_at, description, reference_id, balance_after, status="completed"):
    value = CreditTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        created_at=created_at,
        description=description,
        reference_type="payment" if transaction_type == "purchase" else "audit",
        reference_id=reference_id,
        balance_after=balance_after,
        status=status,
    )
    db.add(value)
    return value


def test_credit_activity_is_owner_scoped_newest_first_and_paginated(db, user):
    other = User(email="activity-other@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add(other)
    db.flush()
    base = datetime.datetime(2026, 9, 15, 10, 0, 0)
    add_activity(db, user.id, amount=5, transaction_type="purchase", created_at=base, description="Starter purchase", reference_id="pay_old", balance_after=7)
    middle = add_activity(db, user.id, amount=-1, transaction_type="audit_usage", created_at=base + datetime.timedelta(minutes=1), description="Policy audit", reference_id="10", balance_after=6)
    newest = add_activity(db, user.id, amount=20, transaction_type="purchase", created_at=base + datetime.timedelta(minutes=2), description="Pro purchase", reference_id="pay_newest", balance_after=26)
    add_activity(db, other.id, amount=100, transaction_type="purchase", created_at=base + datetime.timedelta(minutes=3), description="Other purchase", reference_id="pay_other", balance_after=102)
    db.commit()

    first = get_credit_transactions(1, 2, "", "all", db, user)
    second = get_credit_transactions(2, 2, "", "all", db, user)
    assert first["total"] == 3 and first["total_pages"] == 2
    assert [item["id"] for item in first["items"]] == [newest.id, middle.id]
    assert len(second["items"]) == 1
    assert all(item["reference_id"] != "pay_other" for item in first["items"] + second["items"])


def test_credit_activity_search_filter_pending_and_null_balance_handling(db, user):
    now = datetime.datetime.utcnow()
    add_activity(db, user.id, amount=20, transaction_type="purchase", created_at=now, description="Pro consulting pack", reference_id="pay_searchable_9876", balance_after=None)
    add_activity(db, user.id, amount=-1, transaction_type="audit_usage", created_at=now + datetime.timedelta(seconds=1), description="Policy audit", reference_id="42", balance_after=1)
    add_activity(db, user.id, amount=-1, transaction_type="audit_reservation", created_at=now + datetime.timedelta(seconds=2), description="Internal reservation", reference_id="pending", balance_after=0, status="pending")
    db.commit()

    searched = get_credit_transactions(1, 10, "consulting", "all", db, user)
    purchases = get_credit_transactions(1, 10, "", "purchases", db, user)
    usage = get_credit_transactions(1, 10, "", "usage", db, user)
    assert searched["total"] == 1
    assert purchases["total"] == 1 and purchases["items"][0]["balance_after"] is None
    assert purchases["items"][0]["reference_id"] == "pay_••••9876"
    assert usage["total"] == 1 and usage["items"][0]["reference_id"] == "42"
    assert all(item["transaction_type"] != "audit_reservation" for item in purchases["items"] + usage["items"])


def add_payment(db, user_id, *, order_id, payment_id, plan_name, plan_id, status, created_at, credits=20, amount=35000):
    value = PaymentOrder(
        user_id=user_id,
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        plan_name=plan_name,
        plan_id=plan_id,
        status=status,
        created_at=created_at,
        verified_at=created_at if status == "verified" else None,
        credits_purchased=credits,
        amount_paid=amount,
        currency="INR",
    )
    db.add(value)
    return value


def test_payment_history_is_owner_scoped_newest_first_and_paginated(db, user):
    other = User(email="payment-other@example.com", password_hash="hash", role="user", credits_balance=2)
    db.add(other)
    db.flush()
    base = datetime.datetime(2026, 9, 15, 10, 0, 0)
    add_payment(db, user.id, order_id="order_old", payment_id="pay_old_1111", plan_name="Starter Pack", plan_id="starter", status="verified", created_at=base, credits=5, amount=10000)
    middle = add_payment(db, user.id, order_id="order_middle", payment_id=None, plan_name="Pro Pack", plan_id="pro", status="created", created_at=base + datetime.timedelta(minutes=1))
    newest = add_payment(db, user.id, order_id="order_new", payment_id="pay_new_3333", plan_name="Pro Pack", plan_id="pro", status="verified", created_at=base + datetime.timedelta(minutes=2))
    add_payment(db, other.id, order_id="order_other", payment_id="pay_other_4444", plan_name="Enterprise Batch", plan_id="enterprise", status="verified", created_at=base + datetime.timedelta(minutes=3), credits=100, amount=150000)
    db.commit()

    first = get_payment_history(1, 2, "", "all", db, user)
    second = get_payment_history(2, 2, "", "all", db, user)
    assert first["total"] == 3 and first["total_pages"] == 2
    assert [item["id"] for item in first["items"]] == [newest.id, middle.id]
    assert len(second["items"]) == 1
    assert all("other" not in item["payment_reference"] for item in first["items"] + second["items"])


def test_payment_history_search_status_legacy_and_safe_fields(db, user):
    now = datetime.datetime.utcnow()
    add_payment(db, user.id, order_id="order_legacy_1111", payment_id=None, plan_name=None, plan_id=None, status="created", created_at=now, credits=7, amount=14000)
    add_payment(db, user.id, order_id="order_pro_2222", payment_id="pay_pro_9876", plan_name="Pro Pack", plan_id="pro", status="verified", created_at=now + datetime.timedelta(seconds=1))
    db.commit()

    searched = get_payment_history(1, 10, "9876", "all", db, user)
    pending = get_payment_history(1, 10, "", "created", db, user)
    assert searched["total"] == 1
    assert searched["items"][0]["payment_reference"] == "pay_••••9876"
    assert set(searched["items"][0]) == {
        "id", "plan_id", "plan_name", "credits_purchased", "amount_paise", "currency",
        "status", "payment_reference", "created_at", "verified_at", "receipt_available", "receipt_number",
    }
    assert pending["items"][0]["plan_name"] == "Legacy Credit Purchase"
    assert pending["items"][0]["receipt_available"] is False
    assert pending["items"][0]["receipt_number"] is None
    assert pending["items"][0]["payment_reference"] == "order_••••1111"
    assert "signature" not in pending["items"][0]


def test_frontend_uses_server_plans_and_sends_only_plan_id():
    pricing = (REPO_DIR / "frontend/src/app/pricing/page.tsx").read_text(encoding="utf-8")
    billing = (REPO_DIR / "frontend/src/app/account/billing/page.tsx").read_text(encoding="utf-8")
    api = (REPO_DIR / "frontend/src/lib/api.ts").read_text(encoding="utf-8")
    assert "getCreditPlans()" in pricing
    assert "const pricingTiers = [" not in pricing
    assert all(call not in pricing for call in (
        "getCreditSummary()",
        "getCreditActivity({",
        "getPaymentHistory({",
        "createPaymentOrder(",
        "verifyPaymentSignature(",
        "downloadPaymentReceipt(",
    ))
    assert "createPaymentOrder(tier.id)" in billing
    assert "JSON.stringify({ plan_id: planId })" in api
    assert "JSON.stringify({ credits })" not in api


def test_frontend_distinguishes_402_and_offers_buy_credits():
    api = (REPO_DIR / "frontend/src/lib/api.ts").read_text(encoding="utf-8")
    new_audit = (REPO_DIR / "frontend/src/app/audit/new/page.tsx").read_text(encoding="utf-8")
    batch = (REPO_DIR / "frontend/src/app/audit/batch/page.tsx").read_text(encoding="utf-8")
    assert "error.status === 402" in api
    assert 'href="/account/billing"' in new_audit and "Buy Credits" in new_audit
    assert 'href="/account/billing"' in batch and "Buy Credits" in batch


def test_frontend_uses_one_refresh_helper_and_extraction_only_batch_path():
    billing = (REPO_DIR / "frontend/src/app/account/billing/page.tsx").read_text(encoding="utf-8")
    new_audit = (REPO_DIR / "frontend/src/app/audit/new/page.tsx").read_text(encoding="utf-8")
    batch = (REPO_DIR / "frontend/src/app/audit/batch/page.tsx").read_text(encoding="utf-8")
    session = (REPO_DIR / "frontend/src/lib/auth/session.ts").read_text(encoding="utf-8")
    assert "auth_session_change" not in billing
    assert all("notifyAuthSessionChanged()" in source for source in (billing, new_audit, batch))
    assert "export function notifyAuthSessionChanged" in session
    assert "extractAuditFile(c.file)" in batch
    assert "createAuditWithFile(c.name" not in batch


def test_phase_two_frontend_uses_server_history_and_refreshes_after_purchase():
    billing = (REPO_DIR / "frontend/src/app/account/billing/page.tsx").read_text(encoding="utf-8")
    api = (REPO_DIR / "frontend/src/lib/api.ts").read_text(encoding="utf-8")
    layout = (REPO_DIR / "frontend/src/app/layout.tsx").read_text(encoding="utf-8")
    routes = (REPO_DIR / "frontend/src/lib/auth/routes.ts").read_text(encoding="utf-8")

    assert all(call in billing for call in (
        "getCreditSummary()",
        "getCreditActivity({",
        "getPaymentHistory({",
    ))
    assert all(route in api for route in (
        '"/credits/summary"',
        "`/credits/transactions?${query}`",
        "`/payments/history?${query}`",
    ))
    assert "page_size" in api and "type_filter" in api and "status_filter" in api
    verification = billing.index("await verifyPaymentSignature(")
    assert billing.index("notifyAuthSessionChanged();", verification) > verification
    assert billing.index("refreshBilling();", verification) > verification
    assert 'href="/account/billing"' in layout
    assert '"/pricing"' in routes


def test_public_pricing_and_authenticated_billing_are_separated():
    landing = (REPO_DIR / "frontend/src/app/page.tsx").read_text(encoding="utf-8")
    pricing = (REPO_DIR / "frontend/src/app/pricing/page.tsx").read_text(encoding="utf-8")
    routes = (REPO_DIR / "frontend/src/lib/auth/routes.ts").read_text(encoding="utf-8")
    return_path = (REPO_DIR / "frontend/src/lib/auth/return-path.ts").read_text(encoding="utf-8")

    public_paths = routes.split("const APP_SHELL_HIDDEN_PATHS", 1)[0]
    assert 'href="/pricing"' in landing
    assert '"/pricing"' in public_paths
    assert '"/account/billing"' not in public_paths
    assert 'const BILLING_PATH = "/account/billing"' in pricing
    assert "isAuthenticated() ? BILLING_PATH : LOGIN_FOR_BILLING" in pricing
    assert '"/account/billing"' in return_path
    assert "ALLOWED_RETURN_PATHS.has(requestedPath)" in return_path
