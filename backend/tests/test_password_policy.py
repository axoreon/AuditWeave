import pytest
from pydantic import ValidationError

from app.password_policy import PASSWORD_MAX_LENGTH, validate_password_policy
from app.schemas import CompletePasswordResetRequest, UserCreate


VALID_PASSWORD = "Audit123!"


@pytest.mark.parametrize(
    ("password", "message"),
    [
        ("", "required"),
        ("Aa1!", "at least 8"),
        ("audit123!", "uppercase"),
        ("AUDIT123!", "lowercase"),
        ("AuditPass!", "number"),
        ("Audit123", "special character"),
        ("A" * (PASSWORD_MAX_LENGTH + 1), f"no more than {PASSWORD_MAX_LENGTH}"),
    ],
)
def test_authoritative_policy_rejects_each_invalid_password(password, message):
    with pytest.raises(ValueError, match=message):
        validate_password_policy(password)


def test_authoritative_policy_accepts_and_preserves_valid_password():
    assert validate_password_policy(VALID_PASSWORD) == VALID_PASSWORD


@pytest.mark.parametrize(
    "schema",
    [
        lambda password: UserCreate(
            first_name="Priya", email="priya@example.com", password=password
        ),
        lambda password: CompletePasswordResetRequest(
            email="priya@example.com",
            reset_token="r" * 32,
            new_password=password,
        ),
    ],
)
def test_signup_and_reset_use_the_same_password_policy(schema):
    assert schema(VALID_PASSWORD)

    with pytest.raises(ValidationError, match="uppercase letter"):
        schema("audit123!")

    with pytest.raises(ValidationError, match="special character"):
        schema("Audit123")
