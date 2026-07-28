import type { GitHubActivityKind } from "@/lib/github/activity-types";

/** Non-developer friendly labels for GitHub timeline events. */
export const ACTIVITY_FRIENDLY: Record<
  GitHubActivityKind,
  { label: string; hint: string }
> = {
  commit: {
    label: "Code update",
    hint: "Someone saved a batch of changes with a short description.",
  },
  pr_opened: {
    label: "Change request opened",
    hint: "A pull request (PR) is ready for review before going live.",
  },
  pr_closed: {
    label: "Change request closed",
    hint: "The PR was closed without merging — often superseded or abandoned.",
  },
  pr_merged: {
    label: "Change approved",
    hint: "The PR was merged — the work is now part of the main codebase.",
  },
  workflow_success: {
    label: "Checks passed",
    hint: "Automated tests and quality checks completed successfully.",
  },
  workflow_failure: {
    label: "Checks failed",
    hint: "Automated tests failed — a developer usually needs to fix this.",
  },
  workflow_cancelled: {
    label: "Checks cancelled",
    hint: "An automated run was stopped before it finished.",
  },
  issue_opened: {
    label: "Issue opened",
    hint: "A new bug, task, or discussion was filed on GitHub.",
  },
  issue_closed: {
    label: "Issue closed",
    hint: "An issue was resolved or closed without further action.",
  },
  issue_comment: {
    label: "Comment added",
    hint: "Someone left feedback on an issue — may need a response or fix.",
  },
};
