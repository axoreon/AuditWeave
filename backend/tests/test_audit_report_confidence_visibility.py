import io
import re

from pypdf import PdfReader
from reportlab.platypus import KeepTogether, Paragraph

from app.services import pdf_generator
from app.services.pdf_generator import generate_audit_pdf


def _finding(issue, severity, pillar, evidence=None):
    return {
        "pillar": pillar,
        "issue": issue,
        "severity": severity,
        "confidence_score": 0.99,
        "dpdp_section": "DPDP Act 2023",
        "evidence_extract": evidence,
        "reason": f"Recorded assessment detail for {issue}.",
        "business_impact": f"Business impact for {issue}.",
        "legal_impact": f"Legal impact for {issue}.",
        "legal_rec": f"Legal action for {issue}.",
        "tech_rec": f"Technical action for {issue}.",
        "business_rec": f"Operational action for {issue}.",
    }


def _representative_audit(long_evidence=None):
    verified_rights = (
        "You may request access, correction, and erasure by contacting our privacy team."
    )
    consent_evidence = "You may withdraw consent at any time through your account settings."
    findings = [
        _finding("High unmatched retention claim", "High", "Data Retention", "Obsolete retention wording."),
        _finding("Informational consent maintenance", "Informational", "Consent", consent_evidence),
        _finding("Critical security omission", "Critical", "Security Safeguards"),
        _finding("Low grievance wording", "Low", "Grievance Officer", "Contact our grievance officer."),
        _finding("Critical notice omission", "Critical", "Notice", "Old notice wording."),
        _finding("Medium child-data gap", "Medium", "Children's Data"),
        _finding("High rights channel", "High", "Data Principal Rights", verified_rights),
    ]
    if long_evidence:
        findings.append(
            _finding("Long verified policy extract", "Medium", "Notice", long_evidence)
        )
    policy_text = " ".join(
        [
            verified_rights,
            consent_evidence,
            "Contact our grievance officer.",
            long_evidence or "",
        ]
    )
    return {
        "report_id": "AW-AUD-000321",
        "compliance_score": 59.4,
        "risk_score": 40.6,
        "status": "High Risk",
        "overall_summary": (
            "INCORRECT STORED SUMMARY: primary risks are Grievance Redressal and Consent."
        ),
        "rules_passed_count": 5,
        "rules_failed_count": 6,
        "ai_observations_count": 99,
        "ai_confidence_score": 0.99,
        "policy_text": policy_text,
        "findings": findings,
    }


def _page_break_audit():
    findings = []
    policy_parts = []
    for index in range(1, 6):
        marker = f"F{index:02d}"
        evidence = f"{marker}-EVIDENCE verified policy wording."
        finding = _finding(f"Page-flow finding {index:02d}", "High", "Notice", evidence)
        finding["reason"] = f"{marker}-WHAT " + ("Detailed finding context. " * 5)
        finding["legal_rec"] = f"{marker}-LEGAL preserve the recorded legal action."
        finding["tech_rec"] = f"{marker}-TECH preserve the recorded technical action."
        finding["business_rec"] = f"{marker}-OPS preserve the recorded operational action."
        findings.append(finding)
        policy_parts.append(evidence)

    for index in range(6, 11):
        marker = f"F{index:02d}"
        evidence = f"{marker}-EVIDENCE verified compliant policy wording."
        informational = _finding(
            f"Page-flow finding {index:02d}",
            "Informational",
            "Consent",
            evidence,
        )
        informational["reason"] = f"{marker}-WHAT concise compliant finding context."
        informational["legal_rec"] = f"{marker}-MAINT retain the compliant disclosure."
        findings.append(informational)
        policy_parts.append(evidence)

    audit = _representative_audit()
    audit["findings"] = findings
    audit["policy_text"] = " ".join(policy_parts)
    return audit


def _pdf_text(audit_data):
    pdf = generate_audit_pdf(
        audit_data,
        "Flipkart Internet Private Limited",
        "E-commerce",
        "October 17, 2026",
    )
    assert pdf.startswith(b"%PDF")
    pages = PdfReader(io.BytesIO(pdf)).pages
    return "\n".join(page.extract_text() or "" for page in pages), len(pages)


def _flat(text):
    return re.sub(r"\s+", " ", text)


def _page_containing(pages, token):
    matches = [index for index, text in enumerate(pages) if token in text]
    assert len(matches) == 1, f"Expected one page containing {token!r}, found {matches}"
    return matches[0]


def test_audit_pdf_uses_truthful_summary_metrics_and_evidence_states():
    text, _ = _pdf_text(_representative_audit())
    flat = _flat(text)

    assert "Flipkart Internet Private Limited" in flat
    assert "AW-AUD-000321" in flat
    assert "59.4/100" in flat
    assert "INCORRECT STORED SUMMARY" not in flat
    assert "highest-priority recorded findings are Critical" in flat
    assert "Data Fiduciary Obligations and Notice" in flat

    assert "Compliance Gap Index" in flat
    assert "Assessment Findings" in flat
    assert "Vulnerability Risk" not in flat
    assert "AI Observations" not in flat
    assert "AI Confidence" not in flat
    assert "Confidence:" not in flat
    assert "11 pillars" not in flat
    assert "11-check deterministic rule scan" in flat

    assert "Required disclosure not found in the reviewed policy." in flat
    assert "Stored evidence could not be matched to this policy version." in flat
    assert "Verified in policy" in flat
    assert "Obsolete retention wording." not in flat
    assert "Information\nal" not in text
    assert "COMPLIA\nNT" not in text


