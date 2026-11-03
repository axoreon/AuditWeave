"""add payment receipts

Revision ID: d3e8f1a2b4c6
Revises: 6b7f2d4c9a10
Create Date: 2026-09-15 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3e8f1a2b4c6"
down_revision: Union[str, None] = "6b7f2d4c9a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "payment_receipts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=32), nullable=False),
        sa.Column("receipt_number", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("payment_order_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.String(), nullable=False),
        sa.Column("plan_name", sa.String(), nullable=False),
        sa.Column("credits_purchased", sa.Integer(), nullable=False),
        sa.Column("amount_paid", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("provider_order_reference", sa.String(), nullable=False),
        sa.Column("payment_reference", sa.String(), nullable=False),
        sa.Column("customer_name", sa.String(length=160), nullable=True),
        sa.Column("customer_email", sa.String(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("email_status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("email_sent_at", sa.DateTime(), nullable=True),
        sa.Column("email_attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_email_error", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["payment_order_id"], ["payment_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("payment_order_id", name="uq_payment_receipts_payment_order_id"),
        sa.UniqueConstraint("public_id", name="uq_payment_receipts_public_id"),
        sa.UniqueConstraint("receipt_number", name="uq_payment_receipts_receipt_number"),
    )


def downgrade() -> None:
    op.drop_table("payment_receipts")
