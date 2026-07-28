import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { TeamConsole } from "@/components/team/team-console";
import { getSession, canViewNavArea } from "@/lib/auth";

export default async function TeamPage() {
  const session = await getSession();
  if (session && !canViewNavArea(session, "team")) {
    redirect("/");
  }

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
