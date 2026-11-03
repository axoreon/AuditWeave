import datetime
import io
import re
from pathlib import Path
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, CondPageBreak, Image as PlatypusImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from xml.sax.saxutils import escape

def get_grc_styles():
    """Initializes and returns common stylesheet typography styles."""
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=25
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    evidence_style = ParagraphStyle(
        'EvidenceText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#D97706'),
        spaceAfter=6,
        leftIndent=15
    )
    
    meta_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B')
    )
    
    return {
        'title': title_style,
        'subtitle': subtitle_style,
        'h1': h1_style,
        'h2': h2_style,
        'body': body_style,
        'evidence': evidence_style,
        'meta': meta_style
    }

def sanitize_data(data):
    if isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(v) for v in data]
    elif isinstance(data, str):
        return data.replace("₹", "INR ")
    return data

SEVERITY_ORDER = {
    "Critical": 0,
    "High": 1,
    "Medium": 2,
    "Low": 3,
    "Informational": 4,
}

REPORTING_PILLARS = (
    "Consent",
    "Notice",
    "Data Principal Rights",
    "Children's Data",
    "Data Fiduciary Obligations",
    "Grievance Redressal",
    "Cross Border Transfer",
)


def _pdf_text(value) -> str:
    """Escape dynamic values before ReportLab parses paragraph markup."""
    return escape(str(value if value is not None else "")).replace("\n", "<br/>")


def _format_number(value) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return _pdf_text(value)
    return f"{number:.1f}".rstrip("0").rstrip(".")


def _canonical_reporting_pillar(value: str) -> str:
    pillar = (value or "").strip().lower()
    if "cross" in pillar and ("border" in pillar or "transfer" in pillar):
        return "Cross Border Transfer"
    if "grievance" in pillar:
        return "Grievance Redressal"
    if "child" in pillar:
        return "Children's Data"
    if any(term in pillar for term in ("principal", "access", "correction", "erasure")):
        return "Data Principal Rights"
    if "notice" in pillar:
        return "Notice"
    if "consent" in pillar:
        return "Consent"
    return "Data Fiduciary Obligations"


def _executive_summary(audit_data: dict, company_name: str) -> str:
    findings = audit_data.get("findings") or []
    material = [
        finding for finding in findings
        if finding.get("severity") in ("Critical", "High", "Medium")
    ]
    opening = (
        f"AuditWeave assessed <b>{_pdf_text(company_name)}</b> against the reviewed privacy policy. "
        f"The recorded compliance score is <b>{_format_number(audit_data.get('compliance_score'))}/100</b>, "
        f"corresponding to a <b>{_pdf_text(audit_data.get('status') or 'Not classified')}</b> posture."
    )
    if not material:
        return (
            opening
            + " No Critical, High, or Medium findings were recorded. Any remaining items "
              "are Low or Informational and should be handled through routine policy maintenance."
        )

    highest_rank = min(SEVERITY_ORDER[finding["severity"]] for finding in material)
    highest_severity = next(
        severity for severity, rank in SEVERITY_ORDER.items() if rank == highest_rank
    )
    pillars = []
    for finding in material:
        if finding.get("severity") != highest_severity:
            continue
        pillar = _canonical_reporting_pillar(finding.get("pillar", ""))
        if pillar not in pillars:
            pillars.append(pillar)
    pillar_list = pillars[0] if len(pillars) == 1 else ", ".join(pillars[:-1]) + f" and {pillars[-1]}"
    return (
        opening
        + f" The highest-priority recorded findings are <b>{highest_severity}</b> and relate to "
          f"<b>{_pdf_text(pillar_list)}</b>. The detailed findings below provide the supporting "
          "evidence status, impact, and stored remediation actions."
    )


def _evidence_state(finding: dict, policy_text: str) -> tuple[str, str]:
    evidence = str(finding.get("evidence_extract") or "").strip()
    if not evidence:
        return "Missing", "Required disclosure not found in the reviewed policy."
    compact_evidence = " ".join(evidence.split()).casefold()
    compact_policy = " ".join(str(policy_text or "").split()).casefold()
    if compact_policy and compact_evidence in compact_policy:
        return "Verified in policy", evidence
    return "Unmatched", "Stored evidence could not be matched to this policy version."


def _audit_page_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D7E0DC"))
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 31, letter[0] - doc.rightMargin, 31)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#61736D"))
    canvas.drawString(doc.leftMargin, 19, "AuditWeave | DPDP Compliance Report")
    canvas.drawRightString(letter[0] - doc.rightMargin, 19, f"Confidential | Page {doc.page}")
    canvas.restoreState()


def _audit_brand_logo():
    """Load the repository logo safely, or return None for text-only branding."""
    try:
        repository_root = Path(__file__).resolve().parents[3]
        logo_path = repository_root / "frontend" / "public" / "auditweave-logo.jpeg"
        logo_bytes = logo_path.read_bytes()
        width, height = ImageReader(io.BytesIO(logo_bytes)).getSize()
        visual_width = 34
        return PlatypusImage(
            io.BytesIO(logo_bytes),
            width=visual_width,
            height=visual_width * height / width,
        )
    except (OSError, ValueError, IndexError):
        return None


