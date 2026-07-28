import { Topbar } from "@/components/layout/topbar";
import { IntegrationsConsole } from "@/components/integrations/integrations-console";

export default function IntegrationsPage() {
  return (
    <>
      <Topbar
        title="Integrations"
        description="Connect OpenRouter, Trigger.dev, Google, GCP, GitHub, and Resend for live spend, repos, and team invites."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <IntegrationsConsole />
      </div>
    </>
  );
}
