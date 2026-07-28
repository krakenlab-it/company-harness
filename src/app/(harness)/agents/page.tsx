import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { AgentConsole } from "@/components/agents/agent-console";
import { PageLoader } from "@/components/ui/page-loader";

export default function AgentsPage() {
  return (
    <>
      <Topbar
        mission="03 · Act"
        title="Mission Control"
        description="Delegate Cursor agents. Admin/lead only. Always-new-PR policy enforced."
      />
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[var(--canvas)]">
        <Suspense fallback={<PageLoader label="Loading missions…" />}>
          <AgentConsole />
        </Suspense>
      </div>
    </>
  );
}
