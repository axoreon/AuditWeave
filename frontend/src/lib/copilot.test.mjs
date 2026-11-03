import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCopilotHistory,
  COPILOT_INTRO,
  COPILOT_MAX_HISTORY_MESSAGES,
  COPILOT_MAX_MESSAGE_LENGTH,
  createInitialCopilotMessages,
  getMessagesForAudit,
  parseCopilotMarkdown,
} from "./copilot.ts";

test("first Copilot question has no synthetic history", () => {
  assert.deepEqual(buildCopilotHistory(createInitialCopilotMessages()), []);
});

test("second question receives the prior user and assistant turns", () => {
  const history = buildCopilotHistory([
    ...createInitialCopilotMessages(),
    { sender: "user", text: "What should I do first?" },
    { sender: "copilot", text: "Add a grievance section." },
  ]);
  assert.deepEqual(history, [
    { role: "user", content: "What should I do first?" },
    { role: "assistant", content: "Add a grievance section." },
  ]);
});

test("latest question is not duplicated into its own history", () => {
  const displayed = [
    ...createInitialCopilotMessages(),
    { sender: "user", text: "Earlier question" },
    { sender: "copilot", text: "Earlier answer" },
  ];
  const latest = "LATEST_UNIQUE_QUESTION";
  const history = buildCopilotHistory(displayed);
  assert.equal(history.some((entry) => entry.content === latest), false);
});

test("switching audit IDs clears the prior audit conversation", () => {
  const current = [
    ...createInitialCopilotMessages(),
    { sender: "user", text: "Private audit one question" },
  ];
  const switched = getMessagesForAudit("1", "2", current);
  assert.deepEqual(switched, [
    { sender: "copilot", text: COPILOT_INTRO, intro: true },
  ]);
  assert.equal(getMessagesForAudit("1", "1", current), current);
});

test("history count and individual messages are bounded", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({
    sender: index % 2 ? "copilot" : "user",
    text: `${index}:${"x".repeat(COPILOT_MAX_MESSAGE_LENGTH + 20)}`,
  }));
  const history = buildCopilotHistory(messages);
  assert.equal(history.length, COPILOT_MAX_HISTORY_MESSAGES);
  assert.equal(history[0].content.startsWith("4:"), true);
  assert.equal(
    history.every((entry) => entry.content.length <= COPILOT_MAX_MESSAGE_LENGTH),
    true,
  );
});

test("UI-only errors are not forwarded as assistant history", () => {
  const history = buildCopilotHistory([
    { sender: "user", text: "Question" },
    { sender: "copilot", text: "Service unavailable", error: true },
  ]);
  assert.deepEqual(history, [{ role: "user", content: "Question" }]);
});

test("safe Markdown parser supports headings, bold, lists, paragraphs, and code", () => {
  const blocks = parseCopilotMarkdown(
    "# Next steps\n\nUse **consent** and `opt_in`.\n\n- Add notice\n- Add grievance contact",
  );
  assert.deepEqual(blocks.map((block) => block.kind), [
    "heading",
    "paragraph",
    "list",
  ]);
  assert.equal(blocks[1].content.some((part) => part.kind === "strong"), true);
  assert.equal(blocks[1].content.some((part) => part.kind === "code"), true);
});

test("HTML-looking model output remains plain text", () => {
  const blocks = parseCopilotMarkdown("<script>alert('x')</script>");
  assert.equal(blocks[0].kind, "paragraph");
  assert.equal(blocks[0].content[0].kind, "text");
  assert.equal(blocks[0].content[0].text, "<script>alert('x')</script>");
});
