import { describe, expect, it } from "vitest";
import {
  extractComposerTags,
  highlightComposerText,
  parseComposerMessage,
} from "@/lib/hermes/composer-tags";
import {
  HERMES_CURATED_MODELS,
  decodeModelChoice,
  encodeModelChoice,
  getDefaultCuratedModel,
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
  it("defaults NVIDIA to GLM 5.2 in curated list", () => {
    const def = getDefaultCuratedModel();
    expect(def.provider).toBe("nvidia");
    expect(def.model).toBe("z-ai/glm-5.2");
  });

  it("has four curated models (2 NVIDIA + 2 Groq)", () => {
    expect(HERMES_CURATED_MODELS).toHaveLength(4);
    expect(HERMES_CURATED_MODELS.filter((m) => m.provider === "nvidia")).toHaveLength(2);
    expect(HERMES_CURATED_MODELS.filter((m) => m.provider === "groq")).toHaveLength(2);
  });

  it("encodes and decodes model choice", () => {
    const key = encodeModelChoice("groq", "openai/gpt-oss-120b");
    expect(decodeModelChoice(key)).toEqual({
      provider: "groq",
      model: "openai/gpt-oss-120b",
    });
  });

  it("resolves invalid model to curated default", () => {
    const resolved = resolveProviderModel("groq", "not-a-model");
    expect(resolved.model).toBe(getDefaultCuratedModel().model);
  });
});
