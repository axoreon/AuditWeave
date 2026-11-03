"""Secure password-reset OTP and one-time authorization lifecycle."""
from __future__ import annotations

import datetime
import hashlib
import secrets

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..auth import get_password_hash
from ..models import AuditLog, PasswordReset, User
from .email_otp import (
    AUTH_OTP_EXPIRY_MINUTES,
    SmtpDeliveryError,
    generate_otp,
    hash_otp,
    send_password_reset_otp,
    verify_otp_hash,
)

RESET_OTP_EXPIRY_MINUTES = AUTH_OTP_EXPIRY_MINUTES
RESET_RESEND_COOLDOWN_SECONDS = 60
RESET_MAX_ATTEMPTS = 5
RESET_AUTHORIZATION_MINUTES = 10


class PasswordResetInvalidError(Exception):
    """Reset OTP or authorization is absent or invalid."""


class PasswordResetExpiredError(Exception):
    """Reset OTP or authorization has expired."""


class PasswordResetAttemptLimitError(Exception):
    """Too many reset OTP guesses were submitted."""


class PasswordResetDatabaseError(Exception):
    """Database access failed during password recovery."""


class PasswordResetDeliveryError(Exception):
    """Reset state was rolled back because the security email was not delivered."""


def _now() -> datetime.datetime:
    return datetime.datetime.utcnow()


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def request_password_reset(db: Session, email: str) -> None:
    """
    Issue a reset OTP when an eligible account exists.

    Unknown/unverified emails and cooldown intentionally have the same silent
    outcome. Delivery failures are reported as a generic service failure so the
    API never claims a reset email was sent when delivery is known to have failed.
    """
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
        if not user or not user.is_email_verified:
            return

        record = db.query(PasswordReset).filter(PasswordReset.user_id == user.id).first()
        now = _now()
        if record and now < record.resend_after:
            return

        otp = generate_otp()
        values = {
            "otp_hash": hash_otp(otp),
            "expires_at": now + datetime.timedelta(minutes=RESET_OTP_EXPIRY_MINUTES),
            "resend_after": now + datetime.timedelta(seconds=RESET_RESEND_COOLDOWN_SECONDS),
            "attempts": 0,
            "reset_token_hash": None,
            "reset_token_expires_at": None,
            "created_at": now,
        }
        if record:
            for key, value in values.items():
                setattr(record, key, value)
        else:
            record = PasswordReset(user_id=user.id, **values)
            db.add(record)
        db.flush()

        try:
            send_password_reset_otp(user.email, user.first_name or "", otp)
        except SmtpDeliveryError as exc:
            db.rollback()
            raise PasswordResetDeliveryError from exc

        db.commit()
    except PasswordResetDeliveryError:
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise PasswordResetDatabaseError from exc


def verify_password_reset_otp(db: Session, email: str, otp_candidate: str) -> str:
    """Consume a valid reset OTP and return a short-lived one-time authorization."""
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
        record = (
            db.query(PasswordReset)
            .filter(PasswordReset.user_id == user.id)
            .first()
            if user
            else None
        )
        if not record or not record.otp_hash:
            raise PasswordResetInvalidError
        if record.attempts >= RESET_MAX_ATTEMPTS:
            raise PasswordResetAttemptLimitError
        if _now() > record.expires_at:
            raise PasswordResetExpiredError
        if not verify_otp_hash(otp_candidate, record.otp_hash):
            record.attempts += 1
            db.commit()
            raise PasswordResetInvalidError

        reset_token = secrets.token_urlsafe(32)
        record.otp_hash = None
        record.reset_token_hash = _hash_reset_token(reset_token)
        record.reset_token_expires_at = _now() + datetime.timedelta(
            minutes=RESET_AUTHORIZATION_MINUTES
        )
        db.commit()
        return reset_token
    except (
        PasswordResetInvalidError,
        PasswordResetExpiredError,
        PasswordResetAttemptLimitError,
    ):
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise PasswordResetDatabaseError from exc


def complete_password_reset(
    db: Session,
    email: str,
    reset_token: str,
    new_password: str,
) -> None:
    """Use the one-time authorization, update the password, and delete reset state."""
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
        record = (
            db.query(PasswordReset)
            .filter(PasswordReset.user_id == user.id)
            .first()
            if user
            else None
        )
        if not record or not record.reset_token_hash or not record.reset_token_expires_at:
            raise PasswordResetInvalidError
        if _now() > record.reset_token_expires_at:
            raise PasswordResetExpiredError
        if not secrets.compare_digest(
            _hash_reset_token(reset_token),
            record.reset_token_hash,
        ):
            raise PasswordResetInvalidError

        user.password_hash = get_password_hash(new_password)
        db.delete(record)
        db.add(AuditLog(action="User password reset completed", user_id=user.id))
        db.commit()
    except (PasswordResetInvalidError, PasswordResetExpiredError):
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise PasswordResetDatabaseError from exc
