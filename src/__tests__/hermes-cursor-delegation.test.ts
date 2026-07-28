import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/lib/store/memory-store";
import { getSession } from "@/lib/auth/permissions";
import { handleHermesCursorCommand } from "@/lib/hermes/handle-cursor-delegation";

describe("Hermes @cursor delegation", () => {
  beforeEach(() => {
    store.reset();
    process.env.HARNESS_DEMO_MODE = "true";
    delete process.env.CURSOR_API_KEY;
  });

  it("delegates for admin with scoped repo", async () => {
    const session = await getSession();
    expect(session).not.toBeNull();

    const result = await handleHermesCursorCommand(
      session!,
      "@cursor Add health check endpoint",
      "krakenlab/harness",
    );

    expect(result.job).toBeDefined();
    expect(result.job?.status).toBe("running");
    expect(result.text).toContain("Cursor Cloud Agent");

    const messages = store.listHermesMessages();
    expect(messages.some((m) => m.contextType === "agent_job")).toBe(true);
  });

  it("rejects viewers without delegate role", async () => {
    const sam = store.getMember("member_sam");
    expect(sam).toBeDefined();

    const result = await handleHermesCursorCommand(
      {
        authUserId: null,
        memberId: sam!.id,
        email: sam!.email,
        name: sam!.name,
        role: sam!.role,
        member: sam!,
      },
      "@cursor Do something",
      "krakenlab/harness",
    );

    expect(result.error).toBe("forbidden_role");
    expect(result.job).toBeUndefined();
  });
});
