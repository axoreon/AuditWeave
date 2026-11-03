import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CONTACT_MESSAGE_MAX_LENGTH,
  validateContactForm,
} from "./contact.ts";

const validForm = {
  name: "Priya Sharma",
  email: "priya@example.com",
  topic: "feedback",
  otherTopic: "",
  message: "I would like help with AuditWeave.",
};

test("contact validation normalizes a valid submission", () => {
  const result = validateContactForm({
    ...validForm,
    name: "  Priya Sharma  ",
    email: "  PRIYA@EXAMPLE.COM ",
    message: "  I would like help with AuditWeave.  ",
  });

  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.normalized, {
    name: validForm.name,
    email: validForm.email,
    topic: validForm.topic,
    message: validForm.message,
  });
});

test("contact validation rejects whitespace, invalid email, short messages, and unknown categories", () => {
  const result = validateContactForm({
    name: "   ",
    email: "not-an-email",
    topic: "not-a-category",
    otherTopic: "",
    message: " short ",
  });

  assert.equal(result.normalized, null);
  assert.match(result.errors.name, /name/i);
  assert.match(result.errors.email, /valid email/i);
  assert.match(result.errors.topic, /valid support category/i);
  assert.match(result.errors.message, /at least 10/i);
});

test("other category requires and normalizes a custom description", () => {
  const missing = validateContactForm({
    ...validForm,
    topic: "other",
    otherTopic: "   ",
  });
  assert.equal(missing.normalized, null);
  assert.match(missing.errors.otherTopic, /request is about/i);

  const valid = validateContactForm({
    ...validForm,
    topic: "other",
    otherTopic: "  Partnership enquiry  ",
  });
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.normalized.other_topic, "Partnership enquiry");
});

test("contact validation rejects oversized messages", () => {
  const result = validateContactForm({
    ...validForm,
    message: "x".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
  });

  assert.equal(result.normalized, null);
  assert.match(result.errors.message, /5000/);
});

test("public contact page keeps native controls and honest submission states", () => {
  const page = readFileSync(new URL("../app/contact/page.tsx", import.meta.url), "utf8");

  assert.match(page, /<PublicNavbar \/>/);
  assert.match(page, /<PublicFooter \/>/);
  assert.match(page, /<select/);
  assert.match(page, /topic === "other"/);
  assert.match(page, /name="other_topic"/);
  assert.match(page, /disabled=\{isSubmitting\}/);
  assert.match(page, /if \(isSubmitting\) return;/);
  assert.match(page, /await submitContactForm/);
  assert.match(page, /if \(!response\.success\)/);
  assert.match(page, /setSubmitted\(true\)/);
  assert.match(page, /Your message has been sent\./);
  assert.ok(page.indexOf('setName("");') < page.indexOf("} catch (submissionError"));
});
