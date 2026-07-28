"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface GanttTicket {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  labels: string[];
}

export interface GanttSprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-mist/30",
  todo: "bg-teal/40",
  in_progress: "bg-teal-bright/60",
  review: "bg-warn/50",
  done: "bg-ok/50",
};

function parseDate(iso?: string, fallback?: string): number {
  const d = new Date(iso ?? fallback ?? Date.now());
  return d.getTime();
}

export function FeatureGantt({
  sprints,
  tickets,
  className,
}: {
  sprints: GanttSprint[];
  tickets: GanttTicket[];
  className?: string;
}) {
  const { rangeStart, rangeEnd, rows } = useMemo(() => {
    const allDates = [
      ...sprints.flatMap((s) => [s.startDate, s.endDate]),
      ...tickets.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[]),
    ];
    const times = allDates.map((d) => parseDate(d));
    const start = Math.min(...times, Date.now());
    const end = Math.max(...times, start + 7 * 86400000);
    const span = end - start || 1;

    const sprintRows = sprints.map((s) => ({
      id: s.id,
      label: s.name,
      kind: "sprint" as const,
      left: ((parseDate(s.startDate) - start) / span) * 100,
      width: ((parseDate(s.endDate) - parseDate(s.startDate)) / span) * 100,
      status: "sprint",
    }));

    const ticketRows = tickets.map((t) => {
      const tStart = parseDate(t.startDate, t.dueDate);
      const tEnd = parseDate(t.dueDate, t.startDate);
      const left = ((Math.min(tStart, tEnd) - start) / span) * 100;
      const width = Math.max(((Math.abs(tEnd - tStart) || 86400000) / span) * 100, 2);
      return {
        id: t.id,
        label: t.title,
        kind: "ticket" as const,
        left,
        width,
        status: t.status,
      };
    });

    return {
      rangeStart: new Date(start).toISOString().slice(0, 10),
      rangeEnd: new Date(end).toISOString().slice(0, 10),
      rows: [...sprintRows, ...ticketRows],
    };
  }, [sprints, tickets]);

  if (rows.length === 0) {
    return (
      <p className={cn("text-xs text-mist", className)}>
        No sprints or dated tickets for timeline view.
      </p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-[10px] text-mist font-mono px-1">
        <span>{rangeStart}</span>
        <span>{rangeEnd}</span>
      </div>
      <div className="border border-[rgba(122,154,171,0.15)] rounded-md overflow-hidden">
        {rows.map((row) => (
          <div
            key={`${row.kind}-${row.id}`}
            className="flex items-center h-6 border-b border-[rgba(122,154,171,0.08)] last:border-0"
          >
            <div
              className="w-32 shrink-0 truncate px-2 text-[10px] text-mist"
              title={row.label}
            >
              {row.kind === "sprint" ? "◆ " : "▸ "}
              {row.label}
            </div>
            <div className="relative flex-1 h-full bg-ocean/30">
              <div
                className={cn(
                  "absolute top-1 bottom-1 rounded-sm min-w-[2px]",
                  row.kind === "sprint"
                    ? "bg-teal/25 border border-teal/40"
                    : STATUS_COLORS[row.status] ?? "bg-mist/30",
                )}
                style={{
                  left: `${row.left}%`,
                  width: `${row.width}%`,
                }}
                title={row.label}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
