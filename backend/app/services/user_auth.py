"""
user_auth.py — User registration, login, and email-OTP verification logic.

SECURITY NOTES:
- OTPs are stored as SHA-256 hashes only. Plaintext is never persisted.
- Failed attempts are bounded by MAX_OTP_ATTEMPTS.
- Resend cooldown is enforced server-side.
- New OTP on resend invalidates the previous one (hash replaced in-place).
- SMTP failures surface a specific error so the caller can tell the user accurately.
- Login does NOT require OTP; it is only needed once at signup verification.
"""
from __future__ import annotations

import datetime

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from ..auth import get_password_hash, verify_password
from ..models import AuditLog, EmailVerification, User
from .credits import WELCOME_CREDITS, create_welcome_transaction
from .email_otp import (
    AUTH_OTP_EXPIRY_MINUTES,
    SmtpDeliveryError,
    email_verification_disabled,
    generate_otp,
    hash_otp,
    send_verification_otp,
    verify_otp_hash,
)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OTP_EXPIRY_MINUTES = AUTH_OTP_EXPIRY_MINUTES
RESEND_COOLDOWN_SECONDS = 60
MAX_OTP_ATTEMPTS = 5  # after this many wrong guesses the row is unusable
DUMMY_PASSWORD_HASH = get_password_hash("AuditWeave timing equalization value")


# ---------------------------------------------------------------------------
# Exception hierarchy
# ---------------------------------------------------------------------------

class EmailAlreadyRegisteredError(Exception):
    pass


class AuthDatabaseError(Exception):
    pass


class OtpNotFoundError(Exception):
    """No pending verification record exists for this user."""


class OtpExpiredError(Exception):
    """The OTP has passed its expiry time."""


class OtpInvalidError(Exception):
    """The supplied OTP does not match the stored hash."""


class OtpAttemptLimitError(Exception):
    """Too many failed attempts — user must request a fresh OTP."""


class OtpResendCooldownError(Exception):
    """Resend requested before the cooldown window has elapsed."""


class SmtpError(Exception):
    """Wraps SmtpDeliveryError so callers don't import from email_otp directly."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _now() -> datetime.datetime:
    return datetime.datetime.utcnow()


def _issue_otp(db: Session, user: User) -> str:
    """
    Generate a new OTP, hash it, and upsert the EmailVerification row.
    Returns the plaintext OTP (must be sent to the user immediately and
    then discarded — never stored or logged).
    """
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    now = _now()
    expires_at = now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)
    resend_after = now + datetime.timedelta(seconds=RESEND_COOLDOWN_SECONDS)

    existing = db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id
    ).first()

    if existing:
        # Replace the previous OTP (invalidates it) and reset attempt counter.
        existing.otp_hash = otp_hash
        existing.expires_at = expires_at
        existing.resend_after = resend_after
        existing.attempts = 0
        existing.created_at = now
    else:
        record = EmailVerification(
            user_id=user.id,
            otp_hash=otp_hash,
            expires_at=expires_at,
            resend_after=resend_after,
            attempts=0,
            created_at=now,
        )
        db.add(record)

    db.flush()
    # NOTE: do NOT log `otp` here — it must reach the user exclusively via email.
    return otp


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_user(db: Session, email: str, password: str, first_name: str) -> User:
    """
    Register a new user as UNVERIFIED, generate an OTP, and dispatch the
    verification email.

    The user row is committed with is_email_verified=False.
    Raises:
        EmailAlreadyRegisteredError
        AuthDatabaseError
        SmtpError — SMTP failed; user not created (transaction rolled back).
    """
    try:
        existing = db.query(User).filter(func.lower(User.email) == email).first()
        if existing:
            raise EmailAlreadyRegisteredError

        user = User(
            email=email,
            first_name=first_name,
            password_hash=get_password_hash(password),
            role="user",
            credits_balance=WELCOME_CREDITS,
            is_email_verified=False,
        )
        db.add(user)
        db.flush()
        db.add(create_welcome_transaction(user))
        db.add(AuditLog(action=f"User registration (pending verification): {user.email}", user_id=user.id))

        if email_verification_disabled():
            user.is_email_verified = True
            db.commit()
            db.refresh(user)
            return user

        # Generate and store the OTP hash before delivery so SMTP or database
        # failures roll back the entire pending account atomically.
        otp = _issue_otp(db, user)

        try:
            send_verification_otp(user.email, user.first_name or "", otp)
        except SmtpDeliveryError as exc:
            raise SmtpError("Verification email delivery failed.") from exc

        db.commit()
        db.refresh(user)

    except EmailAlreadyRegisteredError:
        db.rollback()
        raise
    except SmtpError:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Validate credentials for login.

    Returns the User if credentials match, or None. The login route enforces
    verification before issuing a JWT, while protected routes enforce it again.

    Raises AuthDatabaseError on DB failure.
    """
    try:
        user = db.query(User).filter(func.lower(User.email) == email).first()
        if not user:
            # Perform the same expensive password verification work for unknown
            # emails so the common login paths are less distinguishable by time.
            verify_password(password, DUMMY_PASSWORD_HASH)
            return None
        if not verify_password(password, user.password_hash):
            return None

        return user
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc


