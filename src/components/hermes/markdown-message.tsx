"use client";

import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

/** Lightweight markdown for Hermes replies — bold, code, links, lists, headings. */
export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn("hermes-markdown space-y-2 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

type Block =
  | { type: "p"; text: string }
  | { type: "h"; level: 2 | 3; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      i += 1;
      continue;
    }

    if (/^#{2,3}\s/.test(line)) {
      const level = line.startsWith("###") ? 3 : 2;
      blocks.push({
        type: "h",
        level,
        text: line.replace(/^#{2,3}\s+/, ""),
      });
      i += 1;
      continue;
    }

    if (/^[-*]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const paraLines: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{2,3}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("```")
    ) {
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "p", text: paraLines.join("\n") });
  }

  return blocks;
}

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "h":
      if (block.level === 3) {
        return (
          <h3 key={key} className="text-sm font-semibold text-foam mt-3 first:mt-0">
            <InlineMarkdown text={block.text} />
          </h3>
        );
      }
      return (
        <h2 key={key} className="text-base font-semibold text-foam mt-3 first:mt-0">
          <InlineMarkdown text={block.text} />
        </h2>
      );
    case "ul":
      return (
        <ul key={key} className="list-disc pl-5 space-y-1 text-mist">
          {block.items.map((item, j) => (
            <li key={j}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="list-decimal pl-5 space-y-1 text-mist">
          {block.items.map((item, j) => (
            <li key={j}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-md bg-[var(--surface-muted)] p-3 text-xs font-mono text-foam"
        >
          {block.text}
        </pre>
      );
    case "p":
    default:
      return (
        <p key={key} className="whitespace-pre-wrap text-foam/95">
          <InlineMarkdown text={block.text} />
        </p>
      );
  }
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foam">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded px-1 py-0.5 text-[0.85em] font-mono bg-[var(--surface-muted)] text-teal-bright"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("_") && part.endsWith("_")) {
          return (
            <em key={i} className="italic text-mist">
              {part.slice(1, -1)}
            </em>
          );
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-bright hover:underline"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
