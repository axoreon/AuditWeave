import assert from "node:assert/strict";
import test from "node:test";

import {
  canRenderRoute,
  isPlanAccessExemptPath,
  isPublicPath,
  shouldHideAppShell,
} from "./routes.ts";

test("verify-email remains available before authentication", () => {
  assert.equal(isPublicPath("/verify-email"), true);
});

test("verify-email uses the public authentication layout", () => {
  assert.equal(shouldHideAppShell("/verify-email"), true);
});

test("contact remains available without authentication and uses the public layout", () => {
  assert.equal(isPublicPath("/contact"), true);
  assert.equal(shouldHideAppShell("/contact"), true);
  assert.equal(canRenderRoute("/contact", false, false, true), true);
});

test("protected application routes still require authentication", () => {
  assert.equal(isPublicPath("/dashboard"), false);
  assert.equal(isPublicPath("/history"), false);
  assert.equal(isPublicPath("/audit/new"), false);
  assert.equal(isPublicPath("/account/billing"), false);
  assert.equal(isPublicPath("/account/profile"), false);
});

test("billing remains available before a plan purchase", () => {
  assert.equal(isPlanAccessExemptPath("/account/billing"), true);
  assert.equal(isPlanAccessExemptPath("/dashboard"), false);
});

test("unpaid users cannot render protected route content", () => {
  assert.equal(canRenderRoute("/dashboard", true, false, true), false);
  assert.equal(canRenderRoute("/audit/new", true, false, true), false);
  assert.equal(canRenderRoute("/account/billing", true, false, true), true);
});

test("verified-plan users can render protected route content", () => {
  assert.equal(canRenderRoute("/dashboard", true, true, true), true);
});
