import { Topbar } from "@/components/layout/topbar";
import { Panel } from "@/components/ui/panel";
import { PREFERRED_STACK } from "@/lib/guidelines/stack-guidelines";

export default function GuidelinesPage() {
  return (
    <>
      <Topbar
        title="Preferred Stack"
        description={`KrakenLab Media engineering guidelines — v${PREFERRED_STACK.version}`}
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 animate-fade-up">
        <div className="grid gap-4 sm:grid-cols-2">
          {PREFERRED_STACK.sections.map((section) => (
            <Panel key={section.id} className="h-full">
              <h2 className="font-display text-base font-semibold text-foam">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-mist leading-relaxed">
                {section.summary}
              </p>
              <ul className="mt-4 space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-foam/90"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-bright" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-mist">
            Full guidelines (Markdown)
          </h2>
          <Panel>
            <article className="prose-harness text-sm text-foam/90 leading-relaxed whitespace-pre-wrap">
              {PREFERRED_STACK.markdown}
            </article>
          </Panel>
        </section>
      </div>
    </>
  );
}
