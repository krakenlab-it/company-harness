import { Topbar } from "@/components/layout/topbar";
import { TeamConsole } from "@/components/team/team-console";

export default function TeamPage() {
  return (
    <>
      <Topbar
        title="Team"
        description="Members, repository access controls, and budget alerts."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <TeamConsole />
      </div>
    </>
  );
}