def verify_signup_otp(db: Session, email: str, otp_candidate: str) -> User:
    """
    Validate the OTP for a pending email verification.

    On success: marks user as verified and deletes the verification record.
    On failure: increments the attempt counter.

    Raises:
        OtpNotFoundError     — no verification record (already verified or wrong email)
        OtpAttemptLimitError — max wrong attempts reached
        OtpExpiredError      — OTP has expired
        OtpInvalidError      — wrong OTP submitted
        AuthDatabaseError    — DB failure
    """
    try:
        # Find the user without revealing whether the email exists in error messages.
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
        if not user:
            # Return a generic "not found" to avoid email enumeration.
            raise OtpNotFoundError

        record = db.query(EmailVerification).filter(
            EmailVerification.user_id == user.id
        ).first()

        if not record:
            raise OtpNotFoundError

        if record.attempts >= MAX_OTP_ATTEMPTS:
            raise OtpAttemptLimitError

        if _now() > record.expires_at:
            raise OtpExpiredError

        if not verify_otp_hash(otp_candidate, record.otp_hash):
            record.attempts += 1
            db.flush()
            db.commit()
            raise OtpInvalidError

        # Success — mark verified and remove the record.
        user.is_email_verified = True
        db.delete(record)
        db.add(AuditLog(action=f"Email verified: {user.email}", user_id=user.id))
        db.commit()
        db.refresh(user)
        return user

    except (OtpNotFoundError, OtpAttemptLimitError, OtpExpiredError, OtpInvalidError):
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc


def resend_signup_otp(db: Session, email: str) -> None:
    """
    Issue a new OTP for a pending email verification.

    Enforces the 60-second resend cooldown.
    Does NOT reveal whether the email exists (generic error on unknown email).

    Raises:
        OtpNotFoundError      — account already verified or email unknown
        OtpResendCooldownError — too soon since last send
        SmtpError             — SMTP delivery failed
        AuthDatabaseError     — DB failure
    """
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()

        # Generic response regardless of whether the user exists.
        if not user or user.is_email_verified:
            raise OtpNotFoundError

        record = db.query(EmailVerification).filter(
            EmailVerification.user_id == user.id
        ).first()

        if record and _now() < record.resend_after:
            raise OtpResendCooldownError

        otp = _issue_otp(db, user)

        try:
            send_verification_otp(user.email, user.first_name or "", otp)
        except SmtpDeliveryError as exc:
            raise SmtpError("Verification email delivery failed.") from exc

        db.commit()

    except (OtpNotFoundError, OtpResendCooldownError):
        db.rollback()
        raise
    except SmtpError:
        # Preserve the previous OTP if the replacement email was not delivered.
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc
