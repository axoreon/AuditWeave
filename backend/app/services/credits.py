import datetime
import os
import uuid
from dataclasses import dataclass
from typing import Iterable

from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import CreditTransaction, PaymentOrder, PaymentReceipt, User


WELCOME_CREDITS = 2
DEFAULT_RESERVATION_TIMEOUT_MINUTES = 360


def reservation_timeout_minutes() -> int:
    raw_value = os.getenv("CREDIT_RESERVATION_TIMEOUT_MINUTES", str(DEFAULT_RESERVATION_TIMEOUT_MINUTES))
    try:
        return max(int(raw_value), 60)
    except ValueError:
        return DEFAULT_RESERVATION_TIMEOUT_MINUTES

CREDIT_PACKS = {
    "starter": {
        "id": "starter",
        "title": "Starter Pack",
        "credits": 5,
        "price_inr": 100,
        "currency": "INR",
        "description": "Perfect for one-off DPDP compliance audits and SMBs.",
        "popular": False,
        "features": ["5 Compliance Audits", "Full PDF/DOCX Reports", "Basic Gap Analysis", "Standard Email Support"],
    },
    "pro": {
        "id": "pro",
        "title": "Pro Pack",
        "credits": 20,
        "price_inr": 350,
        "currency": "INR",
        "description": "Ideal for growing agencies and compliance consultants.",
        "popular": True,
        "features": ["20 Compliance Audits", "Bulk Audit Pipeline", "Remediated Policy Exports", "Priority GRC Support"],
    },
    "enterprise": {
        "id": "enterprise",
        "title": "Enterprise Batch",
        "credits": 100,
        "price_inr": 1500,
        "currency": "INR",
        "description": "Mass auditing capabilities for law firms and enterprises.",
        "popular": False,
        "features": ["100 Compliance Audits", "API Access (Coming Soon)", "Custom Whitelabeling", "Dedicated Account Manager"],
    },
}


class InsufficientCreditsError(Exception):
    pass


class PaymentAlreadyUsedError(Exception):
    pass


class PaymentOrderNotProcessableError(Exception):
    pass


@dataclass(frozen=True)
class CreditReservation:
    transaction_id: int
    user_id: int
    credits: int
    balance_after: int


def list_credit_packs() -> list[dict]:
    return [dict(pack) for pack in CREDIT_PACKS.values()]


def get_credit_pack(plan_id: str) -> dict | None:
    pack = CREDIT_PACKS.get(plan_id.strip().lower())
    return dict(pack) if pack else None


def create_welcome_transaction(user: User) -> CreditTransaction:
    return CreditTransaction(
        user_id=user.id,
        amount=WELCOME_CREDITS,
        transaction_type="welcome_bonus",
        reference_type="signup",
        reference_id=str(user.id),
        balance_after=WELCOME_CREDITS,
        description="Welcome credits",
        status="completed",
    )


def reserve_audit_credits(db: Session, user_id: int, credits: int) -> CreditReservation:
    if credits <= 0:
        raise ValueError("credits must be positive")

    recover_stale_audit_reservations(db, user_id=user_id)

    result = db.execute(
        update(User)
        .where(User.id == user_id, User.credits_balance >= credits)
        .values(credits_balance=User.credits_balance - credits)
        .returning(User.credits_balance)
        .execution_options(synchronize_session=False)
    ).first()
    if result is None:
        db.rollback()
        raise InsufficientCreditsError

    balance_after = int(result[0])
    pending = CreditTransaction(
        user_id=user_id,
        amount=-credits,
        transaction_type="audit_reservation",
        reference_type="audit",
        balance_after=balance_after,
        description=f"Reserved {credits} credit(s) for audit processing",
        status="pending",
    )
    db.add(pending)
    db.flush()
    transaction_id = pending.id
    db.commit()
    db.expire_all()
    return CreditReservation(transaction_id, user_id, credits, balance_after)