def _generate_audit_pdf_legacy_layout(audit_data: dict, company_name: str, industry: str, audit_date: str) -> bytes:
    """Generates a styled, publication-ready PDF report of the compliance audit."""
    audit_data = sanitize_data(audit_data)
    company_name = sanitize_data(company_name)
    industry = sanitize_data(industry)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    c_styles = get_grc_styles()
    story = []
    
    # --- PAGE 1: COVER PAGE / EXECUTIVE HEADER ---
    story.append(Paragraph("AuditWeave AI", ParagraphStyle('Brand', parent=c_styles['title'], fontSize=14, textColor=colors.HexColor('#0F172A'), spaceAfter=5)))
    story.append(Paragraph("DPDP Compliance Intelligence Platform", ParagraphStyle('BrandTag', parent=c_styles['subtitle'], fontSize=9, textColor=colors.HexColor('#0284C7'), spaceAfter=30)))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Digital Personal Data Protection (DPDP) Act 2023 Compliance Report", c_styles['title']))
    story.append(Paragraph(f"Audited Entity: <b>{company_name}</b> ({industry})", c_styles['subtitle']))
    
    report_id = f"PL-AUD-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    meta_data = [
        [Paragraph("Report ID:", c_styles['meta']), Paragraph(report_id, c_styles['body'])],
        [Paragraph("Audit Date:", c_styles['meta']), Paragraph(audit_date, c_styles['body'])],
        [Paragraph("Statutory Framework:", c_styles['meta']), Paragraph("India DPDP Act 2023", c_styles['body'])],
        [Paragraph("Compliance Score:", c_styles['meta']), Paragraph(f"<b>{audit_data['compliance_score']}/100</b>", c_styles['body'])],
        [Paragraph("Overall Risk level:", c_styles['meta']), Paragraph(f"<b>{audit_data['status']}</b>", c_styles['body'])]
    ]
    
    t_meta = Table(meta_data, colWidths=[2.0 * inch, 4.0 * inch])
    t_meta.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t_meta)
    story.append(Paragraph(
        "Methodology: compliance score is the mean of 11 individually-scored DPDP pillar assessments (0\u2013100 each).",
        ParagraphStyle('MethodNote', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'), spaceAfter=15)
    ))
    
    story.append(Spacer(1, 25))
    story.append(Paragraph("1. Executive Summary", c_styles['h1']))
    story.append(Paragraph(audit_data["overall_summary"], c_styles['body']))
    
    score = audit_data["compliance_score"]
    risk = audit_data["risk_score"]
    passed = audit_data["rules_passed_count"]
    failed = audit_data["rules_failed_count"]
    obs = audit_data["ai_observations_count"]
    
    story.append(Spacer(1, 15))
    
    metric_data = [
        ["Compliance Score", "Vulnerability Risk", "Rule Checks Passed", "Rule Violations", "AI Observations"],
        [f"{score}%", f"{risk}%", f"{passed}", f"{failed}", f"{obs}"]
    ]
    t_metrics = Table(metric_data, colWidths=[1.25 * inch, 1.25 * inch, 1.25 * inch, 1.25 * inch, 1.25 * inch])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,-1), 13),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_metrics)
    
    story.append(PageBreak())
    
    # --- PAGE 2: COMPLIANCE PILLAR ANALYSIS ---
    story.append(Paragraph("2. DPDP Pillar Heatmap Analysis", c_styles['h1']))
    story.append(Paragraph("The platform audited the policy against the seven structural pillars of the DPDP Act 2023, scoring each and identifying critical gaps.", c_styles['body']))
    
    pillar_scores = {
        "Consent": "Compliant",
        "Notice": "Compliant",
        "Data Principal Rights": "Compliant",
        "Children's Data": "Compliant",
        "Data Fiduciary Obligations": "Compliant",
        "Grievance Redressal": "Compliant",
        "Cross Border Transfer": "Compliant"
    }
    
    for finding in audit_data["findings"]:
        p = finding["pillar"]
        sev = finding["severity"]
        if p in pillar_scores:
            if sev in ["Critical", "High"]:
                pillar_scores[p] = "Fail"
            elif sev == "Medium" and pillar_scores[p] != "Fail":
                pillar_scores[p] = "Partial"
            elif sev == "Low" and pillar_scores[p] not in ["Fail", "Partial"]:
                pillar_scores[p] = "Partial"

    heatmap_rows = [["DPDP Pillar", "Audited Score", "Compliance Level", "Primary Requirement"]]
    pillar_reqs = {
        "Consent": "Explicit, granular, and withdrawable consent.",
        "Notice": "Purpose and rights disclosure presented in notice.",
        "Data Principal Rights": "Enable right to access, correction, and erasure.",
        "Children's Data": "Age verification and verifiable parental consent.",
        "Data Fiduciary Obligations": "Accuracy control, retention limits, security guards.",
        "Grievance Redressal": "Publish Grievance Officer contacts & SLA response.",
        "Cross Border Transfer": "Transfers compliant with federal blacklist/rules."
    }
    
    for pil, status_lvl in pillar_scores.items():
        if status_lvl == "Compliant":
            indicator = "PASS (100)"
        elif status_lvl == "Partial":
            indicator = "PARTIAL (50)"
        else:
            indicator = "FAIL (20)"
        heatmap_rows.append([pil, indicator, status_lvl.upper(), Paragraph(pillar_reqs.get(pil, ""), c_styles['body'])])
        
    t_heatmap = Table(heatmap_rows, colWidths=[1.8 * inch, 1.3 * inch, 1.2 * inch, 2.7 * inch])
    t_heatmap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_heatmap)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("3. Detailed Risk Findings & Evidence", c_styles['h1']))
    story.append(Paragraph("Traceable compliance violations, complete with the legal section breaches, extracted textual evidence, and recommendations.", c_styles['body']))
    
    severity_order = {"Critical": 1, "High": 2, "Medium": 3, "Low": 4, "Informational": 5}
    sorted_findings = sorted(audit_data["findings"], key=lambda x: severity_order.get(x.get("severity", "Informational"), 99))
    
    for i, f in enumerate(sorted_findings):
        f_story = []
        sev_color = '#EF4444' if f["severity"] in ["Critical", "High"] else ('#F59E0B' if f["severity"] == "Medium" else '#3B82F6')
        
        f_story.append(Spacer(1, 8))
        f_story.append(Paragraph(f"Finding {i+1}: {f['issue']}", c_styles['h2']))
        
        meta_line = f"<b>Pillar:</b> {f['pillar']} | <b>Section:</b> {f['dpdp_section']} | <b>Severity:</b> <font color='{sev_color}'><b>{f['severity']}</b></font> | <b>Confidence:</b> {int(f['confidence_score'] * 100)}%"
        f_story.append(Paragraph(meta_line, ParagraphStyle('FindMeta', parent=c_styles['body'], fontSize=9, textColor=colors.HexColor('#475569'))))
        f_story.append(Paragraph(f"<b>Gap Analysis:</b> {f['reason']}", c_styles['body']))
        
        if f.get("evidence_extract"):
            f_story.append(Paragraph("<b>Policy Evidence:</b>", ParagraphStyle('EvLabel', parent=c_styles['body'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#475569'))))
            f_story.append(Paragraph(f'"{f["evidence_extract"]}"', c_styles['evidence']))
        else:
            f_story.append(Paragraph("<b>Policy Evidence:</b> <i>No clause or reference found in document.</i>", c_styles['body']))
            
        if f.get("legal_impact"):
            f_story.append(Paragraph(f"<b>Legal Liability:</b> {f['legal_impact']}", c_styles['body']))
        if f.get("business_impact"):
            f_story.append(Paragraph(f"<b>Business Impact:</b> {f['business_impact']}", c_styles['body']))
            
        rec_data = [
            [Paragraph("<b>Legal Recommendation</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold')),
             Paragraph("<b>Technical Action</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold')),
             Paragraph("<b>Business Action</b>", ParagraphStyle('RHead', parent=c_styles['body'], fontSize=8, fontName='Helvetica-Bold'))],
            [Paragraph(f.get("legal_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10)),
             Paragraph(f.get("tech_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10)),
             Paragraph(f.get("business_rec", "N/A"), ParagraphStyle('RText', parent=c_styles['body'], fontSize=8, leading=10))]
        ]
        t_rec = Table(rec_data, colWidths=[2.3 * inch, 2.3 * inch, 2.3 * inch])
        t_rec.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        f_story.append(t_rec)
        f_story.append(Spacer(1, 10))
        
        story.append(KeepTogether(f_story))
        
    story.append(Spacer(1, 15))
    story.append(Paragraph("4. Appendix & Regulatory Penalties", c_styles['h1']))
    story.append(Paragraph(
        "This audit report is generated automatically using hybrid deterministic parsing and advanced language understanding "
        "trained on the statutory clauses of India's Digital Personal Data Protection (DPDP) Act 2023. Compliance scores represent "
        "conformity with standard disclosure expectations but do not constitute formal legal counsel. For high-priority risks, "
        "we recommend consulting qualified cyber-lawyers in India prior to publishing revised privacy notices.",
        ParagraphStyle('Disclaimer', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))
    ))
    
    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def _audit_styles():
    base = get_grc_styles()
    palette = {
        "green": colors.HexColor("#0B3D33"),
        "accent": colors.HexColor("#276152"),
        "cream": colors.HexColor("#F7F3EA"),
        "ink": colors.HexColor("#17332C"),
        "muted": colors.HexColor("#61736D"),
        "line": colors.HexColor("#D7E0DC"),
        "pale_green": colors.HexColor("#EDF5F1"),
    }
    styles = {
        "title": ParagraphStyle(
            "AuditTitle", parent=base["title"], fontSize=23, leading=28,
            textColor=palette["green"], spaceAfter=12,
        ),
        "subtitle": ParagraphStyle(
            "AuditSubtitle", parent=base["subtitle"], fontSize=10.5, leading=15,
            textColor=palette["muted"], spaceAfter=18,
        ),
        "h1": ParagraphStyle(
            "AuditH1", parent=base["h1"], fontSize=15, leading=19,
            textColor=palette["green"], spaceBefore=12, spaceAfter=9,
        ),
        "h2": ParagraphStyle(
            "AuditH2", parent=base["h2"], fontSize=11.5, leading=15,
            textColor=palette["ink"], spaceBefore=7, spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "AuditBody", parent=base["body"], fontSize=9.3, leading=13.2,
            textColor=palette["ink"], spaceAfter=7,
        ),
    }
    styles["small"] = ParagraphStyle(
        "AuditSmall", parent=styles["body"], fontSize=7.8, leading=10.5,
        textColor=palette["muted"], spaceAfter=5, splitLongWords=False,
    )
    styles["label"] = ParagraphStyle(
        "AuditLabel", parent=styles["small"], fontName="Helvetica-Bold",
        textColor=palette["accent"], spaceAfter=2,
    )
    styles["evidence"] = ParagraphStyle(
        "AuditEvidence", parent=styles["body"], fontName="Helvetica-Oblique",
        fontSize=8.5, leading=12, leftIndent=10, rightIndent=10,
        borderColor=palette["line"], borderWidth=0.6, borderPadding=8,
        backColor=colors.HexColor("#FBFCFB"), wordWrap="CJK", spaceAfter=8,
    )
    styles["recommendation"] = ParagraphStyle(
        "AuditRecommendation", parent=styles["body"], fontSize=8.6, leading=12,
        leftIndent=9, borderColor=colors.HexColor("#C6D8D1"),
        borderWidth=0, borderLeftWidth=2, borderPadding=5, spaceAfter=6,
    )
    return styles, palette


def _append_cover_and_summary(story, audit_data, company_name, industry, audit_date, findings, styles, palette):
    story.append(Spacer(1, 8))
    brand_text = [
        Paragraph("AUDITWEAVE", ParagraphStyle(
        "AuditBrand", parent=styles["title"], fontSize=15, leading=18,
            textColor=palette["green"], spaceAfter=0,
        )),
        Paragraph("POWERED BY AXOREON", ParagraphStyle(
            "AuditBrandTag", parent=styles["small"], fontName="Helvetica-Bold",
            fontSize=6.5, leading=8, textColor=palette["accent"], charSpace=1.2, spaceAfter=1,
        )),
        Paragraph(
            "DPDP Compliance Intelligence Platform",
            ParagraphStyle(
                "AuditPlatformTag", parent=styles["small"], fontSize=8.5,
                leading=11, textColor=palette["muted"], spaceAfter=0,
            ),
        ),
    ]
    logo = _audit_brand_logo()
    brand_row = [logo, brand_text] if logo else [brand_text]
    brand_widths = [0.52 * inch, 5.98 * inch] if logo else [6.5 * inch]
    brand_table = Table([brand_row], colWidths=brand_widths, hAlign="LEFT")
    brand_table.spaceAfter = 27
    brand_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 4 if logo else 0),
        ("RIGHTPADDING", (1, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(brand_table)
    story.append(Paragraph(
        "Digital Personal Data Protection Act 2023<br/>Compliance Assessment Report",
        styles["title"],
    ))
    story.append(Paragraph(
        f"Audited entity&nbsp;&nbsp;<b>{_pdf_text(company_name)}</b><br/>"
        f"Industry&nbsp;&nbsp;{_pdf_text(industry)}",
        styles["subtitle"],
    ))

    report_id = audit_data.get("report_id") or f"AW-AUD-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    meta_data = [
        [Paragraph("REPORT ID", styles["label"]), Paragraph(_pdf_text(report_id), styles["body"])],
        [Paragraph("AUDIT DATE", styles["label"]), Paragraph(_pdf_text(audit_date), styles["body"])],
        [Paragraph("STATUTORY FRAMEWORK", styles["label"]), Paragraph("India DPDP Act 2023", styles["body"])],
        [Paragraph("COMPLIANCE SCORE", styles["label"]), Paragraph(
            f"<b>{_format_number(audit_data.get('compliance_score'))}/100</b>", styles["body"]
        )],
        [Paragraph("OVERALL RISK", styles["label"]), Paragraph(
            f"<b>{_pdf_text(audit_data.get('status'))}</b>", styles["body"]
        )],
    ]
    meta_table = Table(meta_data, colWidths=[1.75 * inch, 4.75 * inch], hAlign="LEFT")
    meta_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), palette["cream"]),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, palette["line"]),
        ("BOX", (0, 0), (-1, -1), 0.6, palette["line"]),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Scoring method: the compliance score combines the 11-check deterministic rule scan "
        "(40%) with the language-model-assisted policy assessment (60%). The seven rows in the "
        "report group findings into structural reporting pillars.",
        styles["small"],
    ))
    story.append(Spacer(1, 20))
    story.append(Paragraph("1. Executive Summary", styles["h1"]))
    story.append(Paragraph(_executive_summary(audit_data, company_name), styles["body"]))

    metric_headers = [
        "Compliance Score",
        "Compliance Gap Index",
        "Checks Passed",
        "Checks Flagged",
        "Assessment Findings",
    ]
    metric_data = [
        [Paragraph(header, ParagraphStyle(
            f"MetricHeader{index}", parent=styles["small"], fontName="Helvetica-Bold",
            textColor=colors.white, alignment=1, leading=9,
        )) for index, header in enumerate(metric_headers)],
        [
            f"{_format_number(audit_data.get('compliance_score'))}%",
            f"{_format_number(audit_data.get('risk_score'))}%",
            _format_number(audit_data.get("rules_passed_count")),
            _format_number(audit_data.get("rules_failed_count")),
            str(len(findings)),
        ],
    ]
    metric_table = Table(metric_data, colWidths=[1.3 * inch] * 5, hAlign="LEFT")
    metric_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), palette["green"]),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), palette["pale_green"]),
        ("TEXTCOLOR", (0, 1), (-1, 1), palette["ink"]),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 12),
        ("GRID", (0, 0), (-1, -1), 0.5, palette["line"]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(Spacer(1, 8))
    story.append(metric_table)
    story.append(Paragraph(
        "The Compliance Gap Index is 100 minus the compliance score; it is not a probability "
        "of breach or a separate risk model.",
        styles["small"],
    ))


def _append_pillar_section(story, sorted_findings, styles, palette):
    story.append(PageBreak())
    story.append(Paragraph("2. Seven-Pillar Reporting View", styles["h1"]))
    story.append(Paragraph(
        "This view groups the recorded findings into seven structural DPDP themes. "
        "Each row is driven by the highest recorded finding severity in that theme.",
        styles["body"],
    ))
    pillar_data = {
        pillar: {"status": "Compliant", "findings": [], "highest": "None"}
        for pillar in REPORTING_PILLARS
    }
    for finding in sorted_findings:
        pillar = _canonical_reporting_pillar(finding.get("pillar", ""))
        severity = finding.get("severity", "Informational")
        pillar_data[pillar]["findings"].append(finding)
        current = pillar_data[pillar]["highest"]
        if current == "None" or SEVERITY_ORDER.get(severity, 99) < SEVERITY_ORDER.get(current, 99):
            pillar_data[pillar]["highest"] = severity
        if severity in ("Critical", "High"):
            pillar_data[pillar]["status"] = "Fail"
        elif severity in ("Medium", "Low") and pillar_data[pillar]["status"] != "Fail":
            pillar_data[pillar]["status"] = "Partial"

    requirements = {
        "Consent": "Explicit, granular, informed, and withdrawable consent.",
        "Notice": "Clear purpose, processing, and rights disclosures.",
        "Data Principal Rights": "Access, correction, erasure, and nomination mechanisms.",
        "Children's Data": "Age assurance and verifiable parental consent.",
        "Data Fiduciary Obligations": "Accuracy, retention, safeguards, and breach duties.",
        "Grievance Redressal": "Published grievance contact and response process.",
        "Cross Border Transfer": "Transfers subject to applicable government restrictions.",
    }
    header_style = ParagraphStyle(
        "PillarHeader", parent=styles["small"], fontName="Helvetica-Bold",
        textColor=colors.white, leading=9,
    )
    rows = [[
        Paragraph("Reporting Pillar", header_style),
        Paragraph("Indicator", header_style),
        Paragraph("Level", header_style),
        Paragraph("Count", header_style),
        Paragraph("Highest", header_style),
        Paragraph("Primary Requirement", header_style),
    ]]
    for pillar in REPORTING_PILLARS:
        status = pillar_data[pillar]["status"]
        indicator = {"Compliant": "PASS (100)", "Partial": "PARTIAL (50)", "Fail": "FAIL (20)"}[status]
        rows.append([
            Paragraph(_pdf_text(pillar), styles["small"]),
            Paragraph(indicator, styles["small"]),
            Paragraph(status.upper(), styles["small"]),
            Paragraph(str(len(pillar_data[pillar]["findings"])), styles["small"]),
            Paragraph(pillar_data[pillar]["highest"], styles["small"]),
            Paragraph(requirements[pillar], styles["small"]),
        ])
    heatmap = Table(
        rows,
        colWidths=[1.27 * inch, 0.78 * inch, 0.92 * inch, 0.50 * inch, 1.05 * inch, 1.98 * inch],
        repeatRows=1,
        hAlign="LEFT",
    )
    heatmap.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), palette["green"]),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, palette["line"]),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, palette["cream"]]),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(heatmap)
    story.append(Paragraph(
        "Report indicators (100/50/20) preserve the existing display convention and summarize "
        "the highest recorded severity in each reporting pillar. They do not recalculate or "
        "alter the overall compliance score.",
        styles["small"],
    ))


