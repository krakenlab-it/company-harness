import { describe, expect, it } from "vitest";
import { buildDemoGitHubActivity } from "@/lib/github/demo-activity";
import {
  ACTIVITY_TABS,
  countEventsByTab,
  filterEventsByTab,
  parseOwnerRepo,
} from "@/lib/github/activity-filters";

describe("activity-filters", () => {
  const feed = buildDemoGitHubActivity("krakenlab/harness", "main");

  it("exposes tab metadata for non-dev labels", () => {
    expect(ACTIVITY_TABS.map((t) => t.id)).toEqual([
      "all",
      "prs",
      "issues",
      "comments",
      "checks",
      "updates",
    ]);
  });

  it("filters PR events only on prs tab", () => {
    const prs = filterEventsByTab(feed.events, "prs");
    expect(prs.every((e) => e.kind.startsWith("pr_"))).toBe(true);
    expect(prs.length).toBeGreaterThan(0);
  });

  it("filters issues and comments separately", () => {
    const issues = filterEventsByTab(feed.events, "issues");
    const comments = filterEventsByTab(feed.events, "comments");
    expect(issues.some((e) => e.kind === "issue_opened")).toBe(true);
    expect(comments.every((e) => e.kind === "issue_comment")).toBe(true);
  });

  it("counts events per tab", () => {
    const counts = countEventsByTab(feed.events);
    expect(counts.all).toBe(feed.events.length);
    expect(counts.prs + counts.issues + counts.comments + counts.checks + counts.updates)
      .toBeLessThanOrEqual(counts.all);
  });

  it("parses owner/repo from full name", () => {
    expect(parseOwnerRepo("krakenlab/harness")).toEqual({
      owner: "krakenlab",
      repo: "harness",
    });
  });
});
