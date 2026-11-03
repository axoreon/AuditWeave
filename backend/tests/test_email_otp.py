"""
tests/test_email_otp.py

Focused tests for the email OTP signup verification flow.

Tests:
 1. signup creates unverified account
 2. valid OTP verifies account
 3. invalid OTP fails
 4. expired OTP fails
 5. OTP cannot be reused
 6. resend invalidates old OTP
 7. resend cooldown works
 8. attempt limit works
 9. unverified user cannot access protected authenticated flow
10. verified/legacy user can login normally
11. SMTP failure is handled safely
12. no plaintext OTP is persisted

Run with:
    cd backend
    pytest tests/test_email_otp.py -v
"""
from __future__ import annotations

import asyncio
import datetime
import hashlib
import sys
import os
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import EmailVerification, User
from app.services import user_auth as _user_auth_mod
from app.services.email_otp import generate_otp, hash_otp, verify_otp_hash
from app.services.user_auth import (
    MAX_OTP_ATTEMPTS,
    OTP_EXPIRY_MINUTES,
    RESEND_COOLDOWN_SECONDS,
    AuthDatabaseError,
    EmailAlreadyRegisteredError,
    OtpAttemptLimitError,
    OtpExpiredError,
    OtpInvalidError,
    OtpNotFoundError,
    OtpResendCooldownError,
    SmtpError,
    authenticate_user,
    create_user,
    resend_signup_otp,
    verify_signup_otp,
)
from app.auth import create_access_token, get_current_user, get_password_hash
from app.schemas import UserCreate, UserLogin, VerifySignupOtpRequest

# ---------------------------------------------------------------------------
# In-memory SQLite database fixture
# ---------------------------------------------------------------------------

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _setup_db():
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stub_send_ok(to_email, first_name, otp):
    """SMTP stub that succeeds silently."""


def _stub_send_fail(to_email, first_name, otp):
    from app.services.email_otp import SmtpDeliveryError
    raise SmtpDeliveryError("SMTP server unavailable")


