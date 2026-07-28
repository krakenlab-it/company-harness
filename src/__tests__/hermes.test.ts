import { beforeEach, describe, expect, it } from "vitest";
import { buildHarnessContext, isHermesConfigured, runHermes } from "@/lib/hermes/agent";
import {
  getHermesGroqModel,
  HERMES_DEFAULT_GROQ_MODEL,
} from "@/lib/hermes/config";
import { getHermesConnectionStatus } from "@/lib/hermes/status";
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

  it("defaults to Groq GPT-OSS 120B for versatile tool calling", () => {
    delete process.env.GROQ_MODEL;
    expect(getHermesGroqModel()).toBe(HERMES_DEFAULT_GROQ_MODEL);
    expect(HERMES_DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-120b");
  });

  it("reports connection hint when GROQ_API_KEY is missing", () => {
    delete process.env.GROQ_API_KEY;
    const status = getHermesConnectionStatus();
    expect(status.offline).toBe(true);
    expect(status.hint).toMatch(/NVIDIA_API_KEY|GROQ_API_KEY|\.env\.local/i);
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
