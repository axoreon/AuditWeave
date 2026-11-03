import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const auditDetailSource = readFileSync(
  new URL("../app/audit/[id]/page.tsx", import.meta.url),
  "utf8",
);
const landingSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

test("audit detail hides unverified AI confidence and keeps four operational metrics", () => {
  assert.equal(auditDetailSource.includes(">AI Confidence<"), false);
  assert.equal(
    auditDetailSource.includes("Math.round(audit.ai_confidence_score * 100)"),
    false,
  );
  assert.match(auditDetailSource, /lg:grid-cols-4/);
  for (const label of [
    "Rules Passed",
    "Rule Violations",
    "AI Observations",
    "Manual Rules",
  ]) {
    assert.equal(auditDetailSource.includes(label), true);
  }
  assert.equal(auditDetailSource.includes("ai_confidence_score: number"), true);
});

test("public landing page does not advertise an unverified confidence percentage", () => {
  assert.equal(landingSource.includes(">AI Confidence<"), false);
  assert.equal(landingSource.includes(">96%<"), false);
});