def _append_labeled_block(
    story,
    label,
    content,
    styles,
    minimum_space,
    keep_complete=False,
):
    """Keep a label with content start while allowing long content to flow."""
    block = [Paragraph(f"<b>{label}</b>", styles["label"]), content]
    if keep_complete:
        story.append(KeepTogether(block))
        return
    story.append(CondPageBreak(minimum_space))
    story.extend(block)


def _append_findings_section(story, sorted_findings, policy_text, styles, palette):
    story.append(Spacer(1, 10))
    story.append(Paragraph("3. Findings, Evidence & Actions", styles["h1"]))
    story.append(Paragraph(
        "Findings are ordered by severity: Critical, High, Medium, Low, then Informational. "
        "Items at the same severity retain their recorded order.",
        styles["body"],
    ))
    if not sorted_findings:
        story.append(Paragraph("No findings were recorded for this assessment.", styles["body"]))
        return

    severity_colors = {
        "Critical": ("#8F1D1D", "#FCEAEA"),
        "High": ("#A43B20", "#FDEFEA"),
        "Medium": ("#8A5A00", "#FFF5D9"),
        "Low": ("#225D75", "#EAF4F8"),
        "Informational": ("#276152", "#EDF5F1"),
    }
    for index, finding in enumerate(sorted_findings, start=1):
        severity = finding.get("severity", "Informational")
        foreground, background = severity_colors.get(severity, severity_colors["Informational"])
        evidence_status, evidence_text = _evidence_state(finding, policy_text)
        evidence_color = {
            "Verified in policy": "#276152",
            "Missing": "#A43B20",
            "Unmatched": "#8A5A00",
        }[evidence_status]

        minimum_finding_space = 1.90 * inch if severity == "Informational" else 0.95 * inch
        story.append(CondPageBreak(minimum_finding_space))
        what_we_found = Paragraph(
            _pdf_text(finding.get("reason") or finding.get("issue") or "No additional detail recorded."),
            styles["body"],
        )
        header_group = [
            Spacer(1, 7),
            Paragraph(
                f"Finding {index:02d} &nbsp; {_pdf_text(finding.get('issue') or 'Untitled finding')}",
                styles["h2"],
            ),
            Table(
                [[
                    Paragraph(
                        f"<b>{_pdf_text(severity)}</b>",
                        ParagraphStyle(
                            f"Severity{index}", parent=styles["small"],
                            textColor=colors.HexColor(foreground), alignment=1,
                        ),
                    ),
                    Paragraph(
                        f"<b>Pillar</b><br/>{_pdf_text(finding.get('pillar') or 'Not specified')}",
                        styles["small"],
                    ),
                    Paragraph(
                        f"<b>DPDP Reference</b><br/>{_pdf_text(finding.get('dpdp_section') or 'Not specified')}",
                        styles["small"],
                    ),
                ]],
                colWidths=[1.15 * inch, 2.15 * inch, 3.2 * inch],
                style=TableStyle([
                    ("BACKGROUND", (0, 0), (0, 0), colors.HexColor(background)),
                    ("BOX", (0, 0), (-1, -1), 0.5, palette["line"]),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, palette["line"]),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]),
            ),
            Paragraph(
                f"<b>Evidence status:</b> <font color='{evidence_color}'>"
                f"<b>{evidence_status}</b></font>",
                styles["small"],
            ),
        ]
        story.append(KeepTogether(header_group))
        _append_labeled_block(
            story,
            "What we found",
            what_we_found,
            styles,
            minimum_space=0.55 * inch,
        )

        if evidence_status == "Verified in policy":
            evidence_paragraph = Paragraph(
                f"&ldquo;{_pdf_text(evidence_text)}&rdquo;", styles["evidence"]
            )
        else:
            evidence_paragraph = Paragraph(
                f"<i>{_pdf_text(evidence_text)}</i>", styles["evidence"]
            )
        _append_labeled_block(
            story,
            "Policy evidence",
            evidence_paragraph,
            styles,
            minimum_space=0.75 * inch,
            keep_complete=len(evidence_text) <= 600,
        )

        if severity == "Informational":
            maintenance = (
                finding.get("legal_rec")
                or finding.get("tech_rec")
                or finding.get("business_rec")
                or "Continue periodic review and retain evidence of policy maintenance."
            )
            _append_labeled_block(
                story,
                "Maintenance recommendation",
                Paragraph(_pdf_text(maintenance), styles["recommendation"]),
                styles,
                minimum_space=0.55 * inch,
                keep_complete=len(str(maintenance)) <= 600,
            )
            story.append(Spacer(1, 5))
            continue

        impacts = [
            text for text in (finding.get("legal_impact"), finding.get("business_impact")) if text
        ]
        if impacts:
            impact_text = " ".join(impacts)
            _append_labeled_block(
                story,
                "Why it matters",
                Paragraph(_pdf_text(impact_text), styles["body"]),
                styles,
                minimum_space=0.55 * inch,
                keep_complete=len(impact_text) <= 600,
            )

        story.append(CondPageBreak(0.85 * inch))
        story.append(Paragraph("<b>Recommended actions</b>", styles["label"]))
        recommendations = (
            ("Legal", finding.get("legal_rec")),
            ("Technical", finding.get("tech_rec")),
            ("Operational / Business", finding.get("business_rec")),
        )
        for recommendation_label, recommendation in recommendations:
            story.append(Paragraph(
                f"<b>{recommendation_label}:</b> "
                f"{_pdf_text(recommendation or 'No action recorded.')}",
                styles["recommendation"],
            ))
        story.append(Spacer(1, 6))


