import type { CopilotInline } from "@/lib/copilot";
import { parseCopilotMarkdown } from "@/lib/copilot";

function InlineContent({ content }: { content: CopilotInline[] }) {
  return content.map((part, index) => {
    if (part.kind === "strong") {
      return <strong key={index} className="font-bold text-brand-deep">{part.text}</strong>;
    }
    if (part.kind === "code") {
      return (
        <code key={index} className="rounded bg-brand-deep/[0.07] px-1 py-0.5 font-mono text-[0.92em] text-brand-deep">
          {part.text}
        </code>
      );
    }
    return <span key={index}>{part.text}</span>;
  });
}

export function CopilotMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 font-sans text-[12px] leading-relaxed">
      {parseCopilotMarkdown(text).map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h4 key={index} className={block.level === 1 ? "text-sm font-extrabold text-brand-deep" : "text-xs font-bold text-brand-deep"}>
              <InlineContent content={block.content} />
            </h4>
          );
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index} className={block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><InlineContent content={item} /></li>
              ))}
            </List>
          );
        }
        return <p key={index}><InlineContent content={block.content} /></p>;
      })}
    </div>
  );
}
