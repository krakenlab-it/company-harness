import { Suspense } from "react";
import { Topbar } from "@/components/layout/topbar";
import { HermesChat } from "@/components/hermes/chat";
import { Panel } from "@/components/ui/panel";
import { PageLoader } from "@/components/ui/page-loader";

export default function HermesPage() {
  return (
    <>
      <Topbar
        mission="02 · Analyze"
        title="Hermes"
        description="Intelligence layer — query harness context, repos, tickets, and spend. Cannot delegate agents."
      />
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[var(--canvas)]">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<PageLoader label="Loading intel…" />}>
              <HermesChat />
            </Suspense>
          </div>
          <aside className="space-y-3">
            <Panel className="bg-[var(--surface)]">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sand mb-2">
                Webhook feed
              </h2>
              <p className="text-xs text-mist leading-relaxed">
                POST external events to Hermes from Slack, Zapier, or scripts.
              </p>
            </Panel>
            <Panel className="font-mono text-[11px] bg-[var(--surface-muted)]">
              <p className="text-sand mb-2 uppercase tracking-wider text-[10px]">
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
