import {
  CircleDot,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  MessageSquare,
  Workflow,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { GitHubActivityKind } from "@/lib/github/activity-types";

export type ActivityTone = "default" | "ok" | "warn" | "danger" | "teal";

export const ACTIVITY_KIND_META: Record<
  GitHubActivityKind,
  { icon: LucideIcon; tone: ActivityTone }
> = {
  commit: { icon: GitCommit, tone: "default" },
  pr_opened: { icon: GitPullRequest, tone: "teal" },
  pr_closed: { icon: GitPullRequestClosed, tone: "warn" },
  pr_merged: { icon: GitMerge, tone: "ok" },
  issue_opened: { icon: CircleDot, tone: "teal" },
  issue_closed: { icon: CircleDot, tone: "warn" },
  issue_comment: { icon: MessageSquare, tone: "default" },
  workflow_success: { icon: Workflow, tone: "ok" },
  workflow_failure: { icon: XCircle, tone: "danger" },
  workflow_cancelled: { icon: Workflow, tone: "warn" },
};
