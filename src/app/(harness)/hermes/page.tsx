import { Topbar } from "@/components/layout/topbar";
import { HermesChat } from "@/components/hermes/chat";
import { Panel } from "@/components/ui/panel";

export default function HermesPage() {
  return (
    <>
      <Topbar
        title="Hermes"
        description="KrakenLab's AI operations assistant — in-app chat and webhook integrations."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HermesChat />
          </div>
          <aside className="space-y-4 animate-fade-up">
            <Panel>
              <h2 className="font-display text-sm font-semibold text-foam">
                Webhook channel
              </h2>
              <p className="mt-2 text-sm text-mist leading-relaxed">
                Connect Slack, Zapier, or any HTTP client to Hermes with a simple
                POST request. Ideal for slash commands, automations, or scripts.
              </p>
            </Panel>
            <Panel className="font-mono text-xs">
              <p className="text-mist mb-2 uppercase tracking-wide text-[0.65rem]">
                Endpoint
              </p>
              <code className="text-foam break-all">
                POST /api/hermes/webhook
              </code>
              <p className="text-mist mt-4 mb-2 uppercase tracking-wide text-[0.65rem]">
                Body (JSON)
              </p>
              <pre className="text-foam/80 whitespace-pre-wrap leading-relaxed">
{`{
  "text": "Summarize active projects",
  "secret": "optional-if-HERMES_WEBHOOK_SECRET-set"
}`}
              </pre>
              <p className="text-mist mt-4 mb-2 uppercase tracking-wide text-[0.65rem]">
                Response
              </p>
              <pre className="text-foam/90 whitespace-pre-wrap">
{`{ "reply": "..." }`}
              </pre>
            </Panel>
            <Panel>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-mist">
                Authentication
              </h3>
              <p className="mt-2 text-sm text-mist leading-relaxed">
                If <code className="text-foam font-medium">HERMES_WEBHOOK_SECRET</code> is
                set in your environment, include it as{" "}
                <code className="text-foam font-medium">secret</code> in the JSON body or
                as <code className="text-foam font-medium">Authorization: Bearer &lt;secret&gt;</code>.
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
