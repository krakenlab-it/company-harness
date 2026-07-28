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
        description="Intelligence layer — Groq-powered context, tickets, spend, and @cursor delegation."
      />
      <div className="flex-1 overflow-hidden p-3 sm:p-4 bg-[var(--canvas)]">
        <div className="grid h-full gap-4 xl:grid-cols-[1fr_280px]">
          <Suspense fallback={<PageLoader label="Loading Hermes…" />}>
            <HermesChat />
          </Suspense>
          <aside className="hidden xl:block space-y-3 overflow-y-auto max-h-[calc(100dvh-5rem)]">
            <Panel className="bg-[var(--surface)]">
              <h2 className="text-xs font-semibold text-foam mb-2">
                @cursor delegation
              </h2>
              <p className="text-xs text-mist leading-relaxed">
                Admin/lead with repo <strong>agents</strong> permission:
              </p>
              <pre className="mt-2 text-[11px] font-mono text-foam bg-[var(--surface-muted)] rounded-md p-2 whitespace-pre-wrap">
{`@cursor Add health check endpoint
@cursor bugfix: fix login redirect`}
              </pre>
              <p className="text-xs text-mist mt-2 leading-relaxed">
                Scope via <code className="text-foam">?repo=</code> or from a repo page.
              </p>
            </Panel>
            <Panel className="bg-[var(--surface)]">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sand mb-2">
                Capabilities
              </h2>
              <ul className="text-xs text-mist space-y-1.5 leading-relaxed list-disc pl-4">
                <li>Multi-step tools (tickets, repos, spend)</li>
                <li>Markdown replies with lists and code</li>
                <li>Cursor Cloud Agent tracking</li>
                <li>Repo-scoped context from Git graph</li>
              </ul>
            </Panel>
            <Panel className="font-mono text-[11px] bg-[var(--surface-muted)]">
              <p className="text-sand mb-2 uppercase tracking-wider text-[10px]">
                Webhook
              </p>
              <code className="text-foam break-all">POST /api/hermes/webhook</code>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}
