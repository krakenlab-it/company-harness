import { redirect } from "next/navigation";
import { MarketingStudio } from "@/components/marketing/marketing-studio";
import {
  getSession,
  canAccessMarketing,
  canRequestMarketingTasks,
} from "@/lib/auth/permissions";
import { store } from "@/lib/store/memory-store";

export default async function MarketingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (!canAccessMarketing(session)) {
    redirect("/");
  }

  const tasks = store.listMarketingTasks();
  const openCount = tasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  ).length;

  return (
    <MarketingStudio
      initialTasks={tasks}
      openCount={openCount}
      canRequest={canRequestMarketingTasks(session)}
      canManage={session.role === "admin" || session.role === "marketing"}
      members={store.listMembers().map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
      }))}
      projects={store.listProjects().map((p) => ({
        id: p.id,
        name: p.name,
      }))}
    />
  );
}
