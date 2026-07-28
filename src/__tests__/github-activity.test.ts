import { describe, expect, it } from "vitest";
import { parseGitHubRepoUrl } from "@/lib/github/parse-repo-url";
import { buildDemoGitHubActivity } from "@/lib/github/demo-activity";
import { mergeAndSortActivityEvents } from "@/lib/github/activity";

describe("parseGitHubRepoUrl", () => {
  it("parses https URLs", () => {
    expect(parseGitHubRepoUrl("https://github.com/krakenlab/harness")).toEqual({
      owner: "krakenlab",
      repo: "harness",
    });
  });

  it("parses ssh-style URLs", () => {
    expect(parseGitHubRepoUrl("git@github.com:krakenlab/pulse.git")).toEqual({
      owner: "krakenlab",
      repo: "pulse",
    });
  });

  it("returns null for non-GitHub URLs", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/foo/bar")).toBeNull();
  });
});

describe("GitHub activity feed", () => {
  it("builds demo timeline with PR and workflow events", () => {
    const feed = buildDemoGitHubActivity("krakenlab/harness", "main");
    expect(feed.source).toBe("demo");
    expect(feed.events.some((e) => e.kind === "pr_merged")).toBe(true);
    expect(feed.events.some((e) => e.kind === "workflow_failure")).toBe(true);
    expect(feed.events.some((e) => e.kind === "workflow_success")).toBe(true);
    expect(feed.events.some((e) => e.kind === "issue_opened")).toBe(true);
    expect(feed.events.some((e) => e.kind === "issue_comment")).toBe(true);
    expect(feed.events.every((e) => e.owner && e.repo)).toBe(true);
  });

  it("sorts events newest first", () => {
    const sorted = mergeAndSortActivityEvents([
      {
        id: "a",
        kind: "commit",
        title: "old",
        occurredAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "b",
        kind: "commit",
        title: "new",
        occurredAt: "2026-07-01T00:00:00Z",
      },
    ]);
    expect(sorted[0].title).toBe("new");
  });
});
