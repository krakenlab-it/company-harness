import { Sidebar } from "@/components/layout/sidebar";

export default function HarnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-ocean">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-foam focus:text-[var(--canvas)]"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main
        id="main-content"
        className="flex flex-1 flex-col min-w-0 overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
}
