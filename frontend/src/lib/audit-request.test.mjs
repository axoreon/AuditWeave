import assert from "node:assert/strict";
import test from "node:test";

import {
  AUDIT_REQUEST_TIMEOUT_MS,
  fetchWithTimeout,
  getAuditProgressPercent,
  getNextPendingAuditStep,
  RequestTimeoutError,
} from "./audit-request.ts";

test("audit requests have a bounded 90 second timeout", () => {
  assert.equal(AUDIT_REQUEST_TIMEOUT_MS, 90_000);
});

test("frontend audit request timeout aborts the request truthfully", async () => {
  const stalledFetch = (_input, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });

  await assert.rejects(
    fetchWithTimeout("https://example.test", {}, 5, stalledFetch),
    RequestTimeoutError,
  );
});

test("pending progress never reaches the success stage or 100 percent", () => {
  let step = 0;
  for (let index = 0; index < 20; index += 1) {
    step = getNextPendingAuditStep(step, 6);
  }
  assert.equal(step, 4);
  assert.equal(getAuditProgressPercent(step, 6, false), 83);
  assert.ok(getAuditProgressPercent(step, 6, false) < 100);
});

test("progress reaches 100 percent only after backend success", () => {
  assert.equal(getAuditProgressPercent(5, 6, false), 90);
  assert.equal(getAuditProgressPercent(5, 6, true), 100);
});

test("an already-aborted caller signal is forwarded", async () => {
  const caller = new AbortController();
  caller.abort();
  const observingFetch = (_input, init) => {
    assert.equal(init.signal.aborted, true);
    return Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
  };

  await assert.rejects(
    fetchWithTimeout("https://example.test", { signal: caller.signal }, 50, observingFetch),
    (error) => error.name === "AbortError" && !(error instanceof RequestTimeoutError),
  );
});
