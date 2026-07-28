import { cn } from "@/lib/utils";

export function DenseStat({
  label,
  value,
  meta,
  className,
}: {
  label: string;
  value: string | number;
  meta?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-2 border border-[var(--border)] rounded-lg px-3 py-2.5 bg-[var(--canvas)]",
        className,
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-mist shrink-0">
        {label}
      </span>
      <span className="font-display font-semibold text-foam text-sm tabular-nums tracking-tight">
        {value}
      </span>
      {meta && (
        <span className="text-[10px] text-mist ml-auto truncate">{meta}</span>
      )}
    </div>
  );
}
