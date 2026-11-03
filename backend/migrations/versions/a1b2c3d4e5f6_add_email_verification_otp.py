"""add email verification otp

Revision ID: a1b2c3d4e5f6
Revises: d3e8f1a2b4c6
Create Date: 2026-09-17 22:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "d3e8f1a2b4c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add is_email_verified to users.
    #    All existing (legacy) rows are marked verified=True so current users are
    #    unaffected. The server_default is 'false' so new rows start unverified.
    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    # Mark every pre-existing account as verified so legacy logins keep working.
    op.execute(sa.text("UPDATE users SET is_email_verified = TRUE"))

    # 2. Create the email_verifications table.
    op.create_table(
        "email_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("otp_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("resend_after", sa.DateTime(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_email_verifications_user_id"),
    )
    op.create_index(
        op.f("ix_email_verifications_id"), "email_verifications", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_email_verifications_user_id"),
        "email_verifications",
        ["user_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_email_verifications_user_id"), table_name="email_verifications")
    op.drop_index(op.f("ix_email_verifications_id"), table_name="email_verifications")
    op.drop_table("email_verifications")
    op.drop_column("users", "is_email_verified")
