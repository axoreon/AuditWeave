import assert from "node:assert/strict";
import test from "node:test";

import {
  completeSuccessfulRegistration,
  isRecoverableRegistrationError,
} from "./registration-recovery.ts";
import { getPostLoginPath, getVerifyEmailPath } from "./return-path.ts";

test("successful 201 registration redirects to email verification without logging in", () => {
  const visited = [];
  const path = getVerifyEmailPath("person@example.com", "");

  completeSuccessfulRegistration(
    { requires_verification: true },
    path,
    { assign: (url) => visited.push(url) },
  );

  assert.deepEqual(visited, ["/verify-email?email=person%40example.com"]);
  assert.equal(visited[0].startsWith("/login"), false);
});

test("verification email is safely encoded", () => {
  assert.equal(
    getVerifyEmailPath("person+audit@example.com", ""),
    "/verify-email?email=person%2Baudit%40example.com",
  );
});

test("safe returnTo is preserved", () => {
  assert.equal(
    getVerifyEmailPath("person@example.com", "?returnTo=%2Faccount%2Fbilling"),
    "/verify-email?email=person%40example.com&returnTo=%2Faccount%2Fbilling",
  );
});

test("external returnTo is discarded", () => {
  assert.equal(
    getVerifyEmailPath("person@example.com", "?returnTo=https%3A%2F%2Fevil.example"),
    "/verify-email?email=person%40example.com",
  );
});

test("invalid returnTo is discarded", () => {
  assert.equal(
    getVerifyEmailPath("person@example.com", "?returnTo=%2Fadmin"),
    "/verify-email?email=person%40example.com",
  );
});

test("duplicate registration can offer pending verification recovery", () => {
  const error = Object.assign(new Error("A user with this email is already registered."), {
    status: 409,
  });

  assert.equal(isRecoverableRegistrationError(error), true);
  assert.equal(
    getVerifyEmailPath("person@example.com", ""),
    "/verify-email?email=person%40example.com",
  );
});

test("ordinary registration errors remain ordinary errors", () => {
  const serverError = Object.assign(new Error("Service unavailable."), { status: 503 });

  assert.equal(isRecoverableRegistrationError(serverError), false);
  assert.equal(isRecoverableRegistrationError(new Error("Network error.")), false);
});

test("login sends users without a verified plan to billing", () => {
  assert.equal(getPostLoginPath(false, ""), "/account/billing");
  assert.equal(
    getPostLoginPath(false, "?returnTo=%2Fdashboard"),
    "/account/billing",
  );
});

test("login preserves the normal destination after a verified plan purchase", () => {
  assert.equal(getPostLoginPath(true, ""), "/dashboard");
  assert.equal(
    getPostLoginPath(true, "?returnTo=%2Faccount%2Fbilling"),
    "/account/billing",
  );
});
