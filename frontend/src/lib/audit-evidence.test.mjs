import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getFindingEvidenceState,
  getFindingEvidenceStatusLabel,
  hasExactPolicyEvidence,
} from "./audit-evidence.ts";

const auditPage = readFileSync(
  new URL("../app/audit/[id]/page.tsx", import.meta.url),
  "utf8",
);

const policy = "## Security\r\nWe use encryption and access controls to protect your data.";

test("evidence-backed findings are exact-matched and remain scroll targets", () => {
  const evidence = "We use encryption and access controls to protect your data.";
  assert.equal(hasExactPolicyEvidence(policy, evidence), true);
  assert.equal(
    getFindingEvidenceState({
      policyText: policy,
      evidence,
      findingSelected: true,
      searchText: "",
    }),
    "matched",
  );
  assert.match(auditPage, /querySelector\("\.highlight-target"\)/);
  assert.match(auditPage, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
});

test("missing-clause findings have an explicit missing state", () => {
  const state = getFindingEvidenceState({
    policyText: policy,
    findingSelected: true,
    searchText: "",
  });
  assert.equal(state, "missing");
  assert.equal(getFindingEvidenceStatusLabel(state), "Required clause missing");
  assert.match(auditPage, /Required disclosure not found in the policy\./);
});

test("unmatched evidence is not represented as verified policy text", () => {
  const state = getFindingEvidenceState({
    policyText: policy,
    evidence: "We retain all personal data forever.",
    findingSelected: true,
    searchText: "",
  });
  assert.equal(state, "unmatched");
  assert.equal(getFindingEvidenceStatusLabel(state), "Evidence could not be matched");
  assert.match(auditPage, /Stored evidence could not be matched to this policy version\./);
});

test("active search is explicit and selecting another finding clears it", () => {
  const state = getFindingEvidenceState({
    policyText: policy,
    evidence: "We use encryption",
    findingSelected: true,
    searchText: "retention",
  });
  assert.equal(state, "search");
  assert.equal(getFindingEvidenceStatusLabel(state), "Search active");
  assert.match(auditPage, /if \(willSelect\) setSearchText\(""\);/);
});

test("static active-target copy is removed and status is dynamic", () => {
  assert.doesNotMatch(auditPage, />Highlighting Active Target</);
  assert.match(auditPage, /getFindingEvidenceStatusLabel\(evidenceState\)/);
});

test("finding cards retain keyboard expand and collapse behavior", () => {
  assert.match(auditPage, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(auditPage, /event\.preventDefault\(\);/);
  assert.match(auditPage, /handleToggleFinding\(f\);/);
});
