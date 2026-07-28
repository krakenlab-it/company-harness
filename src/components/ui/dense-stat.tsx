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
        "flex items-baseline gap-2 border border-[rgba(122,154,171,0.15)] rounded-md px-3 py-2 bg-ocean-subtle/50",
        className,
      )}
    >
      <span className="text-[11px] uppercase tracking-wide text-mist shrink-0">
        {label}
      </span>
      <span className="font-display font-semibold text-foam text-sm tabular-nums">
        {value}
      </span>
      {meta && (
        <span className="text-[10px] text-mist ml-auto truncate">{meta}</span>
      )}
    </div>
  );
}