def finalize_audit_reservation(
    db: Session,
    reservation: CreditReservation,
    audit_ids: Iterable[int],
) -> None:
    ids = [int(audit_id) for audit_id in audit_ids]

    claimed = db.execute(
        update(CreditTransaction)
        .where(
            CreditTransaction.id == reservation.transaction_id,
            CreditTransaction.user_id == reservation.user_id,
            CreditTransaction.transaction_type == "audit_reservation",
            CreditTransaction.status == "pending",
        )
        .values(status="finalizing")
        .returning(CreditTransaction.amount)
        .execution_options(synchronize_session=False)
    ).first()
    if claimed is None:
        raise RuntimeError("Credit reservation is no longer available")
    reserved_credits = -int(claimed[0])
    if reserved_credits <= 0 or len(ids) != reserved_credits:
        raise ValueError("Each reserved credit must map to one successful audit")

    authoritative_balance = (
        db.query(User.credits_balance)
        .filter(User.id == reservation.user_id)
        .with_for_update()
        .scalar()
    )
    if authoritative_balance is None:
        raise RuntimeError("Reservation user is no longer available")

    db.query(CreditTransaction).filter(
        CreditTransaction.id == reservation.transaction_id,
        CreditTransaction.status == "finalizing",
    ).delete(synchronize_session=False)
    for audit_id in ids:
        db.add(CreditTransaction(
            user_id=reservation.user_id,
            amount=-1,
            transaction_type="audit_usage",
            reference_type="audit",
            reference_id=str(audit_id),
            balance_after=int(authoritative_balance),
            description=f"Compliance audit #{audit_id}",
            status="completed",
        ))


def release_audit_reservation(db: Session, reservation: CreditReservation) -> bool:
    db.rollback()
    claimed = db.execute(
        update(CreditTransaction)
        .where(
            CreditTransaction.id == reservation.transaction_id,
            CreditTransaction.user_id == reservation.user_id,
            CreditTransaction.transaction_type == "audit_reservation",
            CreditTransaction.status == "pending",
        )
        .values(status="releasing")
        .returning(CreditTransaction.amount)
        .execution_options(synchronize_session=False)
    ).first()
    if claimed is None:
        db.rollback()
        return False
    reserved_credits = -int(claimed[0])
    if reserved_credits <= 0:
        db.rollback()
        raise RuntimeError("Invalid pending credit reservation")

    db.execute(
        update(User)
        .where(User.id == reservation.user_id)
        .values(credits_balance=User.credits_balance + reserved_credits)
        .execution_options(synchronize_session=False)
    )
    db.query(CreditTransaction).filter(
        CreditTransaction.id == reservation.transaction_id,
        CreditTransaction.status == "releasing",
    ).delete(synchronize_session=False)
    db.commit()
    db.expire_all()
    return True


def recover_stale_audit_reservations(
    db: Session,
    user_id: int | None = None,
    stale_before: datetime.datetime | None = None,
) -> int:
    """Refund expired pending reservations exactly once using persisted database state."""
    cutoff = stale_before or (
        datetime.datetime.utcnow()
        - datetime.timedelta(minutes=reservation_timeout_minutes())
    )
    conditions = [
        CreditTransaction.transaction_type == "audit_reservation",
        CreditTransaction.status == "pending",
        CreditTransaction.created_at < cutoff,
    ]
    if user_id is not None:
        conditions.append(CreditTransaction.user_id == user_id)

    claimed_reservations = db.execute(
        update(CreditTransaction)
        .where(*conditions)
        .values(status="recovering")
        .returning(CreditTransaction.id, CreditTransaction.user_id, CreditTransaction.amount)
        .execution_options(synchronize_session=False)
    ).all()

    recovered = 0
    for transaction_id, reservation_user_id, amount in claimed_reservations:
        reserved_credits = -int(amount)
        if reserved_credits <= 0:
            raise RuntimeError("Invalid pending credit reservation")
        db.execute(
            update(User)
            .where(User.id == int(reservation_user_id))
            .values(credits_balance=User.credits_balance + reserved_credits)
            .execution_options(synchronize_session=False)
        )
        db.query(CreditTransaction).filter(
            CreditTransaction.id == transaction_id,
            CreditTransaction.status == "recovering",
        ).delete(synchronize_session=False)
        recovered += 1

    db.commit()
    db.expire_all()
    return recovered


