export const COPILOT_MAX_HISTORY_MESSAGES = 10;
export const COPILOT_MAX_MESSAGE_LENGTH = 2000;
export const COPILOT_INTRO =
  "Hello! I am your GRC Copilot. Ask me anything about this audit's findings, specific clauses, or how to resolve them.";

export interface CopilotMessage {
  sender: "user" | "copilot";
  text: string;
  intro?: boolean;
  error?: boolean;
}

export interface CopilotHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export function createInitialCopilotMessages(): CopilotMessage[] {
  return [{ sender: "copilot", text: COPILOT_INTRO, intro: true }];
}

export function buildCopilotHistory(
  messages: CopilotMessage[],
): CopilotHistoryEntry[] {
  return messages
    .filter((message) => !message.intro && !message.error && message.text.trim())
    .map((message) => ({
      role: message.sender === "user" ? "user" as const : "assistant" as const,
      content: message.text.trim().slice(0, COPILOT_MAX_MESSAGE_LENGTH),
    }))
    .slice(-COPILOT_MAX_HISTORY_MESSAGES);
}

export function getMessagesForAudit(
  previousAuditId: string,
  nextAuditId: string,
  currentMessages: CopilotMessage[],
): CopilotMessage[] {
  return previousAuditId === nextAuditId
    ? currentMessages
    : createInitialCopilotMessages();
}

export type CopilotInline =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "code"; text: string };

export type CopilotMarkdownBlock =
  | { kind: "heading"; level: number; content: CopilotInline[] }
  | { kind: "paragraph"; content: CopilotInline[] }
  | { kind: "list"; ordered: boolean; items: CopilotInline[][] };

export function parseCopilotInline(text: string): CopilotInline[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return { kind: "strong" as const, text: part.slice(2, -2) };
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return { kind: "code" as const, text: part.slice(1, -1) };
    }
    return { kind: "text" as const, text: part };
  });
}

export function parseCopilotMarkdown(text: string): CopilotMarkdownBlock[] {
  const blocks: CopilotMarkdownBlock[] = [];
  const paragraph: string[] = [];
  let activeList: { ordered: boolean; items: CopilotInline[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({
        kind: "paragraph",
        content: parseCopilotInline(paragraph.join(" ")),
      });
      paragraph.length = 0;
    }
  };
  const flushList = () => {
    if (activeList) {
      blocks.push({ kind: "list", ...activeList });
      activeList = null;
    }
  };

  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        content: parseCopilotInline(heading[2]),
      });
      continue;
    }

    const unorderedItem = line.match(/^[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);
    const listItem = unorderedItem || orderedItem;
    if (listItem) {
      flushParagraph();
      const ordered = Boolean(orderedItem);
      if (!activeList || activeList.ordered !== ordered) {
        flushList();
        activeList = { ordered, items: [] };
      }
      activeList.items.push(parseCopilotInline(listItem[1]));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
