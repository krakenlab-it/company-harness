import type { CursorAgentJobType } from "@/lib/types";
import { store } from "@/lib/store/memory-store";
import {
  getVisibleRepos,
  memberHasRepoAccess,
} from "@/lib/auth/permissions";

const CURSOR_PREFIX = /^@cursor\b/i;

const TYPE_PREFIX =
  /^(feature|bugfix|refactor|merge_conflict|issue|pr)\s*:\s*/i;

const VALID_TYPES: CursorAgentJobType[] = [
  "feature",
  "bugfix",
  "refactor",
  "merge_conflict",
  "issue",
  "pr",
];

export interface ParsedCursorCommand {
  type: CursorAgentJobType;
  prompt: string;
  title: string;
}

export function isCursorCommand(text: string): boolean {
  return CURSOR_PREFIX.test(text.trim());
}

export function parseCursorCommand(text: string): ParsedCursorCommand | null {
  const trimmed = text.trim();
  if (!CURSOR_PREFIX.test(trimmed)) return null;

  let rest = trimmed.replace(CURSOR_PREFIX, "").trim();
  if (!rest) return null;

  let type: CursorAgentJobType = "feature";
  const typeMatch = rest.match(TYPE_PREFIX);
  if (typeMatch) {
    const candidate = typeMatch[1]!.toLowerCase() as CursorAgentJobType;
    if (VALID_TYPES.includes(candidate)) {
      type = candidate;
    }
    rest = rest.replace(TYPE_PREFIX, "").trim();
  }

  if (!rest) return null;

  const title =
    rest.length > 80 ? `${rest.slice(0, 77).trim()}…` : rest.trim();

  return { type, prompt: rest, title };
}

function normalizeRepoKey(value: string): string {
  return value
    .replace(/\.git$/, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function reposWithAgentsPermission(memberId: string) {
  return getVisibleRepos(memberId).filter((r) =>
    memberHasRepoAccess(memberId, r.url, "agents"),
  );
}

export function resolveRepoUrlForCursor(
  memberId: string,
  scopedRepo?: string | null,
): { url: string; name: string } | null {
  const eligible = reposWithAgentsPermission(memberId);
  if (eligible.length === 0) return null;

  if (scopedRepo?.trim()) {
    const key = normalizeRepoKey(scopedRepo.trim());
    const match = eligible.find((r) => {
      const urlKey = normalizeRepoKey(r.url);
      const nameKey = r.name.toLowerCase();
      return (
        urlKey === key ||
        urlKey.endsWith(`/${key}`) ||
        nameKey === key ||
        nameKey.endsWith(`/${key.split("/").pop()}`)
      );
    });
    return match ? { url: match.url, name: match.name } : null;
  }

  const first = eligible[0];
  return first ? { url: first.url, name: first.name } : null;
}
