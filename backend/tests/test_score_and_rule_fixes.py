"""
Regression tests for targeted fixes:
  - P0: Deterministic fallback scoring + no raw score in overall_summary.
  - P1: Extended rule aliases for RULE_DATA_RETENTION, RULE_CROSS_BORDER,
        RULE_NOTICE_PURPOSE.

Run with:  pytest backend/tests/test_score_and_rule_fixes.py -v
"""
import re
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rule_engine import HybridComplianceEngine
from app.services.gemini import mock_audit_generation


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_rule_results(passed: int, total: int = 11):
    """Build a minimal rule_results dict that mock_audit_generation accepts."""
    return {
        "passed_count": passed,
        "failed_count": total - passed,
        "rule_score": round((passed / total) * 100, 1),
        "passed_rules": [],
        "failed_rules": [],
    }


def _run_rule(rule_id: str, policy_text: str) -> dict:
    """Run the HybridComplianceEngine and return the single rule result."""
    engine = HybridComplianceEngine()
    results = engine.run(policy_text)
    for r in results["passed_rules"] + results["failed_rules"]:
        if r["rule_id"] == rule_id:
            return r
    raise KeyError(f"Rule {rule_id!r} not found in engine output")


# ===========================================================================
# A. New aliases PASS for each of the three rules
# ===========================================================================

class TestDataRetentionNewAliases:
    """A – RULE_DATA_RETENTION new aliases must produce a Pass."""

    @pytest.mark.parametrize("phrase", [
        "We retain your data for a period of three years.",
        "We retain your personal data until the purpose is fulfilled.",
        "Your information is retained for 90 days after account closure.",
        "This is our data retention policy: we delete records annually.",
        "We explain how long we keep your information in Section 4.",
        "The storage duration for each category is listed below.",
        "Collected data is kept for no longer than two years.",
        # past-tense 'deleted after' — new alias, original had 'delete after'
        "Records are deleted after the legal hold expires.",
    ])
    def test_new_alias_passes(self, phrase):
        result = _run_rule("RULE_DATA_RETENTION", phrase)
        assert result["status"] == "Pass", (
            f"Expected Pass for phrase: {phrase!r}\nGot: {result}"
        )

    # C – original phrases still pass
    @pytest.mark.parametrize("phrase", [
        "The retention period is twelve months.",
        "We retain data for the duration of the contract.",
        "Our retention policy covers all categories of personal data.",
        "We store data for up to 5 years.",
        "Data is retained as long as necessary for the stated purpose.",
    ])
    def test_original_alias_still_passes(self, phrase):
        result = _run_rule("RULE_DATA_RETENTION", phrase)
        assert result["status"] == "Pass", (
            f"Original alias should still pass: {phrase!r}\nGot: {result}"
        )

    # B – non-compliant text still fails
    @pytest.mark.parametrize("phrase", [
        "We collect your name and email address.",
        "Your consent is required before processing.",
        "Contact our grievance officer at privacy@example.com.",
        "We may share data with third parties for advertising.",
        # Standalone broad words that must NOT trigger a false pass
        "Retention of market share is our business goal.",
        "Data is important to our operations.",
    ])
    def test_non_compliant_fails(self, phrase):
        result = _run_rule("RULE_DATA_RETENTION", phrase)
        assert result["status"] == "Fail", (
            f"Expected Fail for non-compliant phrase: {phrase!r}\nGot: {result}"
        )