def _create_verified_user(db, email="legacy@example.com", password="StrongPass123!"):
    """Create a pre-verified (legacy) user directly without going through the OTP flow."""
    user = User(
        email=email,
        first_name="Legacy",
        password_hash=get_password_hash(password),
        role="user",
        credits_balance=2,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# 1. Signup creates unverified account
# ---------------------------------------------------------------------------

class TestSignupCreatesUnverifiedAccount:
    def test_user_is_unverified_after_register(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "newuser@example.com", "StrongPass123!", "Alice")

        assert user.id is not None
        assert user.is_email_verified is False

    def test_otp_record_is_created_on_register(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "newuser2@example.com", "StrongPass123!", "Bob")

        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        assert record is not None
        assert record.otp_hash is not None
        assert len(record.otp_hash) == 64  # sha-256 hex

    def test_duplicate_email_raises(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "dup@example.com", "StrongPass123!", "Dup")
        with pytest.raises(EmailAlreadyRegisteredError):
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
                create_user(db, "dup@example.com", "StrongPass123!", "Dup2")


# ---------------------------------------------------------------------------
# 12. No plaintext OTP is persisted
# ---------------------------------------------------------------------------

class TestNoPlaintextOtpPersisted:
    def test_otp_hash_is_sha256_not_plaintext(self, db):
        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            user = create_user(db, "hashtest@example.com", "StrongPass123!", "Hash")

        assert len(captured) == 1
        otp_value = captured[0]

        # The DB must not contain the plaintext OTP anywhere
        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        assert record.otp_hash != otp_value
        # But the hash must verify correctly
        assert verify_otp_hash(otp_value, record.otp_hash)


# ---------------------------------------------------------------------------
# 2. Valid OTP verifies account
# ---------------------------------------------------------------------------

class TestValidOtpVerifiesAccount:
    def test_correct_otp_marks_user_verified(self, db):
        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            user = create_user(db, "verify@example.com", "StrongPass123!", "Verify")

        assert user.is_email_verified is False
        result = verify_signup_otp(db, "verify@example.com", captured[0])

        assert result.is_email_verified is True

    def test_otp_record_deleted_after_success(self, db):
        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            user = create_user(db, "verify2@example.com", "StrongPass123!", "Verify2")

        verify_signup_otp(db, "verify2@example.com", captured[0])
        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        assert record is None


# ---------------------------------------------------------------------------
# 3. Invalid OTP fails
# ---------------------------------------------------------------------------

class TestInvalidOtpFails:
    def test_wrong_otp_raises_otp_invalid(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "invalid@example.com", "StrongPass123!", "Invalid")

        with pytest.raises(OtpInvalidError):
            verify_signup_otp(db, "invalid@example.com", "000000")

    def test_wrong_otp_increments_attempts(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "attempts@example.com", "StrongPass123!", "Att")

        with pytest.raises(OtpInvalidError):
            verify_signup_otp(db, "attempts@example.com", "000000")

        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        assert record.attempts == 1


# ---------------------------------------------------------------------------
# 4. Expired OTP fails
# ---------------------------------------------------------------------------

class TestExpiredOtpFails:
    def test_expired_otp_raises_otp_expired(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "expired@example.com", "StrongPass123!", "Exp")

        # Manually expire the record
        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        record.expires_at = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
        db.commit()

        with pytest.raises(OtpExpiredError):
            verify_signup_otp(db, "expired@example.com", "123456")


# ---------------------------------------------------------------------------
# 5. OTP cannot be reused
# ---------------------------------------------------------------------------

class TestOtpCannotBeReused:
    def test_otp_single_use_raises_not_found_on_reuse(self, db):
        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            create_user(db, "reuse@example.com", "StrongPass123!", "Reuse")

        # First use — should succeed
        verify_signup_otp(db, "reuse@example.com", captured[0])

        # Second use — record deleted, should raise
        with pytest.raises(OtpNotFoundError):
            verify_signup_otp(db, "reuse@example.com", captured[0])


# ---------------------------------------------------------------------------
# 6. Resend invalidates old OTP
# ---------------------------------------------------------------------------

class TestResendInvalidatesOldOtp:
    def test_resend_replaces_otp_hash(self, db):
        original_otp = []
        new_otp = []

        def capture_first(to_email, first_name, otp):
            original_otp.append(otp)

        def capture_second(to_email, first_name, otp):
            new_otp.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_first):
            user = create_user(db, "resend@example.com", "StrongPass123!", "Resend")

        record_before = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        old_hash = record_before.otp_hash

        # Move resend_after to the past so cooldown passes
        record_before.resend_after = datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
        db.commit()

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_second):
            resend_signup_otp(db, "resend@example.com")

        record_after = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        assert record_after.otp_hash != old_hash
        # Old OTP should fail
        with pytest.raises(OtpInvalidError):
            verify_signup_otp(db, "resend@example.com", original_otp[0])


# ---------------------------------------------------------------------------
# 7. Resend cooldown works
# ---------------------------------------------------------------------------

class TestResendCooldown:
    def test_resend_within_cooldown_raises(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "cooldown@example.com", "StrongPass123!", "Cool")

        # Resend immediately — cooldown should be active
        with pytest.raises(OtpResendCooldownError):
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
                resend_signup_otp(db, "cooldown@example.com")

    def test_resend_after_cooldown_succeeds(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "cooldown2@example.com", "StrongPass123!", "Cool2")

        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        record.resend_after = datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
        db.commit()

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            resend_signup_otp(db, "cooldown2@example.com")  # should not raise


# ---------------------------------------------------------------------------
# 8. Attempt limit works
# ---------------------------------------------------------------------------

class TestAttemptLimit:
    def test_max_attempts_raises_attempt_limit_error(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "limit@example.com", "StrongPass123!", "Limit")

        # Exhaust attempts
        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        record.attempts = MAX_OTP_ATTEMPTS
        db.commit()

        with pytest.raises(OtpAttemptLimitError):
            verify_signup_otp(db, "limit@example.com", "000000")


# ---------------------------------------------------------------------------
# 9. Unverified user cannot access protected authenticated flow
# ---------------------------------------------------------------------------

