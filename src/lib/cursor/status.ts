import type { CursorAgentJobStatus } from "@/lib/types";

/** Cursor Cloud Agent v0 API status values */
export type CursorCloudAgentStatus =
  | "CREATING"
  | "RUNNING"
  | "FINISHED"
  | "FAILED"
  | "ERROR"
  | "STOPPED";

export function mapCursorStatusToJobStatus(
  status: string,
): CursorAgentJobStatus {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "CREATING":
    case "RUNNING":
      return "running";
    case "FINISHED":
      return "completed";
    case "FAILED":
    case "ERROR":
      return "failed";
    case "STOPPED":
      return "cancelled";
    default:
      return "running";
  }
}

export function formatCursorStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase();
}
