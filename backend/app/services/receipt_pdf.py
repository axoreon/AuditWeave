import datetime
import io
import os
from functools import lru_cache
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

from ..models import PaymentReceipt


DEEP = colors.HexColor("#103F37")
GREEN = colors.HexColor("#2A725D")
TEAL = colors.HexColor("#64B69D")
CREAM = colors.HexColor("#F7F3EB")
WHITE = colors.HexColor("#FFFDF9")
DARK = colors.HexColor("#123F37")
MUTED = colors.HexColor("#6F8580")
LINE = colors.HexColor("#DCE6E2")
SUCCESS_BG = colors.HexColor("#ECF8F2")
SUCCESS_LINE = colors.HexColor("#A8DEC9")
SUCCESS = colors.HexColor("#147557")
RUPEE = "\u20b9"


def _font_candidates() -> list[tuple[str, str]]:
    configured_regular = os.getenv("RECEIPT_FONT_PATH", "").strip()
    configured_bold = os.getenv("RECEIPT_FONT_BOLD_PATH", "").strip()
    candidates: list[tuple[str, str]] = []
    if configured_regular:
        candidates.append((configured_regular, configured_bold or configured_regular))
    candidates.extend([
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        (r"C:\Windows\Fonts\Nirmala.ttf", r"C:\Windows\Fonts\NirmalaB.ttf"),
        (r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\arialbd.ttf"),
    ])
    return candidates


@lru_cache(maxsize=1)
def receipt_font_names() -> tuple[str, str]:
    for regular_path, bold_path in _font_candidates():
        if not Path(regular_path).is_file() or not Path(bold_path).is_file():
            continue
        regular = TTFont("AuditWeaveReceipt", regular_path)
        bold = TTFont("AuditWeaveReceiptBold", bold_path)
        if ord(RUPEE) not in regular.face.charWidths or ord(RUPEE) not in bold.face.charWidths:
            continue
        pdfmetrics.registerFont(regular)
        pdfmetrics.registerFont(bold)
        return "AuditWeaveReceipt", "AuditWeaveReceiptBold"
    raise RuntimeError(
        "A Unicode receipt font with the Indian rupee glyph is required. "
        "Set RECEIPT_FONT_PATH and RECEIPT_FONT_BOLD_PATH."
    )


def format_receipt_amount(amount_paise: int) -> str:
    rupees = amount_paise / 100
    formatted = f"{rupees:,.0f}" if amount_paise % 100 == 0 else f"{rupees:,.2f}"
    return f"{RUPEE}{formatted}"


def mask_payment_reference(reference: str) -> str:
    reference = str(reference or "")
    if len(reference) <= 4:
        return "\u2022\u2022\u2022\u2022"
    prefix = reference.split("_", 1)[0] if "_" in reference else "ref"
    return f"{prefix}_\u2022\u2022\u2022\u2022{reference[-4:]}"


def _receipt_date(value: datetime.datetime) -> str:
    return value.strftime("%d %b %Y, %H:%M UTC")


def _p(value, style):
    safe = escape(str(value if value not in (None, "") else "-"))
    return Paragraph(safe, style)


def _draw_p(pdf, value, style, x, top, width, height):
    paragraph = _p(value, style)
    _, used = paragraph.wrap(width, height)
    paragraph.drawOn(pdf, x, top - used)
    return used


def _draw_check(pdf, x, y, color):
    pdf.saveState()
    pdf.setStrokeColor(color)
    pdf.setLineWidth(1.5)
    pdf.setLineCap(1)
    pdf.line(x, y, x + 3, y - 3)
    pdf.line(x + 3, y - 3, x + 8, y + 3)
    pdf.restoreState()


def _detail_box(pdf, title, rows, x, top, width, label_style, value_style):
    pdf.setFillColor(DARK)
    pdf.setFont(label_style.fontName, 9)
    pdf.drawString(x, top, title.upper())
    box_top = top - 10
    row_height = 23
    bottom = box_top - row_height * len(rows)
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.7)
    pdf.roundRect(x, bottom, width, row_height * len(rows), 7, fill=1, stroke=1)
    split = width * 0.43
    for index, (label, value) in enumerate(rows):
        row_top = box_top - index * row_height
        if index:
            pdf.line(x + 10, row_top, x + width - 10, row_top)
        _draw_p(pdf, label, label_style, x + 11, row_top - 7, split - 12, 14)
        _draw_p(pdf, value, value_style, x + split, row_top - 7, width - split - 11, 14)
    return bottom