def finalize_payment_purchase(
    db: Session,
    user_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
) -> tuple[int, bool]:
    """Atomically claim an owned order, grant its snapshot credits, and ledger it once."""
    recover_stale_audit_reservations(db, user_id=user_id)
    try:
        claimed = db.execute(
            update(PaymentOrder)
            .where(
                PaymentOrder.razorpay_order_id == razorpay_order_id,
                PaymentOrder.user_id == user_id,
                PaymentOrder.status.in_(["created", "failed"]),
                PaymentOrder.razorpay_payment_id.is_(None),
            )
            .values(
                status="processing",
                razorpay_payment_id=razorpay_payment_id,
            )
            .returning(
                PaymentOrder.id,
                PaymentOrder.credits_purchased,
                PaymentOrder.plan_id,
                PaymentOrder.plan_name,
                PaymentOrder.amount_paid,
                PaymentOrder.currency,
                PaymentOrder.razorpay_order_id,
            )
            .execution_options(synchronize_session=False)
        ).first()
        if claimed is None:
            existing = db.query(PaymentOrder).filter(
                PaymentOrder.razorpay_order_id == razorpay_order_id,
                PaymentOrder.user_id == user_id,
            ).one_or_none()
            if (
                existing is not None
                and existing.status == "verified"
                and existing.razorpay_payment_id == razorpay_payment_id
            ):
                balance = db.query(User.credits_balance).filter(User.id == user_id).scalar()
                db.rollback()
                return int(balance), True
            db.rollback()
            raise PaymentOrderNotProcessableError

        order_pk, credits, plan_id, plan_name, amount_paid, currency, provider_order_reference = claimed
        balance_result = db.execute(
            update(User)
            .where(User.id == user_id)
            .values(credits_balance=User.credits_balance + int(credits))
            .returning(User.credits_balance)
            .execution_options(synchronize_session=False)
        ).first()
        if balance_result is None:
            raise PaymentOrderNotProcessableError
        new_balance = int(balance_result[0])

        db.add(CreditTransaction(
            user_id=user_id,
            amount=int(credits),
            transaction_type="purchase",
            reference_type="payment",
            reference_id=razorpay_payment_id,
            balance_after=new_balance,
            description=f"{plan_name or 'Credit pack'} purchase",
            status="completed",
        ))
        paid_at = datetime.datetime.utcnow()
        db.execute(
            update(PaymentOrder)
            .where(PaymentOrder.id == int(order_pk), PaymentOrder.status == "processing")
            .values(status="verified", verified_at=paid_at)
            .execution_options(synchronize_session=False)
        )

        # Only Phase-3-ready orders have trustworthy plan snapshots. Legacy orders remain
        # receipt-unavailable rather than receiving reconstructed financial documents.
        if plan_id and plan_name:
            customer = db.query(User.first_name, User.email).filter(User.id == user_id).one()
            receipt_token = uuid.uuid4().hex
            db.add(PaymentReceipt(
                public_id=receipt_token,
                receipt_number=f"AW-RCP-{paid_at.year}-{receipt_token[:16].upper()}",
                user_id=user_id,
                payment_order_id=int(order_pk),
                plan_id=str(plan_id),
                plan_name=str(plan_name),
                credits_purchased=int(credits),
                amount_paid=int(amount_paid),
                currency=str(currency or "INR"),
                provider="Razorpay",
                provider_order_reference=str(provider_order_reference),
                payment_reference=razorpay_payment_id,
                customer_name=customer.first_name,
                customer_email=customer.email,
                paid_at=paid_at,
                created_at=paid_at,
                email_status="pending",
                email_attempts=0,
            ))
        db.commit()
        db.expire_all()
        return new_balance, False
    except IntegrityError as exc:
        db.rollback()
        raise PaymentAlreadyUsedError from exc
    except Exception:
        db.rollback()
        raise