class TestUnverifiedUserBlocked:
    """
    auth.py's get_current_user raises 403 if is_email_verified is False.
    Test the guard directly on the model.
    """

    def test_unverified_user_has_flag_false(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "unverified@example.com", "StrongPass123!", "Unv")
        assert user.is_email_verified is False

    def test_authenticate_user_returns_unverified_user(self, db):
        """
        authenticate_user does not itself enforce verification.
        The JWT layer (get_current_user) is responsible for the 403.
        """
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "unv2@example.com", "StrongPass123!", "Unv2")

        result = authenticate_user(db, "unv2@example.com", "StrongPass123!")
        assert result is not None
        assert result.is_email_verified is False


# ---------------------------------------------------------------------------
# 10. Verified / legacy user can login normally
# ---------------------------------------------------------------------------

class TestVerifiedUserLogin:
    def test_legacy_verified_user_can_authenticate(self, db):
        legacy = _create_verified_user(db, "legacy@example.com", "StrongPass123!")
        assert legacy.is_email_verified is True

        result = authenticate_user(db, "legacy@example.com", "StrongPass123!")
        assert result is not None
        assert result.id == legacy.id
        assert result.is_email_verified is True

    def test_verified_user_after_otp_can_login(self, db):
        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            create_user(db, "newlv@example.com", "StrongPass123!", "NewLV")

        verify_signup_otp(db, "newlv@example.com", captured[0])

        result = authenticate_user(db, "newlv@example.com", "StrongPass123!")
        assert result is not None
        assert result.is_email_verified is True


# ---------------------------------------------------------------------------
# 11. SMTP failure is handled safely
# ---------------------------------------------------------------------------

class TestSmtpFailure:
    def test_register_endpoint_returns_safe_503_and_rolls_back(self, db):
        from app.main import register

        with pytest.raises(Exception) as exc_info:
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_fail):
                register(
                    UserCreate(
                        email="endpoint-smtp@example.com",
                        password="StrongPass123!",
                        first_name="Endpoint",
                    ),
                    db,
                )

        assert getattr(exc_info.value, "status_code", None) == 503
        assert "SMTP" not in getattr(exc_info.value, "detail", "")
        assert db.query(User).filter(User.email == "endpoint-smtp@example.com").first() is None

    def test_smtp_failure_raises_smtp_error(self, db):
        with pytest.raises(SmtpError):
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_fail):
                create_user(db, "smtpfail@example.com", "StrongPass123!", "SMTP")

    def test_smtp_failure_rolls_back_pending_account(self, db):
        with pytest.raises(SmtpError):
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_fail):
                create_user(db, "smtpdup@example.com", "StrongPass123!", "SDup")

        assert db.query(User).filter(User.email == "smtpdup@example.com").first() is None
        assert db.query(EmailVerification).count() == 0

    def test_resend_smtp_failure_raises_smtp_error(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "rsmtp@example.com", "StrongPass123!", "RSmt")

        record = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).first()
        record.resend_after = datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
        db.commit()

        old_hash = record.otp_hash
        with pytest.raises(SmtpError):
            with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_fail):
                resend_signup_otp(db, "rsmtp@example.com")

        db.expire_all()
        preserved = db.query(EmailVerification).filter(EmailVerification.user_id == user.id).one()
        assert preserved.otp_hash == old_hash


class TestRepeatedVerification:
    def test_repeated_endpoint_submission_is_safe_without_reusing_otp(self, db):
        from app import main as main_module

        captured = []

        def capture_otp(to_email, first_name, otp):
            captured.append(otp)

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=capture_otp):
            user = create_user(db, "repeat@example.com", "StrongPass123!", "Repeat")

        payload = VerifySignupOtpRequest(email=user.email, otp=captured[0])
        with patch.object(main_module, "send_account_verified_email") as welcome_send:
            first = main_module.verify_otp(payload, db)
            with pytest.raises(Exception) as exc_info:
                main_module.verify_otp(payload, db)
        assert first["message"] == "Email verified. You can now log in."
        assert "access_token" not in first
        assert getattr(exc_info.value, "status_code", None) == 400
        assert getattr(exc_info.value, "detail", "") == (
            "The verification code is invalid or has expired."
        )
        welcome_send.assert_called_once_with(user.email, user.first_name)

    def test_welcome_delivery_failure_does_not_undo_verification(self, db):
        from app import main as main_module
        from app.services.email_otp import SmtpDeliveryError

        captured = []
        with patch.object(
            _user_auth_mod,
            "send_verification_otp",
            side_effect=lambda _email, _name, otp: captured.append(otp),
        ):
            user = create_user(db, "welcome-failure@example.com", "StrongPass123!", "Welcome")

        payload = VerifySignupOtpRequest(email=user.email, otp=captured[0])
        with patch.object(
            main_module,
            "send_account_verified_email",
            side_effect=SmtpDeliveryError("provider-secret-detail"),
        ):
            response = main_module.verify_otp(payload, db)

        db.refresh(user)
        assert response["message"] == "Email verified. You can now log in."
        assert user.is_email_verified is True


