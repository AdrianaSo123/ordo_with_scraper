import type { JobStatusSnapshot } from "@/lib/jobs/job-read-model";
import type { JobHistoryEntry } from "@/lib/jobs/job-event-history";

export type JobAction = "cancel" | "retry";

export const STATUS_LABELS: Record<JobStatusSnapshot["part"]["status"], string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  canceled: "Canceled",
};

export function getStatusTone(status: JobStatusSnapshot["part"]["status"]): string {
  if (status === "succeeded") {
    return "jobs-status-succeeded";
  }
  if (status === "failed") {
    return "jobs-status-failed";
  }
  if (status === "canceled") {
    return "jobs-status-canceled";
  }
  return status === "queued" || status === "running" ? "jobs-status-active" : "jobs-count-pill";
}

export function getJobAction(status: JobStatusSnapshot["part"]["status"]): { action: JobAction; label: string } | null {
  if (status === "queued" || status === "running") {
    return { action: "cancel", label: "Cancel" };
  }

  if (status === "failed" || status === "canceled") {
    return { action: "retry", label: "Retry" };
  }

  return null;
}

export function formatJobTimestamp(value: string | undefined): string {
  if (!value) {
    return "Updated recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatJobSummary(snapshot: JobStatusSnapshot): string {
  if (snapshot.part.error) {
    return snapshot.part.error;
  }

  if (snapshot.part.summary) {
    return snapshot.part.summary;
  }

  if (snapshot.part.progressLabel) {
    return snapshot.part.progressPercent != null
      ? `${snapshot.part.progressLabel} (${Math.round(snapshot.part.progressPercent)}%)`
      : snapshot.part.progressLabel;
  }

  return "Waiting for the next job update.";
}

export function formatJobHistoryEntry(entry: JobHistoryEntry): string {
  if (entry.part.error) {
    return entry.part.error;
  }

  if (entry.part.summary) {
    return entry.part.summary;
  }

  if (entry.part.progressLabel) {
    return entry.part.progressPercent != null
      ? `${entry.part.progressLabel} (${Math.round(entry.part.progressPercent)}%)`
      : entry.part.progressLabel;
  }

  return `${STATUS_LABELS[entry.part.status]} event captured.`;
}