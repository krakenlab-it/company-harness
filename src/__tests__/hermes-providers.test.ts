import { describe, expect, it } from "vitest";
import {
  extractComposerTags,
  highlightComposerText,
  parseComposerMessage,
} from "@/lib/hermes/composer-tags";
import {
  getDefaultModelForProvider,
  resolveProviderModel,
} from "@/lib/hermes/providers";

describe("composer tags", () => {
  it("detects @cursor and @repo", () => {
    const tags = extractComposerTags(
      "@cursor fix auth @repo krakenlab/harness",
    );
    expect(tags.map((t) => t.kind)).toEqual(["cursor", "repo"]);
    expect(tags[1]?.value).toBe("krakenlab/harness");
  });

  it("detects slash commands", () => {
    const parsed = parseComposerMessage(
      "/ticket tkt_abc /pr 42 /project proj_x",
    );
    expect(parsed.ticketId).toBe("tkt_abc");
    expect(parsed.prNumber).toBe("42");
    expect(parsed.projectId).toBe("proj_x");
  });

  it("highlights tagged segments", () => {
    const segments = highlightComposerText("@cursor hello");
    expect(segments.some((s) => s.kind === "cursor")).toBe(true);
  });
});

describe("Hermes provider catalog", () => {
  it("defaults NVIDIA to GLM 5.2", () => {
    expect(getDefaultModelForProvider("nvidia")).toBe("z-ai/glm-5.2");
  });

  it("resolves invalid model to provider default", () => {
    const resolved = resolveProviderModel("groq", "not-a-model");
    expect(resolved.provider).toBe("groq");
    expect(resolved.model).toBe(getDefaultModelForProvider("groq"));
  });
});
