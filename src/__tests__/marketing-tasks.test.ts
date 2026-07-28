import { describe, expect, it } from "vitest";
import {
  MARKETING_TASK_TEMPLATES,
  buildMarketingTaskDraft,
  getMarketingTemplate,
} from "@/lib/marketing/task-templates";

describe("marketing task templates", () => {
  it("includes landing page and UI redesign presets", () => {
    const ids = MARKETING_TASK_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("landing_page");
    expect(ids).toContain("ui_redesign");
  });

  it("builds draft with requester and URL context", () => {
    const draft = buildMarketingTaskDraft({
      category: "landing_page",
      title: "Pulse beta landing",
      targetUrl: "https://krakenlab.media/pulse",
      requesterName: "Alex",
      extraNotes: "Highlight SOC2 readiness",
    });
    expect(draft.title).toBe("Pulse beta landing");
    expect(draft.brief).toContain("Target URL");
    expect(draft.brief).toContain("Alex");
    expect(draft.brief).toContain("SOC2");
    expect(draft.labels).toEqual(
      expect.arrayContaining(["landing-page"]),
    );
  });

  it("falls back to other template", () => {
    const t = getMarketingTemplate("other");
    expect(t.id).toBe("other");
  });
});
