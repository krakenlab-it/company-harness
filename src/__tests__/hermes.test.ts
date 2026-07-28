import { beforeEach, describe, expect, it } from "vitest";
import { buildHarnessContext, isHermesConfigured, runHermes } from "@/lib/hermes/agent";
import { store } from "@/lib/store/memory-store";
import {
  PREFERRED_STACK,
  PREFERRED_STACK_MARKDOWN,
} from "@/lib/guidelines/stack-guidelines";

describe("Hermes agent", () => {
  beforeEach(() => {
    store.reset();
    delete process.env.GROQ_API_KEY;
  });

  it("reports unconfigured without GROQ_API_KEY", () => {
    expect(isHermesConfigured()).toBe(false);
  });

  it("builds harness context from the store", () => {
    const context = buildHarnessContext();
    expect(context).toContain("Harness Snapshot");
    expect(context).toContain("Projects:");
    expect(context).toContain("Provider spend:");
  });

  it("answers offline about projects", async () => {
    const result = await runHermes({
      messages: [{ role: "user", content: "What is project progress?" }],
    });

    expect(result.offline).toBe(true);
    expect(result.text.length).toBeGreaterThan(20);
    expect(result.text.toLowerCase()).toMatch(/project|complete|progress|%|ticket/);
  });

  it("answers offline about costs", async () => {
    const result = await runHermes({
      messages: [{ role: "user", content: "How much are we spending on costs and budget?" }],
    });

    expect(result.offline).toBe(true);
    expect(result.text.toLowerCase()).toMatch(/spend|budget|\$|cost|provider/);
  });

  it("exposes preferred stack guidelines", () => {
    expect(PREFERRED_STACK.sections.length).toBeGreaterThan(5);
    expect(PREFERRED_STACK_MARKDOWN).toContain("Next.js");
    expect(PREFERRED_STACK_MARKDOWN).toContain("Supabase");
    expect(PREFERRED_STACK_MARKDOWN).toContain("Hermes");
  });
});