class TestLoginAndProtectedAccess:
    def test_verified_legacy_user_login_endpoint_issues_token(self, db):
        from app.main import login

        _create_verified_user(db, "legacy-login@example.com", "StrongPass123!")
        response = login(
            UserLogin(email="legacy-login@example.com", password="StrongPass123!"),
            db,
        )
        assert response["token_type"] == "bearer"
        assert response["access_token"]

    def test_unverified_user_cannot_log_in(self, db):
        from app.main import login

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "blocked@example.com", "StrongPass123!", "Blocked")

        with pytest.raises(Exception) as exc_info:
            login(UserLogin(email="blocked@example.com", password="StrongPass123!"), db)
        assert getattr(exc_info.value, "status_code", None) == 401
        assert getattr(exc_info.value, "detail", "") == "Invalid email or password."

    def test_unknown_wrong_password_and_unverified_login_are_indistinguishable(self, db):
        from app.main import login

        verified = _create_verified_user(db, "known@example.com", "StrongPass123!")
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            create_user(db, "pending@example.com", "StrongPass123!", "Pending")

        attempts = [
            UserLogin(email="missing@example.com", password="StrongPass123!"),
            UserLogin(email=verified.email, password="WrongPassword123!"),
            UserLogin(email="pending@example.com", password="StrongPass123!"),
        ]
        responses = []
        for payload in attempts:
            with pytest.raises(Exception) as exc_info:
                login(payload, db)
            responses.append(
                (getattr(exc_info.value, "status_code", None), getattr(exc_info.value, "detail", ""))
            )

        assert responses == [(401, "Invalid email or password.")] * 3


class TestResendEnumerationSafety:
    def test_unknown_pending_cooldown_and_success_share_public_message(self, db):
        from app import main as main_module
        from app.schemas import ResendSignupOtpRequest

        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "resend-safe@example.com", "StrongPass123!", "Resend")

        pending = ResendSignupOtpRequest(email=user.email)
        unknown = ResendSignupOtpRequest(email="missing@example.com")
        cooldown_response = main_module.resend_otp(pending, db)
        unknown_response = main_module.resend_otp(unknown, db)

        record = db.query(EmailVerification).filter_by(user_id=user.id).one()
        record.resend_after = datetime.datetime.utcnow() - datetime.timedelta(seconds=1)
        db.commit()
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            sent_response = main_module.resend_otp(pending, db)

        assert cooldown_response == unknown_response == sent_response
        assert "If a pending verification exists" in sent_response["message"]

    def test_unverified_token_cannot_access_protected_flow(self, db):
        with patch.object(_user_auth_mod, "send_verification_otp", side_effect=_stub_send_ok):
            user = create_user(db, "protected@example.com", "StrongPass123!", "Protected")

        token = create_access_token({"sub": user.email})
        with pytest.raises(Exception) as exc_info:
            asyncio.run(get_current_user(token=token, db=db))
        assert getattr(exc_info.value, "status_code", None) == 403


# ---------------------------------------------------------------------------
# OTP helper unit tests
# ---------------------------------------------------------------------------

class TestOtpHelpers:
    def test_generate_otp_is_6_digits(self):
        for _ in range(20):
            otp = generate_otp()
            assert len(otp) == 6
            assert otp.isdigit()

    def test_hash_otp_is_sha256_hex(self):
        otp = "123456"
        h = hash_otp(otp)
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)

    def test_verify_otp_hash_correct(self):
        otp = generate_otp()
        h = hash_otp(otp)
        assert verify_otp_hash(otp, h) is True

    def test_verify_otp_hash_wrong(self):
        otp = generate_otp()
        h = hash_otp(otp)
        assert verify_otp_hash("000000", h) is False