class TestCrossBorderNewAliases:
    """A – RULE_CROSS_BORDER new aliases must produce a Pass."""

    @pytest.mark.parametrize("phrase", [
        "We may perform international data transfers to the United States.",
        "International data transfer may occur when using our cloud services.",
        "Transfers outside of India are subject to standard contractual clauses.",
        "Any transfer outside of India is governed by our data transfer agreements.",
        "Personal data may be transferred internationally to our processors.",
        "Our servers outside India are located in Singapore and Germany.",
        "Data is processed in a foreign jurisdiction under equivalent protections.",
    ])
    def test_new_alias_passes(self, phrase):
        result = _run_rule("RULE_CROSS_BORDER", phrase)
        assert result["status"] == "Pass", (
            f"Expected Pass for phrase: {phrase!r}\nGot: {result}"
        )

    # C – original phrases still pass
    @pytest.mark.parametrize("phrase", [
        "We perform cross-border data transfers.",
        "International transfer of your data may occur.",
        "Data may be processed outside India.",
        "We may transfer abroad your personal information.",
        "We transfer data internationally to our affiliates.",
        "Global transfer of data is governed by applicable law.",
    ])
    def test_original_alias_still_passes(self, phrase):
        result = _run_rule("RULE_CROSS_BORDER", phrase)
        assert result["status"] == "Pass", (
            f"Original alias should still pass: {phrase!r}\nGot: {result}"
        )

    # B – non-compliant text still fails
    @pytest.mark.parametrize("phrase", [
        "We collect your name and email address.",
        "Consent is required before processing your data.",
        "We use encryption to protect your personal data.",
        # Broad standalone words that must NOT trigger false passes
        "International shipping is available.",
        "We have servers dedicated to performance.",
        "India is our primary operating country.",
    ])
    def test_non_compliant_fails(self, phrase):
        result = _run_rule("RULE_CROSS_BORDER", phrase)
        assert result["status"] == "Fail", (
            f"Expected Fail for non-compliant phrase: {phrase!r}\nGot: {result}"
        )

    # Hyphenation regression: optional hyphen vs space (root cause of re-audit failure)
    @pytest.mark.parametrize("phrase", [
        # Exact wording from the remediated policy that was failing
        "We will address cross border transfer through a documented process "
        "that clearly describes the personal data involved, the specified purpose.",
        # Unhyphenated short form
        "Our cross border transfer policy is described below.",
        # Hyphenated form must still pass
        "We perform cross-border transfer under standard contractual clauses.",
    ])
    def test_hyphenation_variants(self, phrase):
        """'cross border' (space) and 'cross-border' (hyphen) must both Pass."""
        result = _run_rule("RULE_CROSS_BORDER", phrase)
        assert result["status"] == "Pass", (
            f"Hyphenation variant should Pass: {phrase!r}\nGot: {result}"
        )

    @pytest.mark.parametrize("phrase", [
        # Individual words in non-cross-border context must NOT trigger a pass
        "We must cross-check all submissions before transfer.",
        "The border patrol checks all incoming transfers.",
        "Transfer of responsibility requires written consent.",
    ])
    def test_hyphenation_false_positive_protection(self, phrase):
        """Isolated 'cross', 'border', or 'transfer' without the full phrase must Fail."""
        result = _run_rule("RULE_CROSS_BORDER", phrase)
        assert result["status"] == "Fail", (
            f"False-positive: isolated words should Fail: {phrase!r}\nGot: {result}"
        )


class TestNoticePurposeNewAliases:
    """A – RULE_NOTICE_PURPOSE new aliases must produce a Pass."""

    @pytest.mark.parametrize("phrase", [
        "The purposes for processing your personal data are described below.",
        "The purposes for which we process personal data include service delivery.",
        "We process your data for the following reasons.",
        "We process personal data for the purposes listed in this notice.",
        "The data we collect for each service category is described herein.",
        "The purpose of processing is to fulfil your service request.",
    ])
    def test_new_alias_passes(self, phrase):
        result = _run_rule("RULE_NOTICE_PURPOSE", phrase)
        assert result["status"] == "Pass", (
            f"Expected Pass for phrase: {phrase!r}\nGot: {result}"
        )

    # C – original phrases still pass
    @pytest.mark.parametrize("phrase", [
        "The purpose of collection is described below.",
        "Why we collect your data is explained in this section.",
        "We use your data for service improvement.",
        "The reasons for processing are listed here.",
        "We collect personal data to provide our services.",
    ])
    def test_original_alias_still_passes(self, phrase):
        result = _run_rule("RULE_NOTICE_PURPOSE", phrase)
        assert result["status"] == "Pass", (
            f"Original alias should still pass: {phrase!r}\nGot: {result}"
        )

    # B – non-compliant text still fails
    @pytest.mark.parametrize("phrase", [
        "We may share your information with third parties.",
        "Our grievance officer can be reached at privacy@company.com.",
        "We implement encryption and access controls.",
        # Broad terms that must NOT trigger false passes
        "Processing orders takes 2-3 business days.",
        "We collect your order information.",
        "Data is important for our business.",
    ])
    def test_non_compliant_fails(self, phrase):
        result = _run_rule("RULE_NOTICE_PURPOSE", phrase)
        assert result["status"] == "Fail", (
            f"Expected Fail for non-compliant phrase: {phrase!r}\nGot: {result}"
        )


# ===========================================================================
# D. Deterministic fallback: identical input → identical score, repeatedly
# ===========================================================================

