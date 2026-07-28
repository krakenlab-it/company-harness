export type ComposerTagKind =
  | "cursor"
  | "marketing"
  | "repo"
  | "ticket"
  | "pr"
  | "project";

export interface ComposerTag {
  kind: ComposerTagKind;
  raw: string;
  value: string;
  label: string;
  start: number;
  end: number;
}

export interface ComposerHighlightSegment {
  text: string;
  kind?: ComposerTagKind | "mention";
}

export interface ParsedComposerMessage {
  tags: ComposerTag[];
  scopedRepo?: string;
  ticketId?: string;
  prNumber?: string;
  projectId?: string;
}

const TAG_PATTERNS: Array<{
  kind: ComposerTagKind;
  regex: RegExp;
  valueGroup: number;
  label: (value: string) => string;
}> = [
  {
    kind: "cursor",
    regex: /@cursor\b/gi,
    valueGroup: 0,
    label: () => "Cursor agent",
  },
  {
    kind: "marketing",
    regex: /@marketing\b/gi,
    valueGroup: 0,
    label: () => "Marketing team",
  },
  {
    kind: "repo",
    regex: /@repo(?::|\s+)([\w.-]+\/[\w.-]+|[\w.-]+)/gi,
    valueGroup: 1,
    label: (v) => `Repo · ${v}`,
  },
  {
    kind: "ticket",
    regex: /\/ticket(?::|\s+)(tkt_[\w-]+|[^\s]+)/gi,
    valueGroup: 1,
    label: (v) => `Ticket · ${v}`,
  },
  {
    kind: "pr",
    regex: /\/pr(?::|\s+)(\d+)/gi,
    valueGroup: 1,
    label: (v) => `PR #${v}`,
  },
  {
    kind: "project",
    regex: /\/project(?::|\s+)(proj_[\w-]+|[^\s]+)/gi,
    valueGroup: 1,
    label: (v) => `Project · ${v}`,
  },
];

export function extractComposerTags(text: string): ComposerTag[] {
  const tags: ComposerTag[] = [];

  for (const pattern of TAG_PATTERNS) {
    const re = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const value =
        pattern.valueGroup > 0
          ? (match[pattern.valueGroup] ?? match[0])
          : match[0];
      tags.push({
        kind: pattern.kind,
        raw: match[0],
        value: value.trim(),
        label: pattern.label(value.trim()),
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return tags.sort((a, b) => a.start - b.start);
}

export function parseComposerMessage(text: string): ParsedComposerMessage {
  const tags = extractComposerTags(text);
  const repoTag = tags.find((t) => t.kind === "repo");
  const ticketTag = tags.find((t) => t.kind === "ticket");
  const prTag = tags.find((t) => t.kind === "pr");
  const projectTag = tags.find((t) => t.kind === "project");

  return {
    tags,
    scopedRepo: repoTag?.value,
    ticketId: ticketTag?.value.startsWith("tkt_")
      ? ticketTag.value
      : undefined,
    prNumber: prTag?.value,
    projectId: projectTag?.value.startsWith("proj_")
      ? projectTag.value
      : undefined,
  };
}

/** Split composer text into plain + tagged segments for syntax highlighting. */
export function highlightComposerText(text: string): ComposerHighlightSegment[] {
  const tags = extractComposerTags(text);
  if (tags.length === 0) {
    return [{ text }];
  }

  const segments: ComposerHighlightSegment[] = [];
  let cursor = 0;

  for (const tag of tags) {
    if (tag.start > cursor) {
      segments.push({ text: text.slice(cursor, tag.start) });
    }
    segments.push({
      text: text.slice(tag.start, tag.end),
      kind: tag.kind,
    });
    cursor = tag.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

export const COMPOSER_TAG_HELP = [
  { token: "@cursor", desc: "Delegate to Cursor Cloud Agent (admin/lead)" },
  { token: "@marketing", desc: "Send creative work to the marketing team" },
  { token: "@repo org/name", desc: "Scope to a repository" },
  { token: "/ticket tkt_…", desc: "Link a harness ticket" },
  { token: "/pr 42", desc: "Reference a pull request" },
  { token: "/project proj_…", desc: "Scope to a project" },
] as const;
