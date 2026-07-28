import { Sidebar } from "@/components/layout/sidebar";

export default function HarnessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-ocean">
      <Sidebar />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