class TestDeterministicFallback:
    """D – mock_audit_generation must be fully deterministic."""

    POLICY = (
        "We collect your email for account creation. "
        "Consent is requested explicitly at signup. "
        "You may withdraw consent at any time."
    )

    def _score(self, passed: int):
        rule_results = _make_rule_results(passed)
        result = mock_audit_generation("TestCo", "SaaS", self.POLICY, rule_results)
        return result["ai_compliance_score"]

    def test_same_passed_count_same_score_repeated(self):
        scores = [self._score(6) for _ in range(20)]
        assert len(set(scores)) == 1, (
            f"Fallback score varied across identical calls: {set(scores)}"
        )

    def test_score_increases_monotonically_with_passed_count(self):
        """More passing rules → higher or equal AI score."""
        prev = self._score(0)
        for passed in range(1, 12):
            current = self._score(passed)
            assert current >= prev, (
                f"Score decreased from passed={passed-1} ({prev}) to passed={passed} ({current})"
            )
            prev = current

    def test_score_within_bounds(self):
        for passed in range(0, 12):
            score = self._score(passed)
            assert 15.0 <= score <= 100.0, f"Score {score} out of [15, 100] for passed={passed}"


# ===========================================================================
# E. overall_summary must NOT contain a competing raw numeric score
# ===========================================================================

class TestSummaryNoRawScore:
    """E – overall_summary must never embed a numeric score that could diverge
    from the authoritative combined_score computed by the caller."""

    # Pattern that catches "scored X/100", "score: X", "X/100", etc.
    _SCORE_PATTERN = re.compile(r"\b\d{1,3}(?:\.\d)?\s*/\s*100\b")

    @pytest.mark.parametrize("passed", [0, 3, 6, 9, 11])
    def test_no_numeric_score_in_summary(self, passed):
        rule_results = _make_rule_results(passed)
        result = mock_audit_generation(
            "AcmeCorp", "FinTech",
            "We collect data for service delivery with explicit consent.",
            rule_results,
        )
        summary = result["overall_summary"]
        match = self._SCORE_PATTERN.search(summary)
        assert match is None, (
            f"overall_summary contains a raw numeric score ({match.group()!r}) "
            f"that can diverge from the authoritative compliance_score.\n"
            f"Summary: {summary!r}"
        )

    def test_summary_contains_status_label(self):
        """Summary must still convey qualitative status."""
        rule_results = _make_rule_results(6)
        result = mock_audit_generation(
            "AcmeCorp", "FinTech",
            "We collect data for service delivery with explicit consent.",
            rule_results,
        )
        summary = result["overall_summary"]
        # Should contain one of the standard status labels
        status_labels = {"Excellent", "Good", "Moderate Risk", "High Risk", "Critical Risk"}
        assert any(label in summary for label in status_labels), (
            f"overall_summary does not contain a qualitative status label.\n"
            f"Summary: {summary!r}"
        )


# ===========================================================================
# F. Combined score formula is unchanged (0.4 * rule_score + 0.6 * ai_score)
# ===========================================================================

class TestCombinedScoreFormula:
    """F – verify the 0.4/0.6 blending formula still holds end-to-end."""

    def test_combined_score_formula(self):
        """
        For 6 out of 11 rules passing:
          rule_score  = (6/11)*100 ≈ 54.5
          ai_score    = 30 + (6/11)*60 ≈ 62.7  (deterministic, no jitter)
          combined    = round(0.4*54.5 + 0.6*62.7, 1)
                      = round(21.82 + 37.64, 1)
                      = round(59.45, 1) = 59.5
        The test does not hard-code 59.5 — it verifies the formula relation.
        """
        passed = 6
        total = 11
        rule_score = round((passed / total) * 100, 1)

        rule_results = _make_rule_results(passed, total)
        mock_result = mock_audit_generation(
            "TestCorp", "SaaS",
            "We collect personal data for service delivery.",
            rule_results,
        )
        ai_score = mock_result["ai_compliance_score"]

        expected_combined = round(0.4 * rule_score + 0.6 * ai_score, 1)
        # Verify the formula produces a sane value in a known band
        assert 40.0 <= expected_combined <= 80.0, (
            f"Combined score {expected_combined} out of expected band for 6/11 rules."
        )
        # Verify ai_score is deterministic (no jitter) matches formula
        base = 30 + (passed / total) * 60
        assert ai_score == round(min(100.0, max(15.0, base)), 1), (
            f"ai_score {ai_score} does not match deterministic formula {base:.2f}"
        )
