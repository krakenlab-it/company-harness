import { describe, expect, it } from "vitest";
import {
  isMarketingCommand,
  parseMarketingCommand,
} from "@/lib/marketing/marketing-command";

describe("marketing-command", () => {
  it("detects @marketing prefix", () => {
    expect(isMarketingCommand("@marketing Refresh homepage hero")).toBe(true);
    expect(isMarketingCommand("please @marketing help")).toBe(false);
  });

  it("parses category prefix and brief", () => {
    const parsed = parseMarketingCommand(
      "@marketing landing_page: New hero for KrakenLab site",
    );
    expect(parsed?.category).toBe("landing_page");
    expect(parsed?.title).toContain("New hero");
    expect(parsed?.brief).toContain("KrakenLab");
  });

  it("infers ui_redesign from natural language", () => {
    const parsed = parseMarketingCommand(
      "@marketing UI redesign for repo activity feed",
    );
    expect(parsed?.category).toBe("ui_redesign");
  });
});