def _append_methodology(story, styles):
    story.append(CondPageBreak(0.95 * inch))
    story.append(Paragraph("4. Methodology & Important Notice", styles["h1"]))
    story.append(Paragraph(
        "AuditWeave first runs 11 deterministic disclosure checks and then performs a "
        "language-model-assisted assessment of the reviewed policy. The stored overall score "
        "uses the existing 40% deterministic and 60% assisted-assessment blend. Findings shown "
        "in this report are the recorded assessment findings; this document does not rerun or "
        "change the audit.",
        styles["body"],
    ))
    story.append(Paragraph(
        "Evidence marked Verified in policy was matched against the policy text supplied to this "
        "report. Missing means the finding contains no supporting extract. Unmatched means a stored "
        "extract could not be found in this policy version and should be reviewed before relying on it.",
        styles["body"],
    ))
    story.append(Paragraph(
        "This automated policy assessment supports compliance review but does not constitute legal "
        "advice or certify statutory compliance. Validate high-priority findings and remediation "
        "language with appropriately qualified privacy and legal professionals.",
        styles["small"],
    ))


def generate_audit_pdf(audit_data: dict, company_name: str, industry: str, audit_date: str) -> bytes:
    """Generate the active AuditWeave DPDP audit report without changing audit results."""
    audit_data = sanitize_data(audit_data)
    company_name = sanitize_data(company_name)
    industry = sanitize_data(industry)
    findings = list(audit_data.get("findings") or [])
    sorted_findings = sorted(
        findings,
        key=lambda finding: SEVERITY_ORDER.get(finding.get("severity", "Informational"), 99),
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=48,
        leftMargin=48,
        topMargin=48,
        bottomMargin=46,
        title=f"AuditWeave DPDP Compliance Report - {company_name}",
        author="AuditWeave",
    )
    styles, palette = _audit_styles()
    story = []
    _append_cover_and_summary(
        story, audit_data, company_name, industry, audit_date, findings, styles, palette
    )
    _append_pillar_section(story, sorted_findings, styles, palette)
    _append_findings_section(
        story, sorted_findings, audit_data.get("policy_text") or "", styles, palette
    )
    _append_methodology(story, styles)
    doc.build(
        story,
        onFirstPage=_audit_page_footer,
        onLaterPages=_audit_page_footer,
    )
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_comparison_pdf(compare_data: dict, company_a: dict, company_b: dict) -> bytes:
    """Generates a styled comparison report PDF showing side-by-side GRC posture differences."""
    compare_data = sanitize_data(compare_data)
    company_a = sanitize_data(company_a)
    company_b = sanitize_data(company_b)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    c_styles = get_grc_styles()
    story = []
    
    # Header Brand
    story.append(Paragraph("AuditWeave AI", ParagraphStyle('BrandComp', parent=c_styles['title'], fontSize=12, textColor=colors.HexColor('#0F172A'), spaceAfter=5)))
    story.append(Spacer(1, 10))
    
    # Title
    story.append(Paragraph(f"GRC Compliance Comparison Audit Report", c_styles['title']))
    story.append(Paragraph(f"Comparative Posture: <b>{company_a['name']}</b> vs <b>{company_b['name']}</b>", c_styles['subtitle']))
    
    # 1. Score Matrix Table
    story.append(Paragraph("1. Compliance Score Matrix", c_styles['h1']))
    matrix_data = [
        ["GRC Metric", company_a['name'], company_b['name']],
        ["Compliance Score", f"{company_a['score']}/100", f"{company_b['score']}/100"],
        ["Risk Assessment", company_a['status'], company_b['status']],
        ["Vulnerabilities Detected", f"{company_a['findings_count']} Gaps", f"{company_b['findings_count']} Gaps"]
    ]
    t_matrix = Table(matrix_data, colWidths=[2.3 * inch, 2.3 * inch, 2.3 * inch])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 15))
    
    # 2. Executive GRC Winner & Summary
    story.append(Paragraph("2. Executive GRC Summary", c_styles['h1']))
    story.append(Paragraph(f"<b>Compliance Posture Winner:</b> {compare_data['winner']}", c_styles['body']))
    story.append(Paragraph(f"<b>Gap Analysis Details:</b>", c_styles['h2']))
    story.append(Paragraph(compare_data['gap_analysis'], c_styles['body']))
    
    story.append(Spacer(1, 15))
    
    # 3. Side-by-side Gaps Table
    story.append(Paragraph("3. Target Gaps & Missing Controls", c_styles['h1']))
    
    gaps_a = ", ".join(company_a['primary_gaps']) if company_a['primary_gaps'] else "None"
    gaps_b = ", ".join(company_b['primary_gaps']) if company_b['primary_gaps'] else "None"
    
    gaps_data = [
        ["Organization", "Primary Missing Controls / Risk Findings"],
        [company_a['name'], gaps_a],
        [company_b['name'], gaps_b]
    ]
    t_gaps = Table(gaps_data, colWidths=[2.2 * inch, 4.8 * inch])
    t_gaps.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_gaps)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("4. GRC Recommendations", c_styles['h1']))
    story.append(Paragraph(
        "For the lower-scoring entity, it is critical to address high-severity omissions. "
        "1. Appoint a designated Grievance Officer and display contacts clearly in the privacy notice.\n"
        "2. Implement minor age gates and request parental verification to align with children's data provisions (Section 9).\n"
        "3. Decouple general Terms of Service acceptance from privacy notice consent checkboxes to guarantee granular consent.",
        c_styles['body']
    ))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("5. Appendix & Disclaimers", c_styles['h1']))
    story.append(Paragraph(
        "This GRC comparison report is rendered by AuditWeave AI's hybrid validation engine based on India's DPDP Act 2023. "
        "It provides a structural audit comparison and does not constitute formal legal counsel. For regulatory implementation plans, "
        "consult qualified data privacy attorneys.",
        ParagraphStyle('DisclaimerComp', parent=c_styles['body'], fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))
    ))
    
    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def _markdown_blocks_to_pdf_story(text: str, c_styles: dict) -> list:
    """Convert remediated policy Markdown into ReportLab flowables."""
    story = []
    for block in re.split(r"\n{2,}", text.strip()):
        block = block.strip()
        if not block:
            continue
        if block.startswith("### "):
            story.append(Paragraph(block[4:], c_styles["h2"]))
        elif block.startswith("## "):
            story.append(Paragraph(block[3:], c_styles["h1"]))
        elif block.startswith("# "):
            story.append(Paragraph(block[2:], c_styles["title"]))
        elif block.startswith("---"):
            story.append(Spacer(1, 12))
        else:
            for line in block.split("\n"):
                line = line.strip()
                if line:
                    story.append(Paragraph(line, c_styles["body"]))
        story.append(Spacer(1, 6))
    return story


