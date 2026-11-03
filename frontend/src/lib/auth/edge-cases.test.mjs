import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";


const loginPage = readFileSync(new URL("../../app/login/page.tsx", import.meta.url), "utf8");
const forgotPage = readFileSync(new URL("../../app/forgot-password/page.tsx", import.meta.url), "utf8");
const resetPage = readFileSync(new URL("../../app/reset-password/page.tsx", import.meta.url), "utf8");
const verifyPage = readFileSync(new URL("../../app/verify-email/page.tsx", import.meta.url), "utf8");


test("login fallback is generic and duplicate submissions are blocked", () => {
  assert.match(loginPage, /Invalid email or password\./);
  assert.match(loginPage, /if \(loading\) return;/);
  assert.doesNotMatch(loginPage, /user not found|email does not exist|wrong password/i);
});


test("forgot-password keeps generic messaging and duplicate-submit protection", () => {
  assert.match(forgotPage, /if \(loading\) return;/);
  assert.match(forgotPage, /disabled=\{loading\}/);
  assert.match(forgotPage, /requested=1/);
  assert.doesNotMatch(forgotPage, /account not found|isn't registered|user not found/i);
  assert.match(resetPage, /If an account exists for this email, we've sent a 6-digit reset code\./);
});


test("reset and verification resends remain enumeration-safe and accessible", () => {
  assert.match(resetPage, /role="alert" aria-live="assertive"/);
  assert.match(resetPage, /role="status" aria-live="polite"/);
  assert.match(resetPage, /if \(loading\) return;/);
  assert.match(verifyPage, /If verification is pending for this email/);
  assert.doesNotMatch(`${resetPage}\n${verifyPage}`, /account not found|user not found/i);
});
