import { beforeEach, describe, expect, it } from "vitest";
import {
  isCursorCommand,
  parseCursorCommand,
  resolveRepoUrlForCursor,
} from "@/lib/hermes/cursor-command";
import { mapCursorStatusToJobStatus } from "@/lib/cursor/status";
import { store } from "@/lib/store/memory-store";

describe("Hermes @cursor command", () => {
  beforeEach(() => {
    store.reset();
  });

  it("detects @cursor prefix", () => {
    expect(isCursorCommand("@cursor fix login")).toBe(true);
    expect(isCursorCommand("@CURSOR feature: add export")).toBe(true);
    expect(isCursorCommand("please @cursor fix")).toBe(false);
  });

  it("parses prompt and optional job type", () => {
    expect(parseCursorCommand("@cursor Add README")).toEqual({
      type: "feature",
      prompt: "Add README",
      title: "Add README",
    });

    expect(parseCursorCommand("@cursor merge_conflict: resolve main")).toEqual({
      type: "merge_conflict",
      prompt: "resolve main",
      title: "resolve main",
    });
  });

  it("rejects empty @cursor", () => {
    expect(parseCursorCommand("@cursor")).toBeNull();
    expect(parseCursorCommand("@cursor   ")).toBeNull();
  });

  it("resolves repo for admin with scoped name", () => {
    const repo = resolveRepoUrlForCursor(
      "member_alex",
      "krakenlab/harness",
    );
    expect(repo?.url).toBe("https://github.com/krakenlab/harness");
  });

  it("returns null when member lacks agents permission", () => {
    expect(
      resolveRepoUrlForCursor("member_sam", "krakenlab/harness"),
    ).toBeNull();
  });

  it("maps Cursor cloud statuses to harness job statuses", () => {
    expect(mapCursorStatusToJobStatus("RUNNING")).toBe("running");
    expect(mapCursorStatusToJobStatus("FINISHED")).toBe("completed");
    expect(mapCursorStatusToJobStatus("FAILED")).toBe("failed");
    expect(mapCursorStatusToJobStatus("STOPPED")).toBe("cancelled");
  });
});
