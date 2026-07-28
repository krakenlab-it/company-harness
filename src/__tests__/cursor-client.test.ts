import { beforeEach, describe, expect, it } from "vitest";
import {
  delegateToCursor,
  isCursorConfigured,
  listAgentJobs,
} from "@/lib/cursor/client";
import { store } from "@/lib/store/memory-store";

describe("Cursor agent client", () => {
  beforeEach(() => {
    store.reset();
    delete process.env.CURSOR_API_KEY;
  });

  it("reports unconfigured without CURSOR_API_KEY", () => {
    expect(isCursorConfigured()).toBe(false);
  });

  it("queues a local simulated job when API key is missing", async () => {
    const before = listAgentJobs().length;

    const job = await delegateToCursor({
      type: "feature",
      title: "Add CRM export",
      prompt: "Implement CSV export for CRM contacts",
      repo: "krakenlab/harness",
    });

    expect(job.id).toBeTruthy();
    expect(job.status).toBe("running");
    expect(job.resultSummary).toMatch(/CURSOR_API_KEY|Simulated/i);
    expect(listAgentJobs().length).toBe(before + 1);
  });
});
