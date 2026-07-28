import { Sidebar } from "@/components/layout/sidebar";
import { OpsLoopBar } from "@/components/layout/ops-loop-bar";
import { ContextStrip } from "@/components/layout/context-strip";

export default function HarnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-ocean">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-accent focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main
        id="main-content"
        className="flex flex-1 flex-col min-w-0 overflow-hidden"
      >
        <OpsLoopBar />
        <ContextStrip />
        {children}
      </main>
    </div>
  );
}
