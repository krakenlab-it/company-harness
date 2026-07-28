import type {
  GitHubActivityEvent,
  GitHubActivityKind,
  GitHubActivityTab,
} from "@/lib/github/activity-types";

const TAB_KINDS: Record<Exclude<GitHubActivityTab, "all">, GitHubActivityKind[]> = {
  prs: ["pr_opened", "pr_closed", "pr_merged"],
  issues: ["issue_opened", "issue_closed"],
  comments: ["issue_comment"],
  checks: ["workflow_success", "workflow_failure", "workflow_cancelled"],
  updates: ["commit"],
};

export const ACTIVITY_TABS: Array<{
  id: GitHubActivityTab;
  label: string;
  hint: string;
}> = [
  { id: "all", label: "All", hint: "Everything in one feed" },
  { id: "prs", label: "Change requests", hint: "Pull requests — proposed changes awaiting review" },
  { id: "issues", label: "Issues", hint: "Tracked bugs, tasks, and discussions" },
  { id: "comments", label: "Comments", hint: "Recent comments on issues" },
  { id: "checks", label: "Automated checks", hint: "CI / test results from GitHub Actions" },
  { id: "updates", label: "Code updates", hint: "Commits — saved batches of work" },
];

export function filterEventsByTab(
  events: GitHubActivityEvent[],
  tab: GitHubActivityTab,
): GitHubActivityEvent[] {
  if (tab === "all") return events;
  const allowed = new Set(TAB_KINDS[tab]);
  return events.filter((e) => allowed.has(e.kind));
}

export function countEventsByTab(
  events: GitHubActivityEvent[],
): Record<GitHubActivityTab, number> {
  return {
    all: events.length,
    prs: filterEventsByTab(events, "prs").length,
    issues: filterEventsByTab(events, "issues").length,
    comments: filterEventsByTab(events, "comments").length,
    checks: filterEventsByTab(events, "checks").length,
    updates: filterEventsByTab(events, "updates").length,
  };
}

export function parseOwnerRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.includes("/")
    ? fullName.split("/")
    : ["unknown", fullName];
  return { owner: owner ?? "unknown", repo: repo ?? fullName };
}
