"""phase 1 credits and payment safety

Revision ID: 6b7f2d4c9a10
Revises: 460c3af89129
Create Date: 2026-09-15 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6b7f2d4c9a10"
down_revision: Union[str, None] = "460c3af89129"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("payment_orders", sa.Column("plan_id", sa.String(), nullable=True))
    op.add_column("payment_orders", sa.Column("plan_name", sa.String(), nullable=True))
    op.add_column("payment_orders", sa.Column("razorpay_payment_id", sa.String(), nullable=True))
    op.add_column("payment_orders", sa.Column("currency", sa.String(length=3), server_default="INR", nullable=True))
    op.add_column("payment_orders", sa.Column("verified_at", sa.DateTime(), nullable=True))
    op.create_index("ix_payment_orders_razorpay_payment_id", "payment_orders", ["razorpay_payment_id"], unique=True)
    op.create_index("ix_payment_orders_user_created", "payment_orders", ["user_id", "created_at"], unique=False)

    op.add_column("credit_transactions", sa.Column("reference_type", sa.String(), nullable=True))
    op.add_column("credit_transactions", sa.Column("balance_after", sa.Integer(), nullable=True))
    op.add_column("credit_transactions", sa.Column("description", sa.String(), nullable=True))
    op.add_column("credit_transactions", sa.Column("status", sa.String(), server_default="completed", nullable=True))
    op.create_index("ix_credit_transactions_user_created", "credit_transactions", ["user_id", "created_at"], unique=False)

    # Preserve every real legacy balance. NULL never represented a usable balance, so normalize
    # only those rows to a conservative zero before enforcing the invariant for future writes.
    op.execute(sa.text("UPDATE users SET credits_balance = 0 WHERE credits_balance IS NULL"))
    op.alter_column(
        "users",
        "credits_balance",
        server_default=sa.text("2"),
        nullable=False,
        existing_type=sa.Integer(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "credits_balance",
        server_default=None,
        nullable=True,
        existing_type=sa.Integer(),
        existing_nullable=False,
    )
    op.drop_index("ix_credit_transactions_user_created", table_name="credit_transactions")
    op.drop_column("credit_transactions", "status")
    op.drop_column("credit_transactions", "description")
    op.drop_column("credit_transactions", "balance_after")
    op.drop_column("credit_transactions", "reference_type")

    op.drop_index("ix_payment_orders_user_created", table_name="payment_orders")
    op.drop_index("ix_payment_orders_razorpay_payment_id", table_name="payment_orders")
    op.drop_column("payment_orders", "verified_at")
    op.drop_column("payment_orders", "currency")
    op.drop_column("payment_orders", "razorpay_payment_id")
    op.drop_column("payment_orders", "plan_name")
    op.drop_column("payment_orders", "plan_id")