def test_audit_pdf_orders_findings_by_severity_stably():
    text, _ = _pdf_text(_representative_audit())
    flat = _flat(text)
    expected_order = [
        "Critical security omission",
        "Critical notice omission",
        "High unmatched retention claim",
        "High rights channel",
        "Medium child-data gap",
        "Low grievance wording",
        "Informational consent maintenance",
    ]
    positions = [flat.index(issue) for issue in expected_order]
    assert positions == sorted(positions)


def test_audit_pdf_handles_long_verified_evidence_across_pages():
    long_evidence = "BEGIN-LONG " + ("privacy disclosure details " * 420) + " END-LONG"
    audit = _representative_audit(long_evidence)
    pdf = generate_audit_pdf(
        audit,
        "Flipkart Internet Private Limited",
        "E-commerce",
        "October 17, 2026",
    )
    pages = [page.extract_text() or "" for page in PdfReader(io.BytesIO(pdf)).pages]
    text = "\n".join(pages)
    page_count = len(pages)
    flat = _flat(text)

    assert page_count >= 3
    assert "BEGIN-LONG" in flat
    assert "END-LONG" in flat
    assert "Long verified policy extract" in flat
    assert _page_containing(pages, "BEGIN-LONG") < _page_containing(pages, "END-LONG")


def test_audit_pdf_uses_logo_only_on_first_page():
    pdf = generate_audit_pdf(
        _representative_audit(),
        "Flipkart Internet Private Limited",
        "E-commerce",
        "October 17, 2026",
    )
    pages = PdfReader(io.BytesIO(pdf)).pages

    assert len(pages[0].images) == 1
    assert all(len(page.images) == 0 for page in pages[1:])


def test_audit_pdf_falls_back_to_text_branding_when_logo_is_unavailable(monkeypatch):
    monkeypatch.setattr(pdf_generator, "_audit_brand_logo", lambda: None)

    text, _ = _pdf_text(_representative_audit())

    assert "AUDITWEAVE" in text
    assert "POWERED BY AXOREON" in text
    assert "DPDP Compliance Intelligence Platform" in text


def test_audit_pdf_keeps_finding_sections_together_at_page_boundaries():
    pdf = generate_audit_pdf(
        _page_break_audit(),
        "Flipkart Internet Private Limited",
        "E-commerce",
        "October 17, 2026",
    )
    pages = [page.extract_text() or "" for page in PdfReader(io.BytesIO(pdf)).pages]

    for index in range(1, 6):
        marker = f"F{index:02d}"
        recommendation_pages = {
            _page_containing(pages, f"{marker}-LEGAL"),
            _page_containing(pages, f"{marker}-TECH"),
            _page_containing(pages, f"{marker}-OPS"),
        }
        assert len(recommendation_pages) == 1

    assert _page_containing(pages, "Finding 04") == _page_containing(pages, "F04-WHAT")
    compact_pages = {
        _page_containing(pages, "Finding 10"),
        _page_containing(pages, "F10-WHAT"),
        _page_containing(pages, "F10-EVIDENCE"),
        _page_containing(pages, "F10-MAINT"),
    }
    assert len(compact_pages) == 1
    assert (
        _page_containing(pages, "Finding 07")
        == _page_containing(pages, "Finding 08")
        == _page_containing(pages, "Finding 09")
    )
    assert _page_containing(pages, "Finding 10") == _page_containing(
        pages, "4. Methodology"
    )


def test_finding_story_uses_small_logical_groups_not_one_finding_wrapper():
    audit = _page_break_audit()
    finding = audit["findings"][0]
    styles, palette = pdf_generator._audit_styles()
    story = []

    pdf_generator._append_findings_section(
        story,
        [finding],
        audit["policy_text"],
        styles,
        palette,
    )

    grouped_text = []
    for flowable in story:
        if not isinstance(flowable, KeepTogether):
            continue
        text = " ".join(
            child.getPlainText()
            for child in flowable._content
            if isinstance(child, Paragraph)
        )
        grouped_text.append(text)

    assert any("Finding 01" in text and "Evidence status:" in text for text in grouped_text)
    assert any("Policy evidence" in text and "F01-EVIDENCE" in text for text in grouped_text)
    assert all(
        not ("Finding 01" in text and "Policy evidence" in text)
        for text in grouped_text
    )

    paragraph_text = [
        flowable.getPlainText()
        for flowable in story
        if isinstance(flowable, Paragraph)
    ]
    assert any("Legal: F01-LEGAL" in text for text in paragraph_text)
    assert any("Technical: F01-TECH" in text for text in paragraph_text)
    assert any("Operational / Business: F01-OPS" in text for text in paragraph_text)


def test_compact_finding_can_share_page_with_neighboring_methodology():
    pdf = generate_audit_pdf(
        _representative_audit(),
        "Flipkart Internet Private Limited",
        "E-commerce",
        "October 17, 2026",
    )
    pages = [page.extract_text() or "" for page in PdfReader(io.BytesIO(pdf)).pages]

    assert _page_containing(
        pages, "Informational consent maintenance"
    ) == _page_containing(pages, "4. Methodology")
