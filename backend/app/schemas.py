from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from typing import cast
from typing import List, Literal, Optional, Dict, Any
from datetime import datetime

from .password_policy import (
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    validate_password_policy,
)

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return cast(EmailStr, str(value).strip().lower())

class UserCreate(UserBase):
    first_name: str = Field(min_length=1, max_length=80)
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )

    @field_validator("first_name")
    @classmethod
    def normalize_first_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("First name is required.")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_policy(value)

class UserLogin(UserBase):
    password: str = Field(min_length=1, max_length=128)


class VerifySignupOtpRequest(UserBase):
    model_config = ConfigDict(extra="forbid")

    otp: str = Field(pattern=r"^\d{6}$")


class ResendSignupOtpRequest(UserBase):
    model_config = ConfigDict(extra="forbid")


class RegisterPendingResponse(UserBase):
    message: str
    requires_verification: bool


class EmailVerificationResponse(BaseModel):
    message: str


class PasswordResetRequest(UserBase):
    model_config = ConfigDict(extra="forbid")


class VerifyPasswordResetOtpRequest(UserBase):
    model_config = ConfigDict(extra="forbid")

    otp: str = Field(pattern=r"^\d{6}$")


class PasswordResetOtpResponse(BaseModel):
    message: str
    reset_token: str


class CompletePasswordResetRequest(UserBase):
    model_config = ConfigDict(extra="forbid")

    reset_token: str = Field(min_length=32, max_length=128)
    new_password: str = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_policy(value)


class UserResponse(UserBase):
    id: int
    first_name: Optional[str] = None
    role: str
    credits_balance: int = 0
    has_plan_access: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    credits_balance: int = 0
    has_plan_access: bool = False

class TokenData(BaseModel):
    email: Optional[str] = None

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    domain: str
    industry: str
    size: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Policy Schemas
class PolicyBase(BaseModel):
    policy_url: Optional[str] = None
    version_label: Optional[str] = "v1.0"
    previous_policy_id: Optional[int] = None

class PolicyCreate(PolicyBase):
    company_name: str
    industry: str
    policy_text: str

class PolicyResponse(PolicyBase):
    id: int
    company_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Finding Schemas
class FindingBase(BaseModel):
    pillar: str
    issue: str
    severity: str
    confidence_score: float
    dpdp_section: Optional[str] = None
    evidence_extract: Optional[str] = None
    reason: str
    business_impact: Optional[str] = None
    legal_impact: Optional[str] = None
    legal_rec: Optional[str] = None
    tech_rec: Optional[str] = None
    business_rec: Optional[str] = None
    evidence_start_index: Optional[int] = -1
    evidence_end_index: Optional[int] = -1

class FindingResponse(FindingBase):
    id: int
    audit_id: int
    
    class Config:
        from_attributes = True

# Audit Schemas
class AuditBase(BaseModel):
    compliance_score: float
    risk_score: float
    status: str
    overall_summary: str
    ai_confidence_score: float
    rules_passed_count: int
    rules_failed_count: int
    ai_observations_count: int
    framework: str = "DPDP_2023"

class AuditResponse(AuditBase):
    id: int
    policy_id: int
    created_at: datetime
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    company_industry: Optional[str] = None
    
    class Config:
        from_attributes = True

class AuditDetailResponse(AuditResponse):
    findings: List[FindingResponse] = []
    policy_text: Optional[str] = None
    
    class Config:
        from_attributes = True

class AuditSummaryResponse(BaseModel):
    id: int
    company_name: str
    industry: str
    compliance_score: float
    status: str
    is_summary_only: bool = True
    
    class Config:
        from_attributes = True

# Benchmark Schema
class BenchmarkResponse(BaseModel):
    id: int
    industry: str
    average_compliance_score: float
    average_risk_score: float
    companies_count: int
    updated_at: datetime
    contains_seeded_demonstration_data: bool = False
    
    class Config:
        from_attributes = True

# Request Payloads
class AuditRequest(BaseModel):
    company_name: str
    industry: str
    policy_url: Optional[str] = None
    policy_text: Optional[str] = None

