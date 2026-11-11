import datetime
import html
import logging
import os
from pathlib import Path

import google.generativeai as genai
from typing import List, Literal, Optional, Union, Dict
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import case, desc, func, or_

from .database import engine, Base, get_db, SessionLocal
from .email_service import send_email
from .models import User, Company, Policy, Audit, Finding, Benchmark, AuditLog
from .schemas import (
    CompletePasswordResetRequest, EmailVerificationResponse, PasswordResetOtpResponse,
    PasswordResetRequest, RegisterPendingResponse, ResendSignupOtpRequest,
    UserCreate, UserLogin, UserResponse, Token, TokenData, VerifySignupOtpRequest,
    VerifyPasswordResetOtpRequest,
    AuditRequest, AuditDetailResponse, AuditSummaryResponse,
    AuditResponse, CompareRequest, RewriteRequest, RewriteResponse, CopilotRequest,
    CopilotResponse, BenchmarkResponse, BatchAuditRequest, ContactRequest, ContactResponse,
    CreateOrderRequest, CreditActivityPage, CreditPlanResponse, CreditSummaryResponse,
    OfferResponse,
    PaymentHistoryPage, PaymentVerificationResponse, VerifyPaymentRequest
)
from .auth import (
    get_password_hash, create_access_token, get_current_user, get_current_user_optional,
    user_has_plan_access, ACCESS_TOKEN_EXPIRE_MINUTES
)
from .services.user_auth import (
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
from .services.password_reset import (
    PasswordResetAttemptLimitError,
    PasswordResetDatabaseError,
    PasswordResetDeliveryError,
    PasswordResetExpiredError,
    PasswordResetInvalidError,
    complete_password_reset,
    request_password_reset,
    verify_password_reset_otp,
)
from .services.email_otp import SmtpDeliveryError, email_verification_disabled, send_account_verified_email
from .services.text_extractor import (
    URLExtractionError,
    URLFetchTimeout,
    UnsafePolicyURLError,
    extract_text_from_url,
    extract_text_from_pdf,
    extract_text_from_docx,
)
from .services.rule_engine import HybridComplianceEngine
from .services.gemini import analyze_policy_with_gemini, HAS_GEMINI_KEY
from .services.pdf_generator import (
    generate_audit_pdf,
    generate_comparison_pdf,
    generate_remediated_policy_pdf,
    generate_remediated_policy_docx,
)
from .services.policy_remediation import generate_remediated_policy
from .services.email_templates import render_contact_acknowledgement_email
from .services.receipt_email import deliver_receipt_email
from .services.receipt_pdf import generate_receipt_pdf
from .services.rewrite import (
    build_rewrite_prompt,
    build_safe_fallback,
    clean_model_rewrite,
    extract_clause_context,
    is_finding_eligible_for_rewrite,
)
from .services.credits import (
    InsufficientCreditsError,
    PaymentAlreadyUsedError,
    PaymentOrderNotProcessableError,
    CreditReservation,
    finalize_audit_reservation,
    finalize_payment_purchase,
    get_credit_pack,
    list_credit_packs,
    recover_stale_audit_reservations,
    release_audit_reservation,
    reserve_audit_credits,
)
from .services.dashboard_metrics import (
    DEMONSTRATION_BENCHMARK_INDUSTRIES,
    build_pillar_metrics,
    format_pillar_names,
    select_pillars_by_recorded_severity,
)

logger = logging.getLogger(__name__)


def load_runtime_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_runtime_env()

# Initialize FastAPI App
app = FastAPI(
    title="AuditWeave - Backend",
    description="Enterprise GRC platform for DPDP Act 2023 compliance auditing",
    version="1.0.0"
)

# Simple IP-based rate limiting for anonymous audits (3 per day)
anonymous_audit_rate_limits: Dict[str, List[datetime.datetime]] = {}

def check_anonymous_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.datetime.utcnow()
    # clean up old limits
    if client_ip in anonymous_audit_rate_limits:
        anonymous_audit_rate_limits[client_ip] = [
            t for t in anonymous_audit_rate_limits[client_ip]
            if (now - t).total_seconds() < 86400
        ]
    else:
        anonymous_audit_rate_limits[client_ip] = []
        
    if len(anonymous_audit_rate_limits[client_ip]) >= 3:
        raise HTTPException(status_code=429, detail="Anonymous audit limit reached (3 per day). Please sign up to continue.")
        
    anonymous_audit_rate_limits[client_ip].append(now)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize local SQLite tables on startup when no migration layer is in use.
@app.on_event("startup")
def ensure_local_database_schema():
    if str(engine.url).startswith("sqlite"):
        Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_populate_benchmarks():
    db = next(get_db())
    try:
        # Populate initial benchmarks if they don't exist
        mock_benchmarks = [
            {"industry": "FinTech", "average_compliance_score": 71.2, "average_risk_score": 28.8, "companies_count": 21},
            {"industry": "E-commerce", "average_compliance_score": 62.5, "average_risk_score": 37.5, "companies_count": 14},
            {"industry": "Healthcare", "average_compliance_score": 58.0, "average_risk_score": 42.0, "companies_count": 8},
            {"industry": "EdTech", "average_compliance_score": 65.4, "average_risk_score": 34.6, "companies_count": 11},
            {"industry": "SaaS", "average_compliance_score": 74.8, "average_risk_score": 25.2, "companies_count": 18},
        ]
        for mb in mock_benchmarks:
            existing = db.query(Benchmark).filter(Benchmark.industry == mb["industry"]).first()
            if not existing:
                db_bench = Benchmark(**mb)
                db.add(db_bench)
                
        # Populate an admin user if not present
        existing_admin = db.query(User).filter(User.email == "admin@AuditWeave.ai").first()
        if not existing_admin:
            admin_user = User(
                email="admin@AuditWeave.ai",
                first_name="Admin",
                password_hash=get_password_hash("AuditWeave_admin_2026"),
                role="admin"
            )
            db.add(admin_user)
            
        db.commit()
    except Exception as e:
        print(f"Error initializing startup data: {e}")
        db.rollback()


@app.on_event("startup")
def reconcile_abandoned_credit_reservations():
    """Recover persisted audit reservations abandoned by terminated workers."""
    db = SessionLocal()
    try:
        recovered = recover_stale_audit_reservations(db)
        if recovered:
            logger.info("Recovered %s stale audit credit reservation(s)", recovered)
    except Exception:
        db.rollback()
        logger.exception("Unable to reconcile stale audit credit reservations")
    finally:
        db.close()

# --- AUTHENTICATION ROUTES ---

@app.post("/api/auth/register", response_model=RegisterPendingResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (UNVERIFIED) and send an OTP to their email.
    The caller must redirect the user to the email verification screen.
    """
    try:
        user = create_user(db, str(user_in.email), user_in.password, user_in.first_name)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email is already registered.",
        )
    except SmtpError:
        # Do NOT tell user email was sent if SMTP failed.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "We could not send the verification email. "
                "Please check your address and try again later, or contact support."
            ),
        )
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account service is temporarily unavailable. Please try again.",
        )

    verification_required = not email_verification_disabled()
    return {
        "message": (
            "Account created. "
            + ("A 6-digit verification code has been sent to your email." if verification_required else "Email verification is disabled in local development mode.")
        ),
        "email": user.email,
        "requires_verification": verification_required,
    }


@app.post("/api/auth/verify-otp", response_model=EmailVerificationResponse)
def verify_otp(payload: VerifySignupOtpRequest, db: Session = Depends(get_db)):
    """
    Verify the 6-digit OTP submitted by the user after signup.
    On success the account is marked verified. Authentication still happens
    through the existing login endpoint.
    """
    try:
        verified_user = verify_signup_otp(db, str(payload.email), payload.otp)
    except OtpNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid or has expired.",
        )
    except OtpAttemptLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new verification code.",
        )
    except OtpExpiredError:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The verification code has expired. Please request a new one.",
        )
    except OtpInvalidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check and try again.",
        )
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification service is temporarily unavailable. Please try again.",
        )

    try:
        send_account_verified_email(
            verified_user.email,
            verified_user.first_name or "",
        )
    except SmtpDeliveryError as exc:
        # Verification is already committed. A welcome-email outage must not
        # undo or misrepresent that security state transition.
        logger.warning(
            "Account verification welcome email failed for user_id=%s: %s",
            verified_user.id,
            type(exc).__name__,
        )

    return {"message": "Email verified. You can now log in."}


@app.post("/api/auth/resend-otp", response_model=EmailVerificationResponse)
def resend_otp(payload: ResendSignupOtpRequest, db: Session = Depends(get_db)):
    """
    Resend the OTP to the specified email (60-second cooldown enforced).
    Invalidates the previous OTP.
    """
    try:
        resend_signup_otp(db, str(payload.email))
    except (OtpNotFoundError, OtpResendCooldownError):
        pass
    except SmtpError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send verification email. Please try again later.",
        )
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification service is temporarily unavailable. Please try again.",
        )

    return {
        "message": (
            "If a pending verification exists for this email, "
            "a new code has been sent."
        )
    }


@app.post("/api/auth/password-reset/request", response_model=EmailVerificationResponse)
def start_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """Send a reset code without revealing whether an eligible account exists."""
    try:
        request_password_reset(db, str(payload.email))
    except (PasswordResetDatabaseError, PasswordResetDeliveryError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password recovery is temporarily unavailable. Please try again.",
        )
    return {
        "message": (
            "If an account exists for this email, we've sent a 6-digit "
            "password reset code."
        )
    }


@app.post("/api/auth/password-reset/verify", response_model=PasswordResetOtpResponse)
def verify_reset_otp(
    payload: VerifyPasswordResetOtpRequest,
    db: Session = Depends(get_db),
):
    try:
        reset_token = verify_password_reset_otp(db, str(payload.email), payload.otp)
    except PasswordResetAttemptLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new reset code.",
        )
    except PasswordResetExpiredError:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="The password reset code has expired. Please request a new one.",
        )
    except PasswordResetInvalidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The code is invalid or has expired. Request a new code if needed.",
        )
    except PasswordResetDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password recovery is temporarily unavailable. Please try again.",
        )
    return {"message": "Code verified. Choose a new password.", "reset_token": reset_token}


@app.post("/api/auth/password-reset/complete", response_model=EmailVerificationResponse)
def finish_password_reset(
    payload: CompletePasswordResetRequest,
    db: Session = Depends(get_db),
):
    try:
        complete_password_reset(
            db,
            str(payload.email),
            payload.reset_token,
            payload.new_password,
        )
    except PasswordResetExpiredError:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Password reset authorization has expired. Please request a new code.",
        )
    except PasswordResetInvalidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset authorization is invalid. Please request a new code.",
        )
    except PasswordResetDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password recovery is temporarily unavailable. Please try again.",
        )
    return {"message": "Password updated. You can now log in."}


@app.post("/api/auth/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, str(user_in.email), user_in.password)
    except AuthDatabaseError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable. Please try again."
        )
    if not user or not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    log = AuditLog(action=f"User login: {user.email}", user_id=user.id)
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "credits_balance": user.credits_balance,
        "has_plan_access": user_has_plan_access(db, user),
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "email": current_user.email,
        "role": current_user.role,
        "credits_balance": current_user.credits_balance,
        "has_plan_access": user_has_plan_access(db, current_user),
        "created_at": current_user.created_at,
    }


# --- AUDIT COMPLIANCE ROUTES ---

def prepare_compliance_analysis(company_name: str, industry: str, policy_text: str) -> dict:
    """Run rule and Gemini analysis without opening a database transaction."""
    rule_engine = HybridComplianceEngine()
    rule_results = rule_engine.run(policy_text)
    ai_results = analyze_policy_with_gemini(company_name, industry, policy_text, rule_results)
    combined_score = round((0.4 * rule_results["rule_score"]) + (0.6 * ai_results["ai_compliance_score"]), 1)
    risk_score = round(100.0 - combined_score, 1)

    if combined_score >= 85:
        status_label = "Excellent"
    elif combined_score >= 70:
        status_label = "Good"
    elif combined_score >= 50:
        status_label = "Moderate Risk"
    elif combined_score >= 35:
        status_label = "High Risk"
    else:
        status_label = "Critical Risk"

    return {
        "rule_results": rule_results,
        "ai_results": ai_results,
        "combined_score": combined_score,
        "risk_score": risk_score,
        "status_label": status_label,
    }


def perform_compliance_audit(
    company_name: str,
    industry: str,
    policy_text: str,
    policy_url: Optional[str],
    db: Session,
    user_id: Optional[int] = None,
    prepared_analysis: Optional[dict] = None,
) -> Audit:
    """Analyze a policy and persist its audit; prepared batch analysis avoids long DB transactions."""
    analysis = prepared_analysis or prepare_compliance_analysis(company_name, industry, policy_text)
    rule_results = analysis["rule_results"]
    ai_results = analysis["ai_results"]
    combined_score = analysis["combined_score"]
    risk_score = analysis["risk_score"]
    status_label = analysis["status_label"]

    # 4. Save results to Database
    # 4.1 Lookup/Create Company
    domain = company_name.lower().replace(" ", "").replace("&", "") + ".com"
    company = db.query(Company).filter((Company.name == company_name) | (Company.domain == domain)).first()
    if not company:
        company = Company(name=company_name, domain=domain, industry=industry, size="SME")
        db.add(company)
        db.flush()
        db.refresh(company)
        
    # 4.2 Save Policy version
    policy = Policy(
        company_id=company.id,
        policy_text=policy_text,
        policy_url=policy_url,
        version_label="v1.0"
    )
    db.add(policy)
    db.flush()
    db.refresh(policy)
    
    # 4.3 Save Audit summary
    audit = Audit(
        policy_id=policy.id,
        compliance_score=combined_score,
        risk_score=risk_score,
        status=status_label,
        overall_summary=ai_results["overall_summary"],
        ai_confidence_score=ai_results.get("ai_confidence_score", 0.95),
        rules_passed_count=rule_results["passed_count"],
        rules_failed_count=rule_results["failed_count"],
        ai_observations_count=len(ai_results.get("findings", [])),
        created_by=user_id
    )
    db.add(audit)
    db.flush()
    db.refresh(audit)
    
    # 4.4 Save granular findings
    for finding in ai_results.get("findings", []):
        db_finding = Finding(
            audit_id=audit.id,
            pillar=finding["pillar"],
            issue=finding["issue"],
            severity=finding["severity"],
            confidence_score=finding.get("confidence_score", 0.9),
            dpdp_section=finding.get("dpdp_section"),
            evidence_extract=finding.get("evidence_extract"),
            reason=finding["reason"],
            business_impact=finding.get("business_impact"),
            legal_impact=finding.get("legal_impact"),
            legal_rec=finding.get("legal_rec"),
            tech_rec=finding.get("tech_rec"),
            business_rec=finding.get("business_rec"),
            evidence_start_index=finding.get("evidence_start_index", -1),
            evidence_end_index=finding.get("evidence_end_index", -1)
        )
        db.add(db_finding)
        
    # 4.5 Update Industry Benchmarks
    bench = db.query(Benchmark).filter(Benchmark.industry == industry).first()
    if bench:
        bench.companies_count += 1
        bench.average_compliance_score = round(
            ((bench.average_compliance_score * (bench.companies_count - 1)) + combined_score) / bench.companies_count, 1
        )
        bench.average_risk_score = round(100.0 - bench.average_compliance_score, 1)
        db.add(bench)
    else:
        # Create dynamically if the sector wasn't in startup list
        new_bench = Benchmark(
            industry=industry,
            average_compliance_score=combined_score,
            average_risk_score=risk_score,
            companies_count=1
        )
        db.add(new_bench)
        
    db.flush()
    db.refresh(audit)
    
    log = AuditLog(action=f"Compliance audit generated for {company_name} (Score: {combined_score})", user_id=user_id)
    db.add(log)
    db.flush()
    
    return audit


def reserve_user_audit_credits(db: Session, current_user: User, credits: int) -> Optional[CreditReservation]:
    if current_user.role in ["admin", "compliance_officer"]:
        return None
    try:
        return reserve_audit_credits(db, current_user.id, credits)
    except InsufficientCreditsError:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="You don't have enough credits to run this audit.",
        )


def release_reserved_credits(db: Session, reservation: Optional[CreditReservation]) -> None:
    if reservation is not None:
        release_audit_reservation(db, reservation)


def extract_policy_url_or_http_error(url: str) -> str:
    try:
        return extract_text_from_url(url)
    except UnsafePolicyURLError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None
    except URLFetchTimeout as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from None
    except URLExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None

@app.post("/api/audit", response_model=Union[AuditSummaryResponse, AuditDetailResponse])
def audit_policy(request: AuditRequest, req: Request, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    if not current_user:
        check_anonymous_rate_limit(req)
        
    policy_text = ""
    
    if request.policy_url:
        policy_text = extract_policy_url_or_http_error(request.policy_url)
    elif request.policy_text:
        policy_text = request.policy_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a privacy policy URL or full-text must be provided."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The extracted policy text is too short to audit. Minimum 150 characters."
        )

    reservation = reserve_user_audit_credits(db, current_user, 1) if current_user else None
    audit_user_id = reservation.user_id if reservation is not None else (current_user.id if current_user else None)

    # For anonymous users, we allow the audit to proceed (freemium landing page flow).
    # In a production app, we might want rate limiting by IP here.
    try:
        audit = perform_compliance_audit(
            company_name=request.company_name,
            industry=request.industry,
            policy_text=policy_text,
            policy_url=request.policy_url,
            db=db,
            user_id=audit_user_id
        )
        if reservation is not None:
            finalize_audit_reservation(db, reservation, [audit.id])
        db.commit()
    except Exception:
        db.rollback()
        release_reserved_credits(db, reservation)
        raise
    
    response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
    response_audit.company_name = request.company_name
    response_audit.company_domain = request.company_name.lower().replace(" ", "").replace("&", "") + ".com"
    response_audit.company_industry = request.industry
    response_audit.policy_text = policy_text
    
    if current_user:
        return response_audit
    else:
        return AuditSummaryResponse(
            id=audit.id,
            company_name=request.company_name,
            industry=request.industry,
            compliance_score=audit.compliance_score,
            status=audit.status,
            is_summary_only=True
        )

def extract_uploaded_policy(file: UploadFile) -> str:
    filename = file.filename.lower()
    file_bytes = file.file.read()

    if filename.endswith(".pdf"):
        policy_text = extract_text_from_pdf(file_bytes)
    elif filename.endswith(".docx"):
        policy_text = extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF and DOCX files are supported."
        )
        
    if len(policy_text.strip()) < 150:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extracted text from file was too short to audit."
        )
    return policy_text


@app.post("/api/audit/extract-file")
def extract_policy_file_for_batch(
    file: UploadFile = File(...),
    _current_user: User = Depends(get_current_user),
):
    """Authenticated extraction-only helper; it never creates an audit or consumes credits."""
    return {"policy_text": extract_uploaded_policy(file)}


@app.post("/api/audit/file", response_model=Union[AuditSummaryResponse, AuditDetailResponse])
def audit_policy_file(
    req: Request,
    company_name: str = Form(...),
    industry: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not current_user:
        check_anonymous_rate_limit(req)

    # Preserve the existing file-audit role behavior while normal-user charging is centralized.
    if current_user and (current_user.credits_balance or 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="You don't have enough credits to run this audit."
        )

    policy_text = extract_uploaded_policy(file)

    reservation = reserve_user_audit_credits(db, current_user, 1) if current_user else None
    audit_user_id = reservation.user_id if reservation is not None else (current_user.id if current_user else None)
    try:
        audit = perform_compliance_audit(
            company_name=company_name,
            industry=industry,
            policy_text=policy_text,
            policy_url=f"Uploaded File: {file.filename}",
            db=db,
            user_id=audit_user_id
        )
        if reservation is not None:
            finalize_audit_reservation(db, reservation, [audit.id])
        db.commit()
    except Exception:
        db.rollback()
        release_reserved_credits(db, reservation)
        raise
    
    response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
    response_audit.company_name = company_name
    response_audit.company_domain = company_name.lower().replace(" ", "").replace("&", "") + ".com"
    response_audit.company_industry = industry
    response_audit.policy_text = policy_text
    
    if current_user:
        return response_audit
    else:
        return AuditSummaryResponse(
            id=audit.id,
            company_name=company_name,
            industry=industry,
            compliance_score=audit.compliance_score,
            status=audit.status,
            is_summary_only=True
        )


@app.post("/api/audit/batch")
def audit_policy_batch(request: BatchAuditRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not request.items or len(request.items) == 0:
        raise HTTPException(status_code=400, detail="At least one company must be provided for batch audit.")

    num_items = len(request.items)
    
    reservation = reserve_user_audit_credits(db, current_user, num_items)
    audit_user_id = reservation.user_id if reservation is not None else current_user.id
        
    completed_audits = []
    try:
        prepared_items = []
        for item in request.items:
            policy_text = ""
            if item.policy_url:
                policy_text = extract_policy_url_or_http_error(item.policy_url)
            elif item.policy_text:
                policy_text = item.policy_text
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Audit input for {item.company_name} must include a policy URL or full policy text.",
                )

            if len(policy_text.strip()) < 150:
                raise HTTPException(
                    status_code=400,
                    detail=f"Policy text for {item.company_name} is too short to audit. Minimum 150 characters.",
                )

            prepared_items.append((
                item,
                policy_text,
                prepare_compliance_analysis(item.company_name, item.industry, policy_text),
            ))

        # Only begin audit persistence after every slow external analysis has completed.
        for item, policy_text, prepared_analysis in prepared_items:
            audit = perform_compliance_audit(
                company_name=item.company_name,
                industry=item.industry,
                policy_text=policy_text,
                policy_url=item.policy_url,
                db=db,
                user_id=audit_user_id,
                prepared_analysis=prepared_analysis,
            )

            response_audit = db.query(Audit).filter(Audit.id == audit.id).first()
            response_audit.company_name = item.company_name
            response_audit.company_domain = item.company_name.lower().replace(" ", "").replace("&", "") + ".com"
            response_audit.company_industry = item.industry
            response_audit.policy_text = policy_text
        
            # Serialize findings
            findings_list = []
            for f in response_audit.findings:
                findings_list.append({
                    "pillar": f.pillar,
                    "issue": f.issue,
                    "severity": f.severity,
                    "confidence_score": f.confidence_score,
                    "dpdp_section": f.dpdp_section,
                    "evidence_extract": f.evidence_extract,
                    "reason": f.reason,
                    "business_impact": f.business_impact,
                    "legal_impact": f.legal_impact,
                    "legal_rec": f.legal_rec,
                    "tech_rec": f.tech_rec,
                    "business_rec": f.business_rec
                })

            completed_audits.append({
                "id": response_audit.id,
                "company_name": response_audit.company_name,
                "company_domain": response_audit.company_domain,
                "company_industry": response_audit.company_industry,
                "compliance_score": response_audit.compliance_score,
                "risk_score": response_audit.risk_score,
                "status": response_audit.status,
                "rules_passed_count": response_audit.rules_passed_count,
                "rules_failed_count": response_audit.rules_failed_count,
                "ai_observations_count": response_audit.ai_observations_count,
                "created_at": response_audit.created_at,
                "findings": findings_list
            })

        if reservation is not None:
            finalize_audit_reservation(db, reservation, [audit["id"] for audit in completed_audits])
        db.commit()
    except Exception:
        db.rollback()
        release_reserved_credits(db, reservation)
        raise

    completed_audits_sorted = sorted(completed_audits, key=lambda a: a["compliance_score"], reverse=True)
    winner_company = completed_audits_sorted[0]["company_name"] if completed_audits_sorted else "N/A"
    avg_score = round(sum(a["compliance_score"] for a in completed_audits) / len(completed_audits), 1)

    return {
        "total_companies": len(completed_audits),
        "winner_company": winner_company,
        "average_compliance_score": avg_score,
        "audits": completed_audits
    }


# --- EXPLAINABLE GRC AND AUDIT RETRIEVAL ---

@app.get("/api/audit/history", response_model=List[AuditResponse])
def get_audit_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audits = db.query(Audit).filter(Audit.created_by == current_user.id).order_by(desc(Audit.created_at)).all()
    for a in audits:
        policy = db.query(Policy).filter(Policy.id == a.policy_id).first()
        company = db.query(Company).filter(Company.id == policy.company_id).first()
        a.company_name = company.name
        a.company_domain = company.domain
        a.company_industry = company.industry
    return audits

@app.get("/api/audit/{audit_id}", response_model=AuditDetailResponse)
def get_audit_detail(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit report not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    audit.company_name = company.name
    audit.company_domain = company.domain
    audit.company_industry = company.industry
    audit.policy_text = policy.policy_text
    return audit

@app.delete("/api/audit/{audit_id}")
def delete_audit(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit report not found.")
        
    db.query(Finding).filter(Finding.audit_id == audit_id).delete()
    db.delete(audit)
    db.commit()
    return {"message": "Audit report deleted successfully.", "id": audit_id}


# --- PDF REPORT GENERATOR ---

@app.get("/api/report/{audit_id}")
def download_pdf_report(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    findings_list = []
    for f in audit.findings:
        findings_list.append({
            "pillar": f.pillar,
            "issue": f.issue,
            "severity": f.severity,
            "confidence_score": f.confidence_score,
            "dpdp_section": f.dpdp_section,
            "evidence_extract": f.evidence_extract,
            "reason": f.reason,
            "business_impact": f.business_impact,
            "legal_impact": f.legal_impact,
            "legal_rec": f.legal_rec,
            "tech_rec": f.tech_rec,
            "business_rec": f.business_rec
        })
        
    audit_data = {
        "report_id": f"AW-AUD-{audit.id:06d}",
        "compliance_score": audit.compliance_score,
        "risk_score": audit.risk_score,
        "status": audit.status,
        "overall_summary": audit.overall_summary,
        "ai_confidence_score": audit.ai_confidence_score,
        "rules_passed_count": audit.rules_passed_count,
        "rules_failed_count": audit.rules_failed_count,
        "ai_observations_count": audit.ai_observations_count,
        "policy_text": policy.policy_text,
        "findings": findings_list
    }
    
    date_str = audit.created_at.strftime("%B %d, %Y")
    pdf_bytes = generate_audit_pdf(audit_data, company.name, company.industry, date_str)
    
    filename = f"DPDP_Audit_{company.name.replace(' ', '_')}_{audit.created_at.strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@app.get("/api/audit/{audit_id}/remediated-policy")
def download_remediated_policy(
    audit_id: int,
    format: Literal["pdf", "docx", "text"] = Query("pdf"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = db.query(Audit).filter(
        Audit.id == audit_id, Audit.created_by == current_user.id
    ).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")

    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()

    findings_list = []
    for f in audit.findings:
        findings_list.append({
            "pillar": f.pillar,
            "issue": f.issue,
            "severity": f.severity,
            "confidence_score": f.confidence_score,
            "dpdp_section": f.dpdp_section,
            "evidence_extract": f.evidence_extract,
            "reason": f.reason,
            "legal_rec": f.legal_rec,
            "evidence_start_index": f.evidence_start_index,
            "evidence_end_index": f.evidence_end_index,
        })

    audit_data = {
        "company_name": company.name,
        "findings": findings_list,
    }

    try:
        remediated_text = generate_remediated_policy(audit_data, policy.policy_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if format == "text":
        return {"text": remediated_text}

    date_stamp = audit.created_at.strftime("%Y%m%d")
    safe_name = company.name.replace(" ", "_")

    if format == "docx":
        docx_bytes = generate_remediated_policy_docx(remediated_text, company.name)
        filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    pdf_bytes = generate_remediated_policy_pdf(remediated_text, company.name)
    filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

from pydantic import BaseModel
class FillPolicyRequest(BaseModel):
    text: str
    format: Literal["pdf", "docx"] = "pdf"

@app.post("/api/audit/{audit_id}/remediated-policy/fill")
def download_filled_policy(
    audit_id: int,
    request: FillPolicyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    audit = db.query(Audit).filter(
        Audit.id == audit_id, Audit.created_by == current_user.id
    ).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")

    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    date_stamp = audit.created_at.strftime("%Y%m%d")
    safe_name = company.name.replace(" ", "_")

    if request.format == "docx":
        docx_bytes = generate_remediated_policy_docx(request.text, company.name)
        filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.docx"
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    pdf_bytes = generate_remediated_policy_pdf(request.text, company.name)
    filename = f"DPDP_Remediated_Policy_{safe_name}_{date_stamp}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --- DASHBOARD & BENCHMARKS ---

@app.get("/api/dashboard")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audits = db.query(Audit).filter(Audit.created_by == current_user.id).order_by(desc(Audit.created_at)).all()
    total_audits = len(audits)
    
    if total_audits == 0:
        return {
            "total_audits": 0,
            "average_compliance_score": 0.0,
            "risk_distribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0},
            "average_ai_confidence": None,
            "ai_confidence_note": "Verified AI confidence is unavailable because audit provenance is not stored.",
            "pillar_metrics": build_pillar_metrics([]),
            "recent_audits": [],
            "executive_risk": {
                "overall_risk": "None",
                "highest_risk_area": "None",
                "best_performing_area": "None",
                "compliance_pct": 0.0,
                "critical_findings": 0,
                "immediate_priority": "No audits completed yet."
            }
        }
        
    avg_score = round(sum(a.compliance_score for a in audits) / total_audits, 1)
    
    severities = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Informational": 0}
    audit_ids = [audit.id for audit in audits]
    findings = db.query(Finding).filter(Finding.audit_id.in_(audit_ids)).all()
    for f in findings:
        if f.severity in severities:
            severities[f.severity] += 1
            
    recent = []
    for a in audits[:5]:
        p = db.query(Policy).filter(Policy.id == a.policy_id).first()
        c = db.query(Company).filter(Company.id == p.company_id).first()
        recent.append({
            "id": a.id,
            "company_name": c.name,
            "industry": c.industry,
            "score": a.compliance_score,
            "status": a.status,
            "created_at": a.created_at
        })
        
    pillar_metrics = build_pillar_metrics(findings)
    highest_risk_pillars = select_pillars_by_recorded_severity(
        pillar_metrics, highest_risk=True
    )
    best_performing_pillars = select_pillars_by_recorded_severity(
        pillar_metrics, highest_risk=False
    )
    highest_risk = format_pillar_names(highest_risk_pillars)
    best_performing = format_pillar_names(best_performing_pillars)

    overall_status = "Moderate Risk" if avg_score >= 50 else "High Risk"
    if avg_score >= 80:
        overall_status = "Low Risk"
        
    immediate_priority = "No assessed finding data is available."
    if highest_risk_pillars:
        highest_metric = next(
            metric
            for metric in pillar_metrics
            if metric["pillar"] == highest_risk_pillars[0]
        )
        immediate_priority = (
            f"Review recorded {highest_metric['highest_severity'].lower()} findings in "
            f"{highest_risk}."
        )

    executive_risk = {
        "overall_risk": overall_status,
        "highest_risk_area": highest_risk,
        "best_performing_area": best_performing,
        "compliance_pct": avg_score,
        "critical_findings": severities["Critical"] + severities["High"],
        "immediate_priority": immediate_priority
    }
    
    return {
        "total_audits": total_audits,
        "average_compliance_score": avg_score,
        "risk_distribution": severities,
        # Existing rows do not record whether Gemini or deterministic fallback
        # produced the stored confidence. Reporting an average would therefore
        # misrepresent some fallback values as verified AI confidence.
        "average_ai_confidence": None,
        "ai_confidence_note": "Verified AI confidence is unavailable because audit provenance is not stored.",
        "pillar_metrics": pillar_metrics,
        "recent_audits": recent,
        "executive_risk": executive_risk
    }

@app.get("/api/benchmark", response_model=List[BenchmarkResponse])
def get_benchmarks(db: Session = Depends(get_db)):
    benchmarks = db.query(Benchmark).order_by(desc(Benchmark.average_compliance_score)).all()
    return [
        {
            "id": benchmark.id,
            "industry": benchmark.industry,
            "average_compliance_score": benchmark.average_compliance_score,
            "average_risk_score": benchmark.average_risk_score,
            "companies_count": benchmark.companies_count,
            "updated_at": benchmark.updated_at,
            "contains_seeded_demonstration_data": (
                benchmark.industry in DEMONSTRATION_BENCHMARK_INDUSTRIES
            ),
        }
        for benchmark in benchmarks
    ]

@app.get("/api/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    subquery = db.query(
        Policy.company_id,
        func.max(Audit.compliance_score).label("max_score")
    ).join(Audit, Audit.policy_id == Policy.id).group_by(Policy.company_id).subquery()
    
    query_results = db.query(Company, Audit).join(
        Policy, Policy.company_id == Company.id
    ).join(
        Audit, Audit.policy_id == Policy.id
    ).join(
        subquery, (subquery.c.company_id == Company.id) & (subquery.c.max_score == Audit.compliance_score)
    ).order_by(desc(Audit.compliance_score)).limit(10).all()
    
    leaderboard = []
    for rank, (company, audit) in enumerate(query_results, 1):
        leaderboard.append({
            "rank": rank,
            "company_name": company.name,
            "score": audit.compliance_score,
            "industry": company.industry,
            "last_audited": audit.created_at
        })
    return leaderboard


# --- POLICY COMPARER & PDF EXPORTER ---

@app.post("/api/compare")
def compare_policies(request: CompareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit_a = db.query(Audit).filter(Audit.id == request.audit_id_a, Audit.created_by == current_user.id).first()
    audit_b = db.query(Audit).filter(Audit.id == request.audit_id_b, Audit.created_by == current_user.id).first()
    
    if not audit_a or not audit_b:
        raise HTTPException(status_code=404, detail="One or both audits could not be found.")
        
    policy_a = db.query(Policy).filter(Policy.id == audit_a.policy_id).first()
    company_a = db.query(Company).filter(Company.id == policy_a.company_id).first()
    
    policy_b = db.query(Policy).filter(Policy.id == audit_b.policy_id).first()
    company_b = db.query(Company).filter(Company.id == policy_b.company_id).first()
    
    issues_a = [f.issue for f in audit_a.findings if f.severity in ["Critical", "High", "Medium"]]
    issues_b = [f.issue for f in audit_b.findings if f.severity in ["Critical", "High", "Medium"]]
    
    compliance_winner = company_a.name if audit_a.compliance_score >= audit_b.compliance_score else company_b.name
    
    return {
        "company_a": {
            "name": company_a.name,
            "score": audit_a.compliance_score,
            "status": audit_a.status,
            "findings_count": len(audit_a.findings),
            "primary_gaps": issues_a[:3]
        },
        "company_b": {
            "name": company_b.name,
            "score": audit_b.compliance_score,
            "status": audit_b.status,
            "findings_count": len(audit_b.findings),
            "primary_gaps": issues_b[:3]
        },
        "winner": compliance_winner,
        "gap_analysis": f"{company_a.name} scores {audit_a.compliance_score}/100 compared to {company_b.name}'s {audit_b.compliance_score}/100. "
                       f"{company_a.name} is stronger in {audit_a.findings[0].pillar if audit_a.findings else 'Consent'} compliance, "
                       f"while {company_b.name} exhibits critical vulnerabilities in {audit_b.findings[0].pillar if audit_b.findings else 'Notice'}."
    }

@app.get("/api/compare/{audit_id_a}/{audit_id_b}/report")
def download_comparison_report(audit_id_a: int, audit_id_b: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit_a = db.query(Audit).filter(Audit.id == audit_id_a, Audit.created_by == current_user.id).first()
    audit_b = db.query(Audit).filter(Audit.id == audit_id_b, Audit.created_by == current_user.id).first()
    
    if not audit_a or not audit_b:
        raise HTTPException(status_code=404, detail="One or both audits could not be found.")
        
    policy_a = db.query(Policy).filter(Policy.id == audit_a.policy_id).first()
    company_a = db.query(Company).filter(Company.id == policy_a.company_id).first()
    
    policy_b = db.query(Policy).filter(Policy.id == audit_b.policy_id).first()
    company_b = db.query(Company).filter(Company.id == policy_b.company_id).first()
    
    issues_a = [f.issue for f in audit_a.findings if f.severity in ["Critical", "High", "Medium"]]
    issues_b = [f.issue for f in audit_b.findings if f.severity in ["Critical", "High", "Medium"]]
    
    compliance_winner = company_a.name if audit_a.compliance_score >= audit_b.compliance_score else company_b.name
    gap_analysis = f"{company_a.name} scores {audit_a.compliance_score}/100 compared to {company_b.name}'s {audit_b.compliance_score}/100. " \
                   f"{company_a.name} is stronger in {audit_a.findings[0].pillar if audit_a.findings else 'Consent'} compliance, " \
                   f"while {company_b.name} exhibits critical vulnerabilities in {audit_b.findings[0].pillar if audit_b.findings else 'Notice'}."
                   
    compare_data = {
        "winner": compliance_winner,
        "gap_analysis": gap_analysis
    }
    
    comp_a = {
        "name": company_a.name,
        "score": audit_a.compliance_score,
        "status": audit_a.status,
        "findings_count": len(audit_a.findings),
        "primary_gaps": issues_a[:3]
    }
    comp_b = {
        "name": company_b.name,
        "score": audit_b.compliance_score,
        "status": audit_b.status,
        "findings_count": len(audit_b.findings),
        "primary_gaps": issues_b[:3]
    }
    
    pdf_bytes = generate_comparison_pdf(compare_data, comp_a, comp_b)
    
    filename = f"DPDP_Comparison_{company_a.name.replace(' ', '_')}_vs_{company_b.name.replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# --- KNOWLEDGE BASE (DPDP ACT 2023 - 100% ACCURATE MAPPINGS) ---

DPDP_KB = {
    "section_5": {
        "title": "Section 5 - Notice",
        "explanation": "Before or at the time of seeking consent, data fiduciaries must present a clear notice written in plain, easily understandable language. The notice must detail what personal data is collected, the specific purpose of processing, and explain the rights of the Data Principal to withdraw consent, correct data, or file grievances.",
        "penalties": "Up to ₹150 Crore for failing to present appropriate notice.",
        "best_practice": "Use a tabular layout listing each permission requested paired with a corresponding business purpose. Avoid generic 'we collect information to improve our services'."
    },
    "section_6": {
        "title": "Section 6 - Consent",
        "explanation": "Consent of the Data Principal must be free, specific, informed, unconditional, and unambiguous. It must be indicated by a clear affirmative action. Any part of the consent that violates the provisions of this Act is invalid. Consent must also be granular (not bundled with terms of service) and withdrawable at any time.",
        "penalties": "Up to ₹50 Crore for failing to provide granular consent mechanisms.",
        "best_practice": "Implement explicit opt-in checkboxes on signup sheets. Provide a dedicated 'Withdraw Consent' button in profile settings."
    },
    "section_8": {
        "title": "Section 8 - Obligations of Data Fiduciary",
        "explanation": "Data Fiduciaries are responsible for ensuring personal data is processed accurately, safeguarded with reasonable security safeguards to prevent breaches, and erased once the purpose of collection is fulfilled.",
        "penalties": "Up to ₹250 Crore for failing to implement security safeguards, resulting in data breaches.",
        "best_practice": "Encrypt database columns holding PII at rest. Implement automated data lifecycle retention rules."
    },
    "section_9": {
        "title": "Section 9 - Processing of Personal Data of Children",
        "explanation": "Data fiduciaries must obtain verifiable parental consent before processing any personal data of a child (under 18 years) or a person with disability. Fiduciaries are strictly prohibited from engaging in any tracking, behavioral monitoring, or targeted advertising directed at children.",
        "penalties": "Up to ₹200 Crore for breaching children's data obligations.",
        "best_practice": "Implement age gates during registration. Flag and exclude accounts under 18 from marketing pixel triggers."
    },
    "section_11": {
        "title": "Section 11 - Right to Access Information About Personal Data",
        "explanation": "The Data Principal has the right to obtain from the Data Fiduciary a summary of personal data being processed, the identities of all other Data Fiduciaries and Data Processors with whom the personal data has been shared, and any other information as may be prescribed.",
        "penalties": "Up to ₹10 Crore for refusing to provide details of processed data to Data Principals.",
        "best_practice": "Build a secure data export dashboard allowing users to view and download a copy of all database records linked to their account."
    },
    "section_12": {
        "title": "Section 12 - Right to Correction, Completion, Erasure of Personal Data",
        "explanation": "A Data Principal has the right to correction, completion, and erasure of their personal data. The Data Fiduciary must correct, complete, or erase the data upon receiving a valid request, unless retention is necessary for legal purposes.",
        "penalties": "Up to ₹50 Crore for refusing to correct or erase user data upon valid requests.",
        "best_practice": "Provide self-service buttons inside settings to correct profile details and request account deletion."
    },
    "section_13": {
        "title": "Section 13 - Right to Grievance Redressal",
        "explanation": "A Data Principal has the right to register a grievance with the Data Fiduciary regarding any act or omission in processing their data. Fiduciaries must set up an efficient redressal mechanism and publish the contact details of a Nodal/Grievance Officer.",
        "penalties": "Up to ₹10 Crore for missing Grievance Redressal channels.",
        "best_practice": "State the Grievance Redressal Officer's name, email, and response SLA clearly at the bottom of the privacy notice."
    },
    "section_16": {
        "title": "Section 16 - Processing of Personal Data Outside India",
        "explanation": "The Central Government may restrict the transfer of personal data by a Data Fiduciary for processing to such country or territory outside India as may be notified. Disclosures regarding cross-border transfers are mandatory.",
        "penalties": "Up to ₹10 Crore for violating cross-border data transfer blacklists or notice requirements.",
        "best_practice": "Audit cloud server locations and maintain standard contractual clauses with foreign sub-processors."
    }
}

@app.get("/api/kb")
def search_knowledge_base(query: Optional[str] = Query(None)):
    if not query:
        return DPDP_KB
    query = query.lower()
    results = {}
    for sec, details in DPDP_KB.items():
        if query in sec or query in details["title"].lower() or query in details["explanation"].lower():
            results[sec] = details
    return results


# --- AI COPILOT & POLICY REWRITE ---

@app.post("/api/audit/copilot", response_model=CopilotResponse)
def audit_copilot(request: CopilotRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == request.audit_id, Audit.created_by == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found.")
        
    policy = db.query(Policy).filter(Policy.id == audit.policy_id).first()
    company = db.query(Company).filter(Company.id == policy.company_id).first()
    
    findings_summary = []
    for f in audit.findings:
        findings_summary.append(f"- {f.pillar}: {f.issue} (Severity: {f.severity}) - Reason: {f.reason}")
        
    findings_str = "\n".join(findings_summary)
    
    history_text = "\n".join(
        f"{'User' if item.role == 'user' else 'Assistant'}: {item.content.strip()}"
        for item in request.history
    )
    prompt = f"""
You are 'AuditWeave Copilot', an interactive compliance assistant.
Use the completed DPDP Act 2023 audit context below and the conversation
history to answer the latest user question. When asked about an earlier
question, use the supplied conversation history.

Audit Context:
Company: {company.name}
Industry: {company.industry}
Compliance Score: {audit.compliance_score}/100
Overall Risk: {audit.status}
Rules Passed: {audit.rules_passed_count}
Rule Violations: {audit.rules_failed_count}
Gaps Identified:
{findings_str}

Conversation History:
{history_text or '(none)'}

Latest User Question:
{request.message.strip()}

Provide helpful, professional GRC guidance grounded in this audit. Use precise
DPDP Act 2023 references and practical remediation steps when relevant.
"""

    if not HAS_GEMINI_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Copilot is temporarily unavailable. Please try again later.",
        )

    try:
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.6-flash"))
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        if not response_text:
            raise ValueError("Gemini returned an empty Copilot response.")
    except Exception as exc:
        logger.warning("Copilot Gemini call failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Copilot is temporarily unavailable. Please try again later.",
        ) from None

    return {
        "response": response_text,
        "suggested_actions": [
            f"Draft compliance clause for {audit.findings[0].pillar if audit.findings else 'Consent'}",
            "Export GRC compliance task checklist",
            "View recommended notice clauses",
        ]
    }

@app.post("/api/audit/rewrite", response_model=RewriteResponse)
def audit_rewrite(
    request: RewriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Atomically verify finding existence and ownership via JOIN.
    # A finding_id from another user's audit returns None (IDOR protection).
    finding = (
        db.query(Finding)
        .join(Audit, Finding.audit_id == Audit.id)
        .filter(
            Finding.id == request.finding_id,
            Audit.created_by == current_user.id,
        )
        .first()
    )
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found.")

    # Centralised eligibility guard — enforced server-side regardless of UI state.
    if not is_finding_eligible_for_rewrite(finding):
        raise HTTPException(
            status_code=400,
            detail="This finding is already compliant and does not require a rewrite.",
        )

    # Load the parent policy text server-side for richer clause context.
    # The client NEVER provides policy wording; the DB is the sole source of truth.
    policy_text: str = ""
    try:
        if finding.audit and finding.audit.policy:
            policy_text = finding.audit.policy.policy_text or ""
    except Exception:
        pass  # Relationship unavailable; extract_clause_context falls back safely.

    # Recover the original clause and bounded surrounding context from DB indexes.
    original_clause, surrounding_context = extract_clause_context(
        policy_text=policy_text,
        evidence_extract=finding.evidence_extract,
        start_index=finding.evidence_start_index,
        end_index=finding.evidence_end_index,
    )

    system_prompt = build_rewrite_prompt(
        pillar=finding.pillar,
        issue=finding.issue,
        dpdp_section=finding.dpdp_section,
        reason=finding.reason,
        original_clause=original_clause,
        surrounding_context=surrounding_context,
    )

    rewritten: str = ""
    generation_mode: Literal["ai", "template"] = "template"

    if HAS_GEMINI_KEY:
        try:
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.6-flash"))
            response = model.generate_content(
                system_prompt,
                generation_config={"max_output_tokens": 600, "temperature": 0.3},
            )
            raw = clean_model_rewrite(response.text or "")
            if len(raw) >= 40:
                rewritten = raw
                generation_mode = "ai"
        except Exception as exc:
            logger.warning("AI rewrite failed for finding %s: %s", finding.id, exc)

    if not rewritten:
        rewritten = build_safe_fallback(
            pillar=finding.pillar,
            issue=finding.issue,
            original_text=original_clause,
        )
        generation_mode = "template"

    disclaimer = (
        "Drafting assistance only; this is not legal advice or a compliance guarantee. "
        "Replace every square-bracket placeholder with verified organisation details and "
        "have the clause reviewed by a qualified professional before publishing."
    )

    return {
        "finding_id": finding.id,
        "original_text": original_clause,
        "rewritten_text": rewritten,
        "disclaimer": disclaimer,
        "generation_mode": generation_mode,
    }


# --- RESEARCH MODE ---

@app.post("/api/research")
def run_batch_research(request: List[str], db: Session = Depends(get_db), _current_user: User = Depends(get_current_user)):
    results = []
    
    companies_mock = {
        "Flipkart": {"industry": "E-commerce", "score": 68.5, "passed": 6, "failed": 3, "gaps": ["Children's Data Parental Consent", "Granular Consent"]},
        "Meesho": {"industry": "E-commerce", "score": 59.2, "passed": 5, "failed": 4, "gaps": ["Children's Data", "Consent Withdrawal"]},
        "PhonePe": {"industry": "FinTech", "score": 82.0, "passed": 8, "failed": 1, "gaps": ["Data Retention Period"]},
        "Zepto": {"industry": "E-commerce", "score": 64.0, "passed": 6, "failed": 3, "gaps": ["Grievance Redressal Details"]},
        "Urban Company": {"industry": "SaaS", "score": 76.5, "passed": 7, "failed": 2, "gaps": ["Grievance Response SLA"]},
        "Paytm": {"industry": "FinTech", "score": 79.4, "passed": 7, "failed": 2, "gaps": ["Cross-Border disclosures"]},
        "Zomato": {"industry": "E-commerce", "score": 71.8, "passed": 7, "failed": 2, "gaps": ["Children's tracking"]},
        "Swiggy": {"industry": "E-commerce", "score": 70.5, "passed": 7, "failed": 2, "gaps": ["Granular marketing consent"]},
        "Ola": {"industry": "E-commerce", "score": 60.1, "passed": 5, "failed": 4, "gaps": ["Consent withdrawal", "Children's Data"]}
    }
    
    for cname in request:
        cdata = companies_mock.get(cname, {"industry": "SaaS", "score": 72.0, "passed": 7, "failed": 2, "gaps": ["Notice Details"]})
        results.append({
            "company_name": cname,
            "industry": cdata["industry"],
            "compliance_score": cdata["score"],
            "risk_score": round(100 - cdata["score"], 1),
            "passed_rules": cdata["passed"],
            "failed_rules": cdata["failed"],
            "critical_gaps": cdata["gaps"]
        })
        
    return {
        "report_title": "India DPDP Compliance Research Report 2026",
        "audit_count": len(request),
        "average_market_score": round(sum(r["compliance_score"] for r in results) / len(results), 1) if results else 0,
        "winner": max(results, key=lambda x: x["compliance_score"])["company_name"] if results else "None",
        "industry_breakdown": results
    }


# --- CONTACT FORM ---

CONTACT_ADMIN_EMAIL = os.getenv("CONTACT_ADMIN_EMAIL", "").strip()
CONTACT_FROM_EMAIL = os.getenv("CONTACT_FROM_EMAIL", "").strip()
CONTACT_RATE_LIMIT_COUNT = 5
CONTACT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60
contact_rate_limits: Dict[str, List[datetime.datetime]] = {}


def check_contact_rate_limit(request: Request) -> None:
    """Limit repeated contact submissions using the directly connected client IP."""
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.datetime.utcnow()
    cutoff = now - datetime.timedelta(seconds=CONTACT_RATE_LIMIT_WINDOW_SECONDS)

    for ip_address in list(contact_rate_limits):
        recent_attempts = [attempt for attempt in contact_rate_limits[ip_address] if attempt > cutoff]
        if recent_attempts:
            contact_rate_limits[ip_address] = recent_attempts
        else:
            contact_rate_limits.pop(ip_address, None)

    attempts = contact_rate_limits.setdefault(client_ip, [])
    if len(attempts) >= CONTACT_RATE_LIMIT_COUNT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many contact requests. Please try again later.",
        )
    attempts.append(now)

@app.post("/api/contact", response_model=ContactResponse)
def submit_contact_form(request: ContactRequest, http_request: Request):
    """Accept a contact message only when the support notification is delivered."""
    if not CONTACT_ADMIN_EMAIL or not CONTACT_FROM_EMAIL:
        logger.error("Contact email service is not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contact service is temporarily unavailable. Please try again later.",
        )

    check_contact_rate_limit(http_request)

    topic_label = request.other_topic if request.topic == "other" else request.topic
    subject = f"[AuditWeave Contact] {topic_label} — from {request.name}"
    body_text = (
        f"Name: {request.name}\n"
        f"Email: {request.email}\n"
        f"Topic: {topic_label}\n"
        f"---\n"
        f"{request.message}"
    )
    body_html = (
        f"<p><strong>Name:</strong> {html.escape(request.name)}</p>"
        f"<p><strong>Email:</strong> {html.escape(str(request.email))}</p>"
        f"<p><strong>Topic:</strong> {html.escape(topic_label)}</p>"
        f"<hr>"
        f"<p>{html.escape(request.message).replace(chr(10), '<br>')}</p>"
    )

    try:
        admin_delivery = send_email(
            to=CONTACT_ADMIN_EMAIL,
            subject=subject,
            html=body_html,
            text=body_text,
            from_address=CONTACT_FROM_EMAIL,
            reply_to=str(request.email),
        )
        if not admin_delivery:
            raise RuntimeError("Email provider rejected contact admin delivery.")
    except Exception as exc:
        logger.error("Contact admin delivery failed (error_type=%s).", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contact service is temporarily unavailable. Please try again later.",
        ) from None

    try:
        acknowledgement = render_contact_acknowledgement_email(request.name)
        sent = send_email(
            to=str(request.email),
            subject=acknowledgement.subject,
            html=acknowledgement.html,
            text=acknowledgement.text,
            from_address=CONTACT_FROM_EMAIL,
        )
        if not sent:
            raise RuntimeError("Email provider rejected contact acknowledgement delivery.")
    except Exception as exc:
        logger.warning(
            "Contact acknowledgment delivery failed after admin acceptance "
            "(error_type=%s).",
            type(exc).__name__,
        )

    logger.info("Contact admin notification accepted for %s.", CONTACT_ADMIN_EMAIL)

    return ContactResponse(
        success=True,
        message="Your message has been sent. Our team will respond within 12 business hours."
    )

# --- PAYMENTS (RAZORPAY) ---

import uuid
import razorpay
from .models import CreditTransaction, PaymentOrder, PaymentReceipt

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None


# --- RAZORPAY OFFERS ---

TARGET_OFFER_METADATA = {
    "offer_TwSlqIzMq1cxqH": {
        "id": "offer_TwSlqIzMq1cxqH",
        "title": "20% OFF special for you as an welcome GIFT",
        "description": "Instant 20% discount up to ₹10,000 on a minimum purchase of ₹100. Applicable on UPI, Cards, Netbanking, and Wallets.",
        "percent_off": 20.0,
        "flat_amount_off": None,
        "min_amount": 10000,
        "valid_till": "2027-01-01T23:59:00",
        "active": True,
    }
}

OFFER_ALIASES = {
    "WELCOME20": "offer_TwSlqIzMq1cxqH",
    "WELCOME": "offer_TwSlqIzMq1cxqH",
    "DISCOUNT20": "offer_TwSlqIzMq1cxqH",
    "AUDIT20": "offer_TwSlqIzMq1cxqH",
}


@app.get("/api/payments/offers/{offer_id}", response_model=OfferResponse)
def get_offer_details(offer_id: str):
    """
    Fetch and validate Razorpay offer details by offer_id or promotional alias.
    """
    sanitized_id = offer_id.strip()
    upper_alias = sanitized_id.upper()
    if upper_alias in OFFER_ALIASES:
        sanitized_id = OFFER_ALIASES[upper_alias]

    if not (sanitized_id.startswith("offer_") or upper_alias in OFFER_ALIASES):
        raise HTTPException(status_code=400, detail="Invalid coupon or offer ID format.")

    # 1. Check registered campaign metadata (e.g. offer_TwSlqIzMq1cxqH)
    if sanitized_id in TARGET_OFFER_METADATA:
        return TARGET_OFFER_METADATA[sanitized_id]

    raise HTTPException(status_code=404, detail="Offer not found or no longer active.")


@app.get("/api/credits/plans", response_model=List[CreditPlanResponse])
def get_credit_plans():
    return list_credit_packs()


@app.get("/api/credits/summary", response_model=CreditSummaryResponse)
def get_credit_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    purchase_condition = (
        (CreditTransaction.status == "completed")
        & (CreditTransaction.transaction_type == "purchase")
        & (CreditTransaction.amount > 0)
    )
    usage_condition = (
        (CreditTransaction.status == "completed")
        & (CreditTransaction.transaction_type == "audit_usage")
        & (CreditTransaction.amount < 0)
    )
    complete_origin_condition = (
        (CreditTransaction.status == "completed")
        & (CreditTransaction.transaction_type == "welcome_bonus")
        & (CreditTransaction.reference_type == "signup")
        & (CreditTransaction.amount == 2)
        & (CreditTransaction.balance_after == 2)
    )
    incomplete_row_condition = (
        (CreditTransaction.status == "completed")
        & (CreditTransaction.transaction_type.in_(["welcome_bonus", "purchase", "audit_usage"]))
        & (CreditTransaction.balance_after.is_(None))
    )
    purchased, used, has_origin, has_incomplete_row = db.query(
        func.coalesce(func.sum(case((purchase_condition, CreditTransaction.amount), else_=0)), 0),
        func.coalesce(func.sum(case((usage_condition, -CreditTransaction.amount), else_=0)), 0),
        func.max(case((complete_origin_condition, 1), else_=0)),
        func.max(case((incomplete_row_condition, 1), else_=0)),
    ).filter(CreditTransaction.user_id == current_user.id).one()

    return {
        "available_credits": int(current_user.credits_balance),
        "recorded_purchased_credits": int(purchased),
        "recorded_used_credits": int(used),
        "has_incomplete_history": not bool(has_origin) or bool(has_incomplete_row),
    }


def mask_billing_reference(reference: Optional[str]) -> Optional[str]:
    if not reference:
        return None
    suffix = reference[-4:]
    prefix = reference.split("_", 1)[0] if "_" in reference else "ref"
    return f"{prefix}_••••{suffix}"


@app.get("/api/credits/transactions", response_model=CreditActivityPage)
def get_credit_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str = Query("", max_length=100),
    type_filter: Literal["all", "purchases", "usage", "bonuses"] = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id,
        CreditTransaction.status == "completed",
        CreditTransaction.transaction_type != "audit_reservation",
    )
    type_map = {
        "purchases": ["purchase"],
        "usage": ["audit_usage"],
        "bonuses": ["welcome_bonus", "bonus"],
    }
    if type_filter != "all":
        query = query.filter(CreditTransaction.transaction_type.in_(type_map[type_filter]))

    term = search.strip()
    if term:
        pattern = f"%{term}%"
        query = query.filter(or_(
            CreditTransaction.description.ilike(pattern),
            CreditTransaction.transaction_type.ilike(pattern),
            CreditTransaction.reference_id.ilike(pattern),
        ))

    total = query.count()
    rows = (
        query.order_by(CreditTransaction.created_at.desc(), CreditTransaction.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [{
        "id": row.id,
        "created_at": row.created_at,
        "transaction_type": row.transaction_type,
        "amount": row.amount,
        "balance_after": row.balance_after,
        "description": row.description,
        "reference_type": row.reference_type,
        "reference_id": mask_billing_reference(row.reference_id) if row.reference_type == "payment" else row.reference_id,
        "status": row.status,
    } for row in rows]
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
    }


@app.get("/api/payments/history", response_model=PaymentHistoryPage)
def get_payment_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str = Query("", max_length=100),
    status_filter: Literal["all", "verified", "created", "processing", "failed"] = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PaymentOrder, PaymentReceipt.receipt_number)
        .outerjoin(PaymentReceipt, PaymentReceipt.payment_order_id == PaymentOrder.id)
        .filter(PaymentOrder.user_id == current_user.id)
    )
    if status_filter != "all":
        query = query.filter(PaymentOrder.status == status_filter)

    term = search.strip()
    if term:
        pattern = f"%{term}%"
        query = query.filter(or_(
            PaymentOrder.plan_name.ilike(pattern),
            PaymentOrder.razorpay_order_id.ilike(pattern),
            PaymentOrder.razorpay_payment_id.ilike(pattern),
            PaymentOrder.status.ilike(pattern),
            PaymentReceipt.receipt_number.ilike(pattern),
        ))

    total = query.count()
    rows = (
        query.order_by(PaymentOrder.created_at.desc(), PaymentOrder.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [{
        "id": payment_order.id,
        "plan_id": payment_order.plan_id,
        "plan_name": payment_order.plan_name or "Legacy Credit Purchase",
        "credits_purchased": payment_order.credits_purchased,
        "amount_paise": payment_order.amount_paid,
        "currency": payment_order.currency or "INR",
        "status": payment_order.status or "unknown",
        "payment_reference": mask_billing_reference(payment_order.razorpay_payment_id or payment_order.razorpay_order_id),
        "created_at": payment_order.created_at,
        "verified_at": payment_order.verified_at,
        "receipt_available": bool(receipt_number and payment_order.status == "verified"),
        "receipt_number": receipt_number if payment_order.status == "verified" else None,
    } for payment_order, receipt_number in rows]
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size,
    }


@app.post("/api/payments/create-order")
async def create_payment_order(request: CreateOrderRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Razorpay order creation."""
    pack = get_credit_pack(request.plan_id)
    if pack is None:
        raise HTTPException(status_code=400, detail="Unknown credit plan.")

    # Calculate price with offer discount applied
    amount_inr = int(pack["price_inr"])
    applied_offer = None
    resolved_offer_id = None

    if request.offer_id:
        raw_id = request.offer_id.strip()
        upper_alias = raw_id.upper()
        resolved_offer_id = OFFER_ALIASES.get(upper_alias, raw_id)
        if resolved_offer_id in TARGET_OFFER_METADATA and TARGET_OFFER_METADATA[resolved_offer_id]["active"]:
            applied_offer = TARGET_OFFER_METADATA[resolved_offer_id]
            if applied_offer.get("percent_off") and applied_offer["percent_off"] > 0:
                discount = round((amount_inr * applied_offer["percent_off"]) / 100.0)
                amount_inr = max(1, amount_inr - discount)
            elif applied_offer.get("flat_amount_off") and applied_offer["flat_amount_off"] > 0:
                discount = round(applied_offer["flat_amount_off"] / 100.0)
                amount_inr = max(1, amount_inr - discount)

    amount_paise = amount_inr * 100

    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the server.")

    try:
        order_payload = {
            "amount": amount_paise,
            "currency": pack["currency"],
            "receipt": f"receipt_{uuid.uuid4().hex[:10]}",
            "notes": {
                "plan_id": pack["id"],
                "user_id": str(current_user.id),
            }
        }
        if resolved_offer_id:
            order_payload["notes"]["offer_id"] = resolved_offer_id
            order_payload["notes"]["discounted"] = "true"
            try:
                order_payload_with_offer = {**order_payload, "offers": [resolved_offer_id]}
                order_data = razorpay_client.order.create(order_payload_with_offer)
            except Exception as offer_err:
                logger.info("Order create with offers array: %s; falling back to direct amount", offer_err)
                order_data = razorpay_client.order.create(order_payload)
        else:
            order_data = razorpay_client.order.create(order_payload)
        order_id = order_data["id"]

        # Store the order in the database
        payment_order = PaymentOrder(
            user_id=current_user.id,
            plan_id=pack["id"],
            plan_name=pack["title"],
            razorpay_order_id=order_id,
            credits_purchased=pack["credits"],
            amount_paid=amount_paise,
            currency=pack["currency"],
            status="created"
        )
        db.add(payment_order)
        db.commit()

        return order_data
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        logger.exception("Razorpay order creation failed for user %s", current_user.id)
        raise HTTPException(status_code=502, detail="Payment provider order creation failed.")


def validate_razorpay_payment(payment_order: dict, razorpay_payment_id: str) -> None:
    try:
        provider_payment = razorpay_client.payment.fetch(razorpay_payment_id)
    except Exception:
        logger.exception("Unable to validate Razorpay payment %s", razorpay_payment_id)
        raise HTTPException(status_code=502, detail="Unable to confirm payment with the provider.")

    try:
        provider_amount = int(provider_payment.get("amount", -1))
    except (TypeError, ValueError):
        provider_amount = -1

    has_offer = bool(provider_payment.get("offer_id")) or (provider_payment.get("discount") is not None)
    is_amount_valid = (provider_amount == payment_order["amount_paid"]) or (
        has_offer and 0 < provider_amount <= payment_order["amount_paid"]
    )

    if (
        provider_payment.get("order_id") != payment_order["razorpay_order_id"]
        or not is_amount_valid
        or provider_payment.get("currency") != payment_order["currency"]
        or provider_payment.get("status") != "captured"
    ):
        raise HTTPException(status_code=400, detail="Payment details do not match the order.")

@app.get("/api/receipts/{receipt_number}/pdf")
def download_payment_receipt(
    receipt_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(PaymentReceipt).filter(
        PaymentReceipt.receipt_number == receipt_number,
        PaymentReceipt.user_id == current_user.id,
    ).one_or_none()
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")

    pdf_bytes = generate_receipt_pdf(receipt)
    safe_number = "".join(character for character in receipt.receipt_number if character.isalnum() or character in "-_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="AuditWeave-Receipt-{safe_number}.pdf"'},
    )


@app.post("/api/payments/verify", response_model=PaymentVerificationResponse)
async def verify_payment(request: VerifyPaymentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Razorpay payment verification."""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the server.")
        
    payment_order = db.query(PaymentOrder).filter(
        PaymentOrder.razorpay_order_id == request.razorpay_order_id,
        PaymentOrder.user_id == current_user.id,
    ).first()
    if not payment_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payment_order.status == "verified":
        if payment_order.razorpay_payment_id != request.razorpay_payment_id:
            raise HTTPException(status_code=409, detail="Order already processed with a different payment.")
        current_balance = db.query(User.credits_balance).filter(User.id == current_user.id).scalar()
        receipt = db.query(PaymentReceipt).filter(
            PaymentReceipt.payment_order_id == payment_order.id,
            PaymentReceipt.user_id == current_user.id,
        ).one_or_none()
        return {
            "success": True,
            "new_balance": int(current_balance),
            "already_processed": True,
            "receipt_available": receipt is not None,
            "receipt_number": receipt.receipt_number if receipt else None,
            "receipt_email_status": receipt.email_status if receipt else None,
        }

    order_snapshot = {
        "razorpay_order_id": payment_order.razorpay_order_id,
        "amount_paid": payment_order.amount_paid,
        "currency": payment_order.currency or "INR",
    }
    db.rollback()

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    validate_razorpay_payment(order_snapshot, request.razorpay_payment_id)
    try:
        new_balance, already_processed = finalize_payment_purchase(
            db,
            current_user.id,
            request.razorpay_order_id,
            request.razorpay_payment_id,
        )
    except PaymentAlreadyUsedError:
        raise HTTPException(status_code=409, detail="Payment has already been used.")
    except PaymentOrderNotProcessableError:
        raise HTTPException(status_code=409, detail="Order is not eligible for processing.")

    receipt = (
        db.query(PaymentReceipt)
        .join(PaymentOrder, PaymentOrder.id == PaymentReceipt.payment_order_id)
        .filter(
            PaymentOrder.razorpay_order_id == request.razorpay_order_id,
            PaymentReceipt.user_id == current_user.id,
        )
        .one_or_none()
    )
    if receipt is not None and not already_processed:
        receipt_id = receipt.id
        deliver_receipt_email(db, receipt_id)
        db.expire_all()
        receipt = db.query(PaymentReceipt).filter(PaymentReceipt.id == receipt_id).one()

    return {
        "success": True,
        "new_balance": new_balance,
        "already_processed": already_processed,
        "receipt_available": receipt is not None,
        "receipt_number": receipt.receipt_number if receipt else None,
        "receipt_email_status": receipt.email_status if receipt else None,
    }


