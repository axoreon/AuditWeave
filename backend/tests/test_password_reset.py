from __future__ import annotations

import datetime
import os
import sys
from unittest.mock import patch

import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth import get_password_hash, verify_password
from app.database import Base
from app.models import EmailVerification, PasswordReset, User
from app.schemas import PasswordResetRequest
from app.services import password_reset as reset_service
from app.services.email_otp import SmtpDeliveryError, verify_otp_hash
from app.services.password_reset import (
    RESET_MAX_ATTEMPTS,
    PasswordResetAttemptLimitError,
    PasswordResetDeliveryError,
    PasswordResetExpiredError,
    PasswordResetInvalidError,
    complete_password_reset,
    request_password_reset,
    verify_password_reset_otp,
)

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def create_user(db, email="reset@example.com", verified=True):
    user = User(
        email=email,
        first_name="Reset",
        password_hash=get_password_hash("OriginalPass123!"),
        role="user",
        credits_balance=2,
        is_email_verified=verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def issue_reset(db, email="reset@example.com"):
    captured = []
    with patch.object(
        reset_service,
        "send_password_reset_otp",
        side_effect=lambda _email, _name, otp: captured.append(otp),
    ):
        request_password_reset(db, email)
    return captured


def test_request_stores_only_hash_in_separate_reset_table(db):
    user = create_user(db)
    captured = issue_reset(db)
    record = db.query(PasswordReset).filter_by(user_id=user.id).one()

    assert len(captured) == 1
    assert record.otp_hash != captured[0]
    assert verify_otp_hash(captured[0], record.otp_hash)
    assert db.query(EmailVerification).count() == 0
    assert record.expires_at <= datetime.datetime.utcnow() + datetime.timedelta(minutes=10)


def test_unknown_and_unverified_emails_do_not_send_or_create_state(db):
    create_user(db, verified=False)
    sent = []
    with patch.object(reset_service, "send_password_reset_otp", side_effect=sent.append):
        request_password_reset(db, "missing@example.com")
        request_password_reset(db, "reset@example.com")
    assert sent == []
    assert db.query(PasswordReset).count() == 0


def test_request_endpoint_response_is_generic_for_known_and_unknown_email(db):
    from app.main import start_password_reset

    create_user(db)
    create_user(db, email="unverified@example.com", verified=False)
    with patch.object(reset_service, "send_password_reset_otp", return_value=None):
        known = start_password_reset(PasswordResetRequest(email="reset@example.com"), db)
        unknown = start_password_reset(PasswordResetRequest(email="missing@example.com"), db)
        unverified = start_password_reset(
            PasswordResetRequest(email="unverified@example.com"), db
        )
    assert known == unknown == unverified
    assert known["message"] == (
        "If an account exists for this email, we've sent a 6-digit password reset code."
    )


def test_request_schema_rejects_invalid_email_safely():
    with pytest.raises(ValidationError):
        PasswordResetRequest(email="not-an-email")


def test_cooldown_prevents_a_second_send(db):
    create_user(db)
    calls = []
    with patch.object(
        reset_service,
        "send_password_reset_otp",
        side_effect=lambda *_args: calls.append(True),
    ):
        request_password_reset(db, "reset@example.com")
        request_password_reset(db, "reset@example.com")
    assert calls == [True]


def test_smtp_failure_rolls_back_reset_state(db):
    create_user(db)
    with patch.object(
        reset_service,
        "send_password_reset_otp",
        side_effect=SmtpDeliveryError("unavailable"),
    ):
        with pytest.raises(PasswordResetDeliveryError):
            request_password_reset(db, "reset@example.com")
    assert db.query(PasswordReset).count() == 0


def test_request_endpoint_returns_generic_temporary_error_on_delivery_failure(db):
    from app.main import start_password_reset

    create_user(db)
    with patch.object(
        reset_service,
        "send_password_reset_otp",
        side_effect=SmtpDeliveryError("provider-secret-detail"),
    ):
        with pytest.raises(Exception) as exc_info:
            start_password_reset(PasswordResetRequest(email="reset@example.com"), db)

    assert getattr(exc_info.value, "status_code", None) == 503
    detail = getattr(exc_info.value, "detail", "")
    assert detail == "Password recovery is temporarily unavailable. Please try again."
    assert "provider-secret-detail" not in detail


def test_invalid_code_increments_attempts_and_attempt_limit_is_enforced(db):
    user = create_user(db)
    issue_reset(db)
    with pytest.raises(PasswordResetInvalidError):
        verify_password_reset_otp(db, user.email, "000000")
    record = db.query(PasswordReset).filter_by(user_id=user.id).one()
    assert record.attempts == 1

    record.attempts = RESET_MAX_ATTEMPTS
    db.commit()
    with pytest.raises(PasswordResetAttemptLimitError):
        verify_password_reset_otp(db, user.email, "000000")


def test_expired_code_is_rejected(db):
    user = create_user(db)
    captured = issue_reset(db)
    record = db.query(PasswordReset).filter_by(user_id=user.id).one()
    record.expires_at = datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
    db.commit()
    with pytest.raises(PasswordResetExpiredError):
        verify_password_reset_otp(db, user.email, captured[0])


def test_verification_consumes_otp_and_issues_hashed_authorization(db):
    user = create_user(db)
    captured = issue_reset(db)
    reset_token = verify_password_reset_otp(db, user.email, captured[0])
    record = db.query(PasswordReset).filter_by(user_id=user.id).one()

    assert record.otp_hash is None
    assert record.reset_token_hash
    assert record.reset_token_hash != reset_token
    with pytest.raises(PasswordResetInvalidError):
        verify_password_reset_otp(db, user.email, captured[0])


def test_successful_reset_changes_hash_and_is_single_use(db):
    user = create_user(db)
    captured = issue_reset(db)
    reset_token = verify_password_reset_otp(db, user.email, captured[0])

    complete_password_reset(db, user.email, reset_token, "ChangedPassword456!")
    db.refresh(user)
    assert verify_password("ChangedPassword456!", user.password_hash)
    assert not verify_password("OriginalPass123!", user.password_hash)
    assert db.query(PasswordReset).count() == 0

    with pytest.raises(PasswordResetInvalidError):
        complete_password_reset(db, user.email, reset_token, "AnotherPassword789!")


def test_reset_routes_never_issue_a_jwt(db):
    from app.main import finish_password_reset, verify_reset_otp
    from app.schemas import CompletePasswordResetRequest, VerifyPasswordResetOtpRequest

    user = create_user(db)
    captured = issue_reset(db)
    verified = verify_reset_otp(
        VerifyPasswordResetOtpRequest(email=user.email, otp=captured[0]),
        db,
    )
    completed = finish_password_reset(
        CompletePasswordResetRequest(
            email=user.email,
            reset_token=verified["reset_token"],
            new_password="ChangedPassword456!",
        ),
        db,
    )

    assert "access_token" not in verified
    assert "access_token" not in completed
    assert completed["message"] == "Password updated. You can now log in."
