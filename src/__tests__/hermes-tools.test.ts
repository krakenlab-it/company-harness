import { describe, expect, it, beforeEach } from "vitest";
import { formatHermesReply } from "@/lib/hermes/format-result";
import { createHermesTools } from "@/lib/hermes/tools";
import { store } from "@/lib/store/memory-store";
import { checkHermesRateLimit, resetHermesRateLimits } from "@/lib/hermes/rate-limit";

describe("Hermes tool loop formatting", () => {
  it("builds reply text from tool steps when model text is empty", () => {
    const reply = formatHermesReply({
      text: "",
      steps: [
        {
          toolResults: [
            {
              toolName: "create_ticket",
              output: { id: "tkt_1", title: "Add tests" },
            },
          ],
        },
      ] as never,
    });
    expect(reply).toContain("Add tests");
    expect(reply).toContain("tkt_1");
  });

  it("summarizes create_tickets_for_repos results", () => {
    const reply = formatHermesReply({
      text: "",
      steps: [
        {
          toolResults: [
            {
              toolName: "create_tickets_for_repos",
              output: {
                created: [
                  {
                    repo: "krakenlab/harness",
                    ticket: { id: "a", title: "Add E2E tests" },
                  },
                  {
                    repo: "krakenlab/pulse-analytics",
                    ticket: { id: "b", title: "Add E2E tests" },
                  },
                ],
                count: 2,
              },
            },
          ],
        },
      ] as never,
    });
    expect(reply).toContain("krakenlab/harness");
    expect(reply).toContain("krakenlab/pulse-analytics");
  });
});

describe("create_tickets_for_repos tool", () => {
  beforeEach(() => {
    store.reset();
  });

  it("creates tickets on all visible projects", async () => {
    const tools = createHermesTools({ memberId: "member_alex" });
    const result = await tools.create_tickets_for_repos.execute!(
      {
        title: "Add comprehensive test coverage",
        description: "Unit + integration tests for harness flows",
        priority: "high",
      },
      {} as never,
    );

    expect(result.count).toBe(2);
    expect(result.created).toHaveLength(2);
    expect(store.listTickets().length).toBeGreaterThanOrEqual(2);
  });
});

describe("Hermes rate limit", () => {
  beforeEach(() => resetHermesRateLimits());

  it("blocks after limit exceeded", () => {
    expect(checkHermesRateLimit("member_a", 2).allowed).toBe(true);
    expect(checkHermesRateLimit("member_a", 2).allowed).toBe(true);
    const blocked = checkHermesRateLimit("member_a", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
