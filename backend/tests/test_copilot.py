from __future__ import annotations

import os
import sys
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import main
from app.auth import get_password_hash
from app.database import Base
from app.models import Audit, Company, Finding, Policy, User
from app.schemas import CopilotHistoryMessage, CopilotRequest

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def audit_context():
    db = Session()
    user = User(
        email="copilot@example.com",
        first_name="Copilot",
        password_hash=get_password_hash("StrongPassword123!"),
        role="user",
        is_email_verified=True,
    )
    company = Company(name="Copilot Co", domain="copilot.example", industry="SaaS")
    db.add_all([user, company])
    db.flush()
    policy = Policy(company_id=company.id, policy_text="Privacy policy")
    db.add(policy)
    db.flush()
    audit = Audit(
        policy_id=policy.id,
        compliance_score=18.2,
        risk_score=81.8,
        status="Critical Risk",
        overall_summary="Test audit",
        ai_confidence_score=0.96,
        rules_passed_count=0,
        rules_failed_count=11,
        ai_observations_count=1,
        created_by=user.id,
    )
    db.add(audit)
    db.flush()
    db.add(Finding(
        audit_id=audit.id,
        pillar="Grievance Redressal",
        issue="Missing grievance officer",
        severity="High",
        reason="No contact details were found.",
    ))
    db.commit()
    db.refresh(audit)
    try:
        yield db, user, audit
    finally:
        db.close()


class CapturingModel:
    prompts: list[str] = []
    answer = "Dynamic answer"

    def __init__(self, *_args, **_kwargs):
        pass

    def generate_content(self, prompt):
        self.prompts.append(prompt)
        return type("Response", (), {"text": self.answer})()


def call_copilot(db, user, audit, message, history=None):
    request = CopilotRequest(
        audit_id=audit.id,
        message=message,
        history=history or [],
    )
    with (
        patch.object(main, "HAS_GEMINI_KEY", True),
        patch.object(main.genai, "GenerativeModel", CapturingModel),
    ):
        return main.audit_copilot(request, db, user)


def test_first_question_works_without_history(audit_context):
    db, user, audit = audit_context
    CapturingModel.prompts.clear()
    response = call_copilot(db, user, audit, "What is the score?")
    assert response["response"] == "Dynamic answer"
    assert "Conversation History:\n(none)" in CapturingModel.prompts[-1]


def test_second_question_receives_previous_conversation(audit_context):
    db, user, audit = audit_context
    CapturingModel.prompts.clear()
    history = [
        CopilotHistoryMessage(role="user", content="What should I do first?"),
        CopilotHistoryMessage(role="assistant", content="Add a grievance section."),
    ]
    CapturingModel.answer = "Your previous question was: What should I do first?"
    response = call_copilot(
        db,
        user,
        audit,
        "What was my previous question?",
        history,
    )
    CapturingModel.answer = "Dynamic answer"
    prompt = CapturingModel.prompts[-1]
    assert "User: What should I do first?" in prompt
    assert "Assistant: Add a grievance section." in prompt
    assert "What should I do first?" in response["response"]


def test_latest_question_appears_exactly_once(audit_context):
    db, user, audit = audit_context
    CapturingModel.prompts.clear()
    marker = "LATEST_UNIQUE_QUESTION"
    call_copilot(
        db,
        user,
        audit,
        marker,
        [CopilotHistoryMessage(role="user", content="Earlier question")],
    )
    assert CapturingModel.prompts[-1].count(marker) == 1


def test_prompt_preserves_score_rule_counts_and_findings(audit_context):
    db, user, audit = audit_context
    CapturingModel.prompts.clear()
    call_copilot(db, user, audit, "Explain this audit.")
    prompt = CapturingModel.prompts[-1]
    assert "Compliance Score: 18.2/100" in prompt
    assert "Rules Passed: 0" in prompt
    assert "Rule Violations: 11" in prompt
    assert "Missing grievance officer" in prompt


def test_history_count_and_message_length_are_bounded():
    with pytest.raises(ValidationError):
        CopilotRequest(
            audit_id=1,
            message="Question",
            history=[
                {"role": "user", "content": f"Question {index}"}
                for index in range(11)
            ],
        )
    with pytest.raises(ValidationError):
        CopilotRequest(
            audit_id=1,
            message="Question",
            history=[{"role": "user", "content": "x" * 2001}],
        )


def test_gemini_failure_returns_safe_service_error(audit_context):
    db, user, audit = audit_context

    class FailedModel:
        def __init__(self, *_args, **_kwargs):
            pass

        def generate_content(self, _prompt):
            raise RuntimeError("provider detail must not reach the client")

    request = CopilotRequest(audit_id=audit.id, message="What is the score?")
    with (
        patch.object(main, "HAS_GEMINI_KEY", True),
        patch.object(main.genai, "GenerativeModel", FailedModel),
        pytest.raises(HTTPException) as exc_info,
    ):
        main.audit_copilot(request, db, user)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "AI Copilot is temporarily unavailable. Please try again later."
    assert "provider detail" not in exc_info.value.detail
