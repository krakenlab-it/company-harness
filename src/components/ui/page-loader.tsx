import { Loader2 } from "lucide-react";

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center py-16 text-mist"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin mr-2 text-teal-bright" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
