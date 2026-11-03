import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  BENCHMARK_DISCLOSURE,
  getPillarTone,
  splitPillarNames,
} from "./dashboard.ts";

const dashboardPage = readFileSync(
  new URL("../app/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("Executive Risk Summary does not render an unverified confidence metric", () => {
  assert.equal(dashboardPage.includes("Verified AI Confidence"), false);
  assert.equal(dashboardPage.includes("formatVerifiedAiConfidence"), false);
});

test("lowest-risk pillar names are split into individual display values", () => {
  assert.deepEqual(
    splitPillarNames("Notice, Data Fiduciary Obligations, Cross Border Transfer"),
    ["Notice", "Data Fiduciary Obligations", "Cross Border Transfer"],
  );
  assert.deepEqual(splitPillarNames("  Notice, , Consent  "), ["Notice", "Consent"]);
});

test("pillar cards use stored severity and an explicit unavailable state", () => {
  assert.match(getPillarTone("Critical"), /red/);
  assert.match(getPillarTone("Medium"), /amber/);
  assert.match(getPillarTone(null), /brand-deep/);
});

test("benchmark disclosure clearly labels seeded values as demonstration data", () => {
  assert.match(BENCHMARK_DISCLOSURE, /Demonstration data/i);
  assert.match(BENCHMARK_DISCLOSURE, /seeded sample values/i);
  assert.match(BENCHMARK_DISCLOSURE, /not verified industry statistics/i);
});
