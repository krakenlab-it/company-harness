import { Topbar } from "@/components/layout/topbar";
import { AgentConsole } from "@/components/agents/agent-console";

export default function AgentsPage() {
  return (
    <>
      <Topbar
        title="Cursor Agents"
        description="Delegate coding tasks to Cursor cloud agents and track job status."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AgentConsole />
      </div>
    </>
  );
}
