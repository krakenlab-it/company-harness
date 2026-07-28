import { beforeEach, describe, expect, it } from "vitest";
import {
  analyzePackageJson,
  getCostRollup,
  scoreStackHealth,
} from "@/lib/stack/analyzer";
import { store } from "@/lib/store/memory-store";

describe("stack analyzer", () => {
  beforeEach(() => {
    store.reset();
  });

  it("detects core KrakenLab dependencies from package.json", () => {
    const deps = analyzePackageJson({
      dependencies: {
        next: "16.2.12",
        "@supabase/supabase-js": "2.110.9",
        stripe: "17.0.0",
        openai: "4.0.0",
        ai: "7.0.0",
        "@ai-sdk/groq": "4.0.0",
        "@trigger.dev/sdk": "3.0.0",
        resend: "4.0.0",
        ioredis: "5.0.0",
      },
    });

    const names = deps.map((d) => d.name);
    expect(names).toContain("next");
    expect(names).toContain("@supabase/supabase-js");
    expect(names).toContain("stripe");
    expect(names).toContain("ai");
    expect(names).toContain("@trigger.dev/sdk");
    expect(names).toContain("ioredis");
    expect(deps.some((d) => d.critical && d.name === "next")).toBe(true);
  });

  it("rolls up provider costs", () => {
    const rollup = getCostRollup();
    expect(rollup.totalBudgetUsd).toBeGreaterThan(0);
    expect(rollup.totalSpendUsd).toBeGreaterThan(0);
    expect(rollup.byProvider.length).toBeGreaterThan(0);
  });

  it("scores stack health from seeded deps", () => {
    const health = scoreStackHealth();
    expect(health.total).toBeGreaterThan(0);
    expect(health.healthy + health.outdated + health.deprecated + health.unknown).toBe(
      health.total,
    );
  });
});