class CompareRequest(BaseModel):
    audit_id_a: int
    audit_id_b: int

class RewriteRequest(BaseModel):
    finding_id: int
    # clause_text has been removed: the server reloads evidence from the DB.
    # The frontend must never supply policy wording as source-of-truth.

class RewriteResponse(BaseModel):
    finding_id: int
    original_text: str
    rewritten_text: str
    disclaimer: str
    generation_mode: Literal["ai", "template"]

class CopilotHistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class CopilotRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    audit_id: int
    message: str = Field(min_length=1, max_length=2000)
    history: List[CopilotHistoryMessage] = Field(default_factory=list, max_length=10)

class CopilotResponse(BaseModel):
    response: str
    suggested_actions: List[str] = []

class ResearchRequest(BaseModel):
    company_names: List[str]

class BatchAuditItem(BaseModel):
    company_name: str
    industry: str
    policy_url: Optional[str] = None
    policy_text: Optional[str] = None

class BatchAuditRequest(BaseModel):
    items: List[BatchAuditItem]

class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    topic: Literal["feedback", "vulnerability", "integration", "bug", "other"] = "feedback"
    other_topic: Optional[str] = Field(default=None, max_length=100)
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("name", "message", "other_topic", mode="before")
    @classmethod
    def trim_contact_text(cls, value: Any) -> Any:
        return value.strip() if isinstance(value, str) else value

    @field_validator("name")
    @classmethod
    def reject_unsafe_contact_name(cls, value: str) -> str:
        if "\r" in value or "\n" in value:
            raise ValueError("Name must not contain line breaks.")
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_contact_email(cls, value: Any) -> Any:
        if not isinstance(value, str):
            return value
        normalized = value.strip().lower()
        if len(normalized) > 254:
            raise ValueError("Email address is too long.")
        return normalized

    @model_validator(mode="after")
    def validate_other_topic(self) -> "ContactRequest":
        if self.topic == "other" and not self.other_topic:
            raise ValueError("A category description is required when topic is other.")
        if self.other_topic and ("\r" in self.other_topic or "\n" in self.other_topic):
            raise ValueError("Category description must not contain line breaks.")
        if self.topic != "other":
            self.other_topic = None
        return self

class ContactResponse(BaseModel):
    success: bool
    message: str


class CreditPlanResponse(BaseModel):
    id: str
    title: str
    credits: int
    price_inr: int
    currency: str
    description: str
    popular: bool
    features: List[str]


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    plan_id: str = Field(min_length=1, max_length=40)
    offer_id: Optional[str] = Field(default=None, max_length=60)


class OfferResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    percent_off: Optional[float] = None
    flat_amount_off: Optional[int] = None
    min_amount: Optional[int] = None
    valid_till: Optional[str] = None
    active: bool


class VerifyPaymentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    razorpay_order_id: str = Field(min_length=1, max_length=255)
    razorpay_payment_id: str = Field(min_length=1, max_length=255)
    razorpay_signature: str = Field(min_length=1, max_length=512)


class PaymentVerificationResponse(BaseModel):
    success: bool
    new_balance: int
    already_processed: bool
    receipt_available: bool
    receipt_number: Optional[str] = None
    receipt_email_status: Optional[str] = None


class CreditSummaryResponse(BaseModel):
    available_credits: int
    recorded_purchased_credits: int
    recorded_used_credits: int
    has_incomplete_history: bool


class CreditActivityItem(BaseModel):
    id: int
    created_at: Optional[datetime] = None
    transaction_type: str
    amount: int
    balance_after: Optional[int] = None
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    status: str


class CreditActivityPage(BaseModel):
    items: List[CreditActivityItem]
    page: int
    page_size: int
    total: int
    total_pages: int


class PaymentHistoryItem(BaseModel):
    id: int
    plan_id: Optional[str] = None
    plan_name: str
    credits_purchased: int
    amount_paise: int
    currency: str
    status: str
    payment_reference: str
    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    receipt_available: bool
    receipt_number: Optional[str] = None


class PaymentHistoryPage(BaseModel):
    items: List[PaymentHistoryItem]
    page: int
    page_size: int
    total: int
    total_pages: int