def generate_remediated_policy_pdf(remediated_text: str, company_name: str) -> bytes:
    """Generate a branded PDF of the remediated privacy policy."""
    remediated_text = sanitize_data(remediated_text)
    company_name = sanitize_data(company_name)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    c_styles = get_grc_styles()
    story = []

    story.append(Paragraph("AuditWeave AI", ParagraphStyle(
        "BrandRemed", parent=c_styles["title"], fontSize=14,
        textColor=colors.HexColor("#0F172A"), spaceAfter=5,
    )))
    story.append(Paragraph(
        "DPDP Compliance Intelligence Platform",
        ParagraphStyle(
            "BrandTagRemed", parent=c_styles["subtitle"], fontSize=9,
            textColor=colors.HexColor("#0284C7"), spaceAfter=20,
        ),
    ))
    story.append(Paragraph(
        f"Remediated Privacy Policy — {company_name}",
        c_styles["title"],
    ))
    story.append(Paragraph(
        f"Generated {datetime.datetime.utcnow().strftime('%B %d, %Y')} · "
        "Replace all [PLACEHOLDER] values before publishing.",
        ParagraphStyle(
            "RemedDisclaimer", parent=c_styles["subtitle"], fontSize=9,
            textColor=colors.HexColor("#64748B"), spaceAfter=20,
        ),
    ))
    story.append(Spacer(1, 10))
    story.extend(_markdown_blocks_to_pdf_story(remediated_text, c_styles))

    doc.build(story)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_remediated_policy_docx(remediated_text: str, company_name: str) -> bytes:
    """Generate a DOCX of the remediated privacy policy."""
    doc = Document()
    doc.add_heading(f"Remediated Privacy Policy — {company_name}", 0)
    disclaimer = doc.add_paragraph(
        "Generated by AuditWeave · DPDP Act 2023 Compliance Remediation. "
        "Replace all [PLACEHOLDER] values with verified organisation details "
        "before publishing."
    )
    disclaimer.runs[0].italic = True
    doc.add_paragraph("")

    for block in re.split(r"\n{2,}", remediated_text.strip()):
        block = block.strip()
        if not block or block == "---":
            continue
        if block.startswith("### "):
            doc.add_heading(block[4:], level=2)
        elif block.startswith("## "):
            doc.add_heading(block[3:], level=1)
        elif block.startswith("# "):
            doc.add_heading(block[2:], level=0)
        else:
            for line in block.split("\n"):
                line = line.strip()
                if line:
                    doc.add_paragraph(line)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    docx_bytes = buffer.getvalue()
    buffer.close()
    return docx_bytes
