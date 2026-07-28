import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

const changeColors = {
  positive: "text-ok",
  negative: "text-danger",
  neutral: "text-mist",
};

export function Stat({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-mist" aria-hidden />}
        <span className="text-xs font-medium uppercase tracking-wide text-mist">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-foam tabular-nums">
          {value}
        </span>
        {change && (
          <span className={cn("text-xs font-medium", changeColors[changeType])}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
