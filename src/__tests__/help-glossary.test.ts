import { describe, expect, it } from "vitest";
import { GLOSSARY } from "@/lib/help/glossary";
import { ACTIVITY_FRIENDLY } from "@/lib/github/activity-labels";

describe("help glossary", () => {
  it("defines plain-language entries for key GitHub concepts", () => {
    expect(GLOSSARY.pullRequest.short.toLowerCase()).toContain("review");
    expect(GLOSSARY.github.short.length).toBeGreaterThan(10);
    expect(GLOSSARY.stackScan.detail).toMatch(/package/i);
  });
});

describe("activity friendly labels", () => {
  it("uses non-jargon labels for PR events", () => {
    expect(ACTIVITY_FRIENDLY.pr_opened.label).not.toMatch(/^PR /);
    expect(ACTIVITY_FRIENDLY.pr_merged.hint.toLowerCase()).toContain("merged");
  });
});
