import { createHash } from "crypto";
import type { CursorAgentJobType } from "@/lib/types";

const PROMPT_WRAPPERS: Partial<Record<CursorAgentJobType, string>> = {
  feature:
    "Create a new feature branch and open a new pull request. Do not push directly to main. ",
  bugfix:
    "Fix on a dedicated branch and open a new pull request. Do not push directly to main. ",
  merge_conflict:
    "Resolve merge conflicts on a dedicated branch. Do not force-push. Open a new pull request when done. ",
  refactor:
    "Refactor on a dedicated branch and open a new pull request. ",
  issue:
    "Address this issue on a new branch with a new pull request. ",
  pr:
    "Work on a new branch and open a new pull request. ",
};

export function wrapDelegationPrompt(
  type: CursorAgentJobType,
  prompt: string,
): string {
  const prefix = PROMPT_WRAPPERS[type] ?? PROMPT_WRAPPERS.feature ?? "";
  return `${prefix}${prompt}`;
}

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}
