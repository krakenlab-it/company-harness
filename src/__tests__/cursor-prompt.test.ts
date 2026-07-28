import { describe, expect, it } from "vitest";
import { buildDemoGitHubActivity } from "@/lib/github/demo-activity";
import {
  buildCursorDelegationDraft,
  inferCursorJobType,
} from "@/lib/github/cursor-prompt";

describe("cursor-prompt", () => {
  const feed = buildDemoGitHubActivity("krakenlab/harness", "main");
  const repoUrl = "https://github.com/krakenlab/harness";

  it("infers bugfix for failed checks and issues", () => {
    const failed = feed.events.find((e) => e.kind === "workflow_failure")!;
    const issue = feed.events.find((e) => e.kind === "issue_opened")!;
    expect(inferCursorJobType(failed)).toBe("bugfix");
    expect(inferCursorJobType(issue)).toBe("bugfix");
  });

  it("infers pr type for pull request events", () => {
    const pr = feed.events.find((e) => e.kind === "pr_opened")!;
    expect(inferCursorJobType(pr)).toBe("pr");
  });

  it("builds draft with repo owner and PR/issue numbers", () => {
    const pr = feed.events.find((e) => e.prNumber != null)!;
    const draft = buildCursorDelegationDraft(
      pr,
      "krakenlab/harness",
      repoUrl,
    );

    expect(draft.type).toBe("pr");
    expect(draft.contextLines.some((l) => l.includes("Repository: krakenlab/harness"))).toBe(
      true,
    );
    expect(draft.contextLines.some((l) => l.includes(`Pull Request: #${pr.prNumber}`))).toBe(
      true,
    );
    expect(draft.prompt).toContain("GitHub context:");
    expect(draft.title).toContain(`PR #${pr.prNumber}`);
  });

  it("includes extra comment in prompt when provided", () => {
    const comment = feed.events.find((e) => e.kind === "issue_comment")!;
    const draft = buildCursorDelegationDraft(
      comment,
      "krakenlab/harness",
      repoUrl,
      "Please patch Safari CSP only.",
    );
    expect(draft.prompt).toContain("Please patch Safari CSP only.");
    expect(draft.type).toBe("issue");
  });
});
