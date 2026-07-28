import { Topbar } from "@/components/layout/topbar";
import { StackDashboard } from "@/components/stack/stack-dashboard";

export default function StackPage() {
  return (
    <>
      <Topbar
        title="Stack & Costs"
        description="Dependency health, provider spend, and monthly budget tracking."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <StackDashboard />
      </div>
    </>
  );
}
