"""Authoritative password policy for account creation and password resets."""

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def validate_password_policy(password: str) -> str:
    """Return a valid password unchanged or raise a safe, actionable error."""
    if not password:
        raise ValueError("Password is required.")
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(
            f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
        )
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(
            f"Password must be no more than {PASSWORD_MAX_LENGTH} characters."
        )
    if not any("A" <= character <= "Z" for character in password):
        raise ValueError("Password must contain at least one uppercase letter (A-Z).")
    if not any("a" <= character <= "z" for character in password):
        raise ValueError("Password must contain at least one lowercase letter (a-z).")
    if not any("0" <= character <= "9" for character in password):
        raise ValueError("Password must contain at least one number (0-9).")
    if not any(
        not (
            "A" <= character <= "Z"
            or "a" <= character <= "z"
            or "0" <= character <= "9"
        )
        for character in password
    ):
        raise ValueError("Password must contain at least one special character.")
    return password
