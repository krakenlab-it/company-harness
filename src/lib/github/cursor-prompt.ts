import type { CursorAgentJobType } from "@/lib/types";
import type { GitHubActivityEvent } from "@/lib/github/activity-types";
import { parseOwnerRepo } from "@/lib/github/activity-filters";

export interface CursorDelegationDraft {
  type: CursorAgentJobType;
  title: string;
  prompt: string;
  contextLines: string[];
}

export function inferCursorJobType(event: GitHubActivityEvent): CursorAgentJobType {
  if (
    event.kind === "workflow_failure" ||
    event.kind === "issue_opened" ||
    event.kind === "issue_closed"
  ) {
    return "bugfix";
  }
  if (
    event.kind === "pr_opened" ||
    event.kind === "pr_closed" ||
    event.kind === "pr_merged"
  ) {
    return "pr";
  }
  if (event.kind === "issue_comment") {
    return "issue";
  }
  if (event.kind === "workflow_success") {
    return "feature";
  }
  return "feature";
}

export function buildCursorDelegationDraft(
  event: GitHubActivityEvent,
  repoFullName: string,
  repoUrl: string,
  extraComment?: string,
): CursorDelegationDraft {
  const { owner, repo } = parseOwnerRepo(
    event.repo && event.owner
      ? `${event.owner}/${event.repo}`
      : repoFullName,
  );
  const type = inferCursorJobType(event);

  const contextLines = [
    `Repository: ${owner}/${repo}`,
    `Owner: ${owner}`,
    `Repo URL: ${repoUrl}`,
  ];

  if (event.prNumber) {
    contextLines.push(`Pull Request: #${event.prNumber}`);
  }
  if (event.issueNumber) {
    contextLines.push(`Issue: #${event.issueNumber}`);
  }
  if (event.branch) {
    contextLines.push(`Branch: ${event.branch}`);
  }
  if (event.sha) {
    contextLines.push(`Revision: ${event.sha}`);
  }
  if (event.actor) {
    contextLines.push(`Author: ${event.actor}`);
  }
  if (event.url) {
    contextLines.push(`Link: ${event.url}`);
  }
  if (event.commentPreview) {
    contextLines.push(`Comment: ${event.commentPreview}`);
  }

  const actionVerb =
    event.kind === "workflow_failure"
      ? "Investigate and fix the failing automated checks"
      : event.kind.startsWith("pr_")
        ? "Review and address this pull request"
        : event.kind.startsWith("issue")
          ? "Triage and resolve this issue"
          : event.kind === "commit"
            ? "Follow up on this code change"
            : "Address this item";

  const promptParts = [
    `${actionVerb} for ${owner}/${repo}.`,
    "",
    "GitHub context:",
    ...contextLines.map((l) => `- ${l}`),
    `- Summary: ${event.title}`,
    event.subtitle ? `- Detail: ${event.subtitle}` : null,
    "",
    extraComment?.trim()
      ? `Additional instructions:\n${extraComment.trim()}`
      : "Provide a concise fix or next steps and open a PR if appropriate.",
  ].filter(Boolean);

  const title = event.prNumber
    ? `PR #${event.prNumber}: ${event.title.slice(0, 60)}`
    : event.issueNumber
      ? `Issue #${event.issueNumber}: ${event.title.slice(0, 60)}`
      : event.title.slice(0, 80);

  return {
    type,
    title: title.length > 80 ? `${title.slice(0, 77)}…` : title,
    prompt: promptParts.join("\n"),
    contextLines,
  };
}
