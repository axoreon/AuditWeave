import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getPasswordRequirementState,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validatePasswordConfirmation,
  validatePasswordField,
  validateSignup,
} from "./validation.ts";

const VALID_PASSWORD = "Audit123!";

test("password policy accepts the exact required character classes", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(PASSWORD_MAX_LENGTH, 128);
  assert.equal(validatePasswordField(VALID_PASSWORD), null);
  assert.deepEqual(getPasswordRequirementState(VALID_PASSWORD), {
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
});

test("password policy returns actionable errors for every missing requirement", () => {
  assert.match(validatePasswordField("Aa1!") ?? "", /at least 8/i);
  assert.match(validatePasswordField("audit123!") ?? "", /uppercase/i);
  assert.match(validatePasswordField("AUDIT123!") ?? "", /lowercase/i);
  assert.match(validatePasswordField("AuditPass!") ?? "", /number/i);
  assert.match(validatePasswordField("Audit123") ?? "", /special/i);
  assert.match(validatePasswordField("A".repeat(PASSWORD_MAX_LENGTH + 1)) ?? "", /128/i);
});

test("signup and password confirmation reject mismatches", () => {
  assert.equal(validatePasswordConfirmation(VALID_PASSWORD, ""), "Please confirm your password.");
  assert.equal(validatePasswordConfirmation(VALID_PASSWORD, "Different1!"), "Passwords do not match.");
  assert.equal(validatePasswordConfirmation(VALID_PASSWORD, VALID_PASSWORD), null);
  assert.equal(validateSignup("person@example.com", VALID_PASSWORD, VALID_PASSWORD), null);
  assert.match(validateSignup("person@example.com", "audit123!", "audit123!") ?? "", /uppercase/i);
});

test("signup and reset forms share the live requirements component and block invalid submits", () => {
  const registerPage = readFileSync(new URL("../../app/register/page.tsx", import.meta.url), "utf8");
  const resetPage = readFileSync(new URL("../../app/reset-password/page.tsx", import.meta.url), "utf8");

  for (const page of [registerPage, resetPage]) {
    assert.match(page, /PasswordRequirements/);
    assert.match(page, /validatePasswordField/);
    assert.match(page, /validatePasswordConfirmation/);
    assert.match(page, /disabled=\{loading \|\| !isPasswordFormValid\}|disabled=\{loading \|\| !isFormValid\}/);
  }
});
