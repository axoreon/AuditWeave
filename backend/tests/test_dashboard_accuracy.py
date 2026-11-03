from __future__ import annotations

import os
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import main
from app.auth import get_password_hash
from app.database import Base
from app.models import Audit, Benchmark, Company, Finding, Policy, User
from app.services.dashboard_metrics import canonicalize_pillar


engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = Session()
    try:
        yield session
    finally:
        session.close()


def create_user(db, email: str) -> User:
    user = User(
        email=email,
        password_hash=get_password_hash("DashboardTestPassword123!"),
        role="user",
        is_email_verified=True,
    )
    db.add(user)
    db.flush()
    return user


def create_audit(
    db,
    user: User,
    *,
    suffix: str,
    score: float,
    confidence: float | None = None,
) -> Audit:
    company = Company(
        name=f"Dashboard Company {suffix}",
        domain=f"dashboard-{suffix}.example",
        industry="SaaS",
    )
    db.add(company)
    db.flush()
    policy = Policy(company_id=company.id, policy_text="Privacy policy")
    db.add(policy)
    db.flush()
    audit = Audit(
        policy_id=policy.id,
        compliance_score=score,
        risk_score=100 - score,
        status="Moderate Risk",
        overall_summary="Dashboard test audit",
        ai_confidence_score=confidence,
        rules_passed_count=5,
        rules_failed_count=6,
        ai_observations_count=1,
        created_by=user.id,
    )
    db.add(audit)
    db.flush()
    return audit


def add_finding(db, audit: Audit, pillar: str, severity: str) -> None:
    db.add(
        Finding(
            audit_id=audit.id,
            pillar=pillar,
            issue=f"{severity} dashboard finding",
            severity=severity,
            reason="Stored test finding",
        )
    )


def metric_for(summary: dict, pillar: str) -> dict:
    return next(metric for metric in summary["pillar_metrics"] if metric["pillar"] == pillar)


def test_dashboard_with_no_audits_reports_no_invented_metrics(db):
    user = create_user(db, "dashboard-empty@example.com")
    db.commit()

    summary = main.get_dashboard_summary(db, user)

    assert summary["total_audits"] == 0
    assert summary["average_compliance_score"] == 0.0
    assert summary["average_ai_confidence"] is None
    assert summary["executive_risk"]["highest_risk_area"] == "None"
    assert summary["executive_risk"]["best_performing_area"] == "None"
    assert all(metric["finding_count"] == 0 for metric in summary["pillar_metrics"])
    assert all(metric["highest_severity"] is None for metric in summary["pillar_metrics"])


def test_one_audit_uses_actual_findings_and_canonical_pillar_name(db):
    user = create_user(db, "dashboard-one@example.com")
    audit = create_audit(db, user, suffix="one", score=72.0, confidence=0.91)
    add_finding(db, audit, "Fiduciary Obligations", "High")
    db.commit()

    summary = main.get_dashboard_summary(db, user)
    metric = metric_for(summary, "Data Fiduciary Obligations")

    assert summary["total_audits"] == 1
    assert summary["average_compliance_score"] == 72.0
    assert metric["finding_count"] == 1
    assert metric["highest_severity"] == "High"
    assert summary["executive_risk"]["highest_risk_area"] == "Data Fiduciary Obligations"
    assert summary["executive_risk"]["best_performing_area"] == "Data Fiduciary Obligations"
    assert canonicalize_pillar("Fiduciary Obligations") == "Data Fiduciary Obligations"


def test_multiple_audits_keep_confidence_unavailable_without_provenance(db):
    user = create_user(db, "dashboard-multiple@example.com")
    first = create_audit(db, user, suffix="multi-one", score=40.0, confidence=0.96)
    second = create_audit(db, user, suffix="multi-two", score=80.0, confidence=None)
    add_finding(db, first, "Consent", "Critical")
    add_finding(db, second, "Notice", "Low")
    db.commit()

    summary = main.get_dashboard_summary(db, user)

    assert summary["total_audits"] == 2
    assert summary["average_compliance_score"] == 60.0
    assert summary["average_ai_confidence"] is None
    assert "provenance" in summary["ai_confidence_note"].lower()
    assert summary["executive_risk"]["highest_risk_area"] == "Consent"
    assert summary["executive_risk"]["best_performing_area"] == "Notice"


def test_severity_selection_reports_ties_without_numeric_weights(db):
    user = create_user(db, "dashboard-ties@example.com")
    audit = create_audit(db, user, suffix="ties", score=55.0)
    add_finding(db, audit, "Consent", "High")
    add_finding(db, audit, "Notice", "High")
    add_finding(db, audit, "Grievance Redressal", "Informational")
    add_finding(db, audit, "Cross-Border Transfer", "Informational")
    db.commit()

    summary = main.get_dashboard_summary(db, user)

    assert summary["risk_distribution"]["High"] == 2
    assert summary["risk_distribution"]["Informational"] == 2
    assert summary["executive_risk"]["highest_risk_area"] == "Consent, Notice"
    assert summary["executive_risk"]["best_performing_area"] == (
        "Grievance Redressal, Cross Border Transfer"
    )


def test_dashboard_isolates_users_audits_and_findings(db):
    owner = create_user(db, "dashboard-owner@example.com")
    other = create_user(db, "dashboard-other@example.com")
    owner_audit = create_audit(db, owner, suffix="owner", score=90.0)
    other_audit = create_audit(db, other, suffix="other", score=10.0)
    add_finding(db, owner_audit, "Notice", "Low")
    add_finding(db, other_audit, "Children's Data", "Critical")
    db.commit()

    summary = main.get_dashboard_summary(db, owner)

    assert summary["total_audits"] == 1
    assert summary["average_compliance_score"] == 90.0
    assert summary["risk_distribution"]["Critical"] == 0
    assert metric_for(summary, "Children's Data")["finding_count"] == 0


def test_benchmark_response_marks_seeded_industries_as_demonstration(db):
    db.add_all(
        [
            Benchmark(
                industry="SaaS",
                average_compliance_score=70.0,
                average_risk_score=30.0,
                companies_count=18,
            ),
            Benchmark(
                industry="User-entered sector",
                average_compliance_score=60.0,
                average_risk_score=40.0,
                companies_count=1,
            ),
        ]
    )
    db.commit()

    benchmarks = main.get_benchmarks(db)
    by_industry = {benchmark["industry"]: benchmark for benchmark in benchmarks}

    assert by_industry["SaaS"]["contains_seeded_demonstration_data"] is True
    assert by_industry["User-entered sector"]["contains_seeded_demonstration_data"] is False