def generate_receipt_pdf(receipt: PaymentReceipt) -> bytes:
    """Generate one deterministic A4 PDF from immutable receipt snapshot fields."""
    regular, bold = receipt_font_names()
    amount = format_receipt_amount(receipt.amount_paid)
    paid_at = _receipt_date(receipt.paid_at)
    payment_ref = mask_payment_reference(receipt.payment_reference)
    order_ref = mask_payment_reference(receipt.provider_order_reference)

    body = ParagraphStyle(
        "Body", fontName=regular, fontSize=8.7, leading=12,
        textColor=DARK, wordWrap="CJK",
    )
    muted = ParagraphStyle("Muted", parent=body, textColor=MUTED)
    strong = ParagraphStyle("Strong", parent=body, fontName=bold)
    detail_label = ParagraphStyle("DetailLabel", parent=muted, fontSize=8.1, leading=10)
    detail_value = ParagraphStyle("DetailValue", parent=strong, fontSize=8.7, leading=10.5)
    side_label = ParagraphStyle(
        "SideLabel", parent=body, fontName=bold, fontSize=6.8,
        leading=8, textColor=TEAL,
    )
    side_value = ParagraphStyle(
        "SideValue", parent=body, fontSize=8.3, leading=10.5,
        textColor=colors.white, wordWrap="CJK",
    )
    note = ParagraphStyle(
        "Note", parent=muted, fontSize=7.7, leading=10.5,
        alignment=TA_CENTER,
    )

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4, invariant=1, pageCompression=1)
    pdf.setTitle(f"AuditWeave Payment Receipt {receipt.receipt_number}")
    pdf.setAuthor("AuditWeave")
    page_w, page_h = A4
    margin = 14 * mm
    card_x = card_y = margin
    card_w, card_h = page_w - 2 * margin, page_h - 2 * margin
    card_top = card_y + card_h
    side_w = card_w * 0.30
    main_x, main_w = card_x + side_w, card_w - side_w

    pdf.setFillColor(CREAM)
    pdf.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    pdf.setFillColor(DEEP)
    pdf.roundRect(card_x, card_y, card_w, card_h, 12, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.rect(main_x, card_y, main_w, card_h, fill=1, stroke=0)
    pdf.setStrokeColor(LINE)
    pdf.roundRect(card_x, card_y, card_w, card_h, 12, fill=0, stroke=1)

    # Brand and payment summary.
    left_x, left_w = card_x + 15, side_w - 30
    y = card_top - 30
    pdf.setFillColor(colors.white)
    pdf.setFont(bold, 18)
    pdf.drawString(left_x, y, "AuditWeave")
    pdf.setFillColor(TEAL)
    pdf.setFont(regular, 6.2)
    pdf.drawString(left_x, y - 13, "POWERED BY AXOREON")
    y -= 45
    pdf.setStrokeColor(colors.Color(1, 1, 1, alpha=0.18))
    pdf.line(left_x, y, left_x + left_w, y)
    y -= 30
    pdf.setFillColor(TEAL)
    pdf.setFont(bold, 7.4)
    pdf.drawString(left_x, y, "PAYMENT RECEIPT")
    y -= 37
    pdf.setFillColor(colors.white)
    pdf.setFont(bold, 25)
    pdf.drawString(left_x, y, amount)
    y -= 31
    pdf.setFillColor(TEAL)
    pdf.setFont(regular, 7.2)
    pdf.drawString(left_x, y, "PAID FOR")
    y -= 20
    side_plan = ParagraphStyle(
        "SidePlan", parent=side_value, fontName=bold, fontSize=11, leading=13,
    )
    _draw_p(pdf, receipt.plan_name, side_plan, left_x, y, left_w, 27)
    y -= 31
    pdf.setFillColor(colors.white)
    pdf.setFont(regular, 8.5)
    pdf.drawString(left_x, y, f"{receipt.credits_purchased:,} Credits")
    y -= 38
    pdf.setFillColor(SUCCESS_BG)
    pdf.roundRect(left_x, y - 7, 60, 22, 11, fill=1, stroke=0)
    pdf.setFillColor(SUCCESS)
    pdf.setFont(bold, 8)
    _draw_check(pdf, left_x + 11, y + 1, SUCCESS)
    pdf.drawString(left_x + 25, y, "PAID")
    y -= 36
    pdf.setStrokeColor(colors.Color(1, 1, 1, alpha=0.18))
    pdf.line(left_x, y, left_x + left_w, y)
    y -= 25
    for label, value in [
        ("PAYMENT DATE", paid_at),
        ("RECEIPT NUMBER", receipt.receipt_number),
        ("PAYMENT REFERENCE", payment_ref),
        ("ORDER REFERENCE", order_ref),
    ]:
        _draw_p(pdf, label, side_label, left_x, y, left_w, 10)
        y -= 12
        used = _draw_p(pdf, value, side_value, left_x, y, left_w, 30)
        y -= max(used, 10) + 16

    support_y = card_y + 62
    pdf.setStrokeColor(colors.Color(1, 1, 1, alpha=0.18))
    pdf.line(left_x, support_y + 48, left_x + left_w, support_y + 48)
    pdf.setFillColor(TEAL)
    pdf.setFont(bold, 7)
    pdf.drawString(left_x, support_y + 31, "NEED HELP?")
    support = ParagraphStyle("Support", parent=side_value, fontSize=7.5, leading=9.5)
    _draw_p(
        pdf, "Contact AuditWeave support from your account.",
        support, left_x, support_y + 20, left_w, 30,
    )
    pdf.setFillColor(TEAL)
    pdf.setFont(regular, 6.5)
    pdf.drawString(left_x, card_y + 20, "SECURE ONE-TIME CREDIT PURCHASE")

    # Receipt details.
    content_x = main_x + 23
    content_w = main_w - 46
    right = content_x + content_w
    top = card_top - 26
    pdf.setFillColor(MUTED)
    pdf.setFont(bold, 6.7)
    pdf.drawRightString(right, top, "RECEIPT DATE")
    pdf.setFillColor(DARK)
    pdf.setFont(regular, 8)
    pdf.drawRightString(right, top - 13, paid_at)

    title_y = card_top - 78
    pdf.setFillColor(GREEN)
    pdf.setFont(bold, 7.4)
    pdf.drawString(content_x, title_y, "PAYMENT RECEIPT")
    pdf.setFillColor(DARK)
    pdf.setFont(bold, 23)
    pdf.drawString(content_x, title_y - 31, "Thank you for your purchase!")
    _draw_p(
        pdf,
        "Your payment was successful and your credits are now available in your account.",
        muted, content_x, title_y - 47, content_w, 26,
    )

    success_top, success_h = title_y - 83, 43
    pdf.setFillColor(SUCCESS_BG)
    pdf.setStrokeColor(SUCCESS_LINE)
    pdf.roundRect(content_x, success_top - success_h, content_w, success_h, 7, fill=1, stroke=1)
    pdf.setFillColor(SUCCESS)
    pdf.setFont(bold, 9.5)
    _draw_check(pdf, content_x + 14, success_top - 15, SUCCESS)
    pdf.drawString(content_x + 27, success_top - 17, "Payment Successful")
    pdf.setFont(regular, 7.7)
    pdf.drawString(content_x + 13, success_top - 31, "Your transaction has been completed successfully.")

    billed_top = success_top - success_h - 22
    pdf.setFillColor(DARK)
    pdf.setFont(bold, 9)
    pdf.drawString(content_x, billed_top, "BILLED TO")
    used = _draw_p(
        pdf, receipt.customer_name or "AuditWeave Customer",
        strong, content_x, billed_top - 13, content_w, 24,
    )
    email_top = billed_top - 15 - used
    email_used = _draw_p(
        pdf, receipt.customer_email, muted,
        content_x, email_top, content_w, 24,
    )

    purchase_top = min(billed_top - 58, email_top - email_used - 14)
    purchase_bottom = _detail_box(
        pdf, "Purchase Details",
        [
            ("Pack", receipt.plan_name),
            ("Credits Purchased", f"{receipt.credits_purchased:,}"),
            ("Amount Paid", amount),
            ("Currency", receipt.currency),
        ],
        content_x, purchase_top, content_w, detail_label, detail_value,
    )
    payment_bottom = _detail_box(
        pdf, "Payment Details",
        [
            ("Payment Reference", payment_ref),
            ("Order Reference", order_ref),
            ("Payment Provider", receipt.provider),
            ("Payment Status", "Paid"),
        ],
        content_x, purchase_bottom - 21, content_w, detail_label, detail_value,
    )

    total_top, total_h = payment_bottom - 18, 42
    pdf.setFillColor(DEEP)
    pdf.roundRect(content_x, total_top - total_h, content_w, total_h, 7, fill=1, stroke=0)
    pdf.setFillColor(TEAL)
    pdf.setFont(bold, 7.3)
    pdf.drawString(content_x + 13, total_top - 25, "TOTAL PAID")
    pdf.setFillColor(colors.white)
    pdf.setFont(bold, 17)
    pdf.drawRightString(right - 13, total_top - 27, amount)

    notice_top, notice_h = total_top - total_h - 17, 41
    pdf.setFillColor(CREAM)
    pdf.roundRect(content_x, notice_top - notice_h, content_w, notice_h, 6, fill=1, stroke=0)
    _draw_p(
        pdf,
        "This receipt confirms payment for an AuditWeave one-time credit purchase.",
        note, content_x + 12, notice_top - 8, content_w - 24, 13,
    )
    note_bold = ParagraphStyle("NoteBold", parent=note, fontName=bold)
    _draw_p(
        pdf, "No subscription or automatic renewal applies.",
        note_bold, content_x + 12, notice_top - 22, content_w - 24, 13,
    )

    footer_y = card_y + 26
    pdf.setStrokeColor(LINE)
    pdf.line(content_x, footer_y + 22, right, footer_y + 22)
    footer = ParagraphStyle(
        "Footer", parent=note, fontSize=6.9, leading=9,
        textColor=MUTED, alignment=TA_LEFT,
    )
    _draw_p(
        pdf,
        "Thank you for choosing AuditWeave. Receipt generated for your AuditWeave credit purchase.",
        footer, content_x, footer_y + 10, content_w, 20,
    )
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
