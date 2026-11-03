import datetime
from sqlalchemy import Boolean, Column, Integer, String, Text, Float, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(80), nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # user, admin, compliance_officer
    credits_balance = Column(Integer, default=2, server_default=text("2"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Email verification — True for all legacy/existing accounts (migration sets True),
    # False for new signups until they complete OTP verification.
    is_email_verified = Column(Boolean, nullable=False, default=False, server_default="false")

    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")
    payment_orders = relationship("PaymentOrder", back_populates="user", cascade="all, delete-orphan")
    payment_receipts = relationship("PaymentReceipt", back_populates="user", cascade="all, delete-orphan")
    email_verification = relationship(
        "EmailVerification", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    password_reset = relationship(
        "PasswordReset", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, unique=True, index=True, nullable=True)
    credits_purchased = Column(Integer, nullable=False)
    amount_paid = Column(Integer, nullable=False)  # In paise
    currency = Column(String(3), default="INR", server_default="INR", nullable=True)
    status = Column(String, default="created")  # created, processing, verified, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="payment_orders")
    receipt = relationship("PaymentReceipt", back_populates="payment_order", uselist=False, cascade="all, delete-orphan")


class PaymentReceipt(Base):
    __tablename__ = "payment_receipts"

    id = Column(Integer, primary_key=True)
    public_id = Column(String(32), unique=True, nullable=False)
    receipt_number = Column(String(32), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payment_order_id = Column(Integer, ForeignKey("payment_orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_id = Column(String, nullable=False)
    plan_name = Column(String, nullable=False)
    credits_purchased = Column(Integer, nullable=False)
    amount_paid = Column(Integer, nullable=False)  # In paise
    currency = Column(String(3), nullable=False)
    provider = Column(String(40), nullable=False)
    provider_order_reference = Column(String, nullable=False)
    payment_reference = Column(String, nullable=False)
    customer_name = Column(String(160), nullable=True)
    customer_email = Column(String, nullable=False)
    paid_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    email_status = Column(String(20), default="pending", server_default="pending", nullable=False)
    email_sent_at = Column(DateTime, nullable=True)
    email_attempts = Column(Integer, default=0, server_default=text("0"), nullable=False)
    last_email_error = Column(String(255), nullable=True)

    user = relationship("User", back_populates="payment_receipts")
    payment_order = relationship("PaymentOrder", back_populates="receipt")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False)
    industry = Column(String, index=True, nullable=False)  # FinTech, E-commerce, SaaS, Healthcare, EdTech, etc.
    size = Column(String, nullable=True)  # Startup, SME, Enterprise
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    policies = relationship("Policy", back_populates="company", cascade="all, delete-orphan")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    policy_text = Column(Text, nullable=False)
    policy_url = Column(String, nullable=True)
    version_label = Column(String, default="v1.0")
    previous_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    company = relationship("Company", back_populates="policies")
    audits = relationship("Audit", back_populates="policy", cascade="all, delete-orphan")


class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    compliance_score = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # e.g. "Excellent", "Good", "Moderate Risk", "High Risk", "Critical Risk"
    overall_summary = Column(Text, nullable=False)
    ai_confidence_score = Column(Float, default=0.95)
    rules_passed_count = Column(Integer, default=0)
    rules_failed_count = Column(Integer, default=0)
    ai_observations_count = Column(Integer, default=0)
    framework = Column(String, default="DPDP_2023")  # Multi-framework capability
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    policy = relationship("Policy", back_populates="audits")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id", ondelete="CASCADE"), nullable=False)
    pillar = Column(String, nullable=False)
    issue = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # Critical, High, Medium, Low, Informational
    confidence_score = Column(Float, default=0.90)
    dpdp_section = Column(String, nullable=True)
    evidence_extract = Column(Text, nullable=True)
    reason = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=True)
    legal_impact = Column(Text, nullable=True)
    legal_rec = Column(Text, nullable=True)
    tech_rec = Column(Text, nullable=True)
    business_rec = Column(Text, nullable=True)
    evidence_start_index = Column(Integer, default=-1)
    evidence_end_index = Column(Integer, default=-1)

    audit = relationship("Audit", back_populates="findings")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    industry = Column(String, unique=True, index=True, nullable=False)
    average_compliance_score = Column(Float, nullable=False)
    average_risk_score = Column(Float, nullable=False)
    companies_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False)  # positive for purchase, negative for usage
    transaction_type = Column(String, nullable=False)  # "purchase", "audit_usage", "bonus"
    reference_id = Column(String, nullable=True)  # e.g. razorpay payment id or audit id
    reference_type = Column(String, nullable=True)
    balance_after = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="completed", server_default="completed", nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="credit_transactions")


class EmailVerification(Base):
    """
    Stores the hashed OTP for a pending email verification.

    SECURITY DESIGN:
    - otp_hash: SHA-256 hex digest of the plaintext OTP — never the OTP itself.
    - expires_at: wall-clock expiry (10 minutes from creation/resend).
    - resend_after: earliest time a resend is allowed (60-second cooldown).
    - attempts: count of failed verification tries; capped at MAX_OTP_ATTEMPTS.
    - A new OTP (resend) replaces this row, invalidating the previous hash.
    """
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    otp_hash = Column(String(64), nullable=False)  # sha-256 hex, 64 chars
    expires_at = Column(DateTime, nullable=False)
    resend_after = Column(DateTime, nullable=False)   # earliest next resend
    attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="email_verification")


class PasswordReset(Base):
    """Stores isolated, single-use password recovery state for one user."""
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    otp_hash = Column(String(64), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    resend_after = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0, server_default=text("0"))
    reset_token_hash = Column(String(64), nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="password_reset")
