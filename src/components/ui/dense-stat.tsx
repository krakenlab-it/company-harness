import { cn } from "@/lib/utils";

export function DenseStat({
  label,
  value,
  meta,
  className,
  alert,
}: {
  label: string;
  value: string | number;
  meta?: string;
  className?: string;
  alert?: "ok" | "warn" | "danger";
}) {
  return (
    <div className={cn("metric-tile", className)}>
      <div className="metric-tile-label">{label}</div>
      <div
        className={cn(
          "metric-tile-value",
          alert === "warn" && "text-warn",
          alert === "danger" && "text-danger",
          alert === "ok" && "text-ok",
        )}
      >
        {value}
      </div>
      {meta && (
        <div className="text-[10px] text-mist mt-1 font-mono truncate">{meta}</div>
      )}
    </div>
  );
}
