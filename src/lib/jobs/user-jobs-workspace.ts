import type { JobStatusSnapshot } from "@/lib/jobs/job-read-model";

export function isActiveUserJobStatus(status: JobStatusSnapshot["part"]["status"]): boolean {
  return status === "queued" || status === "running";
}

export function getUserJobSnapshotTimestamp(snapshot: JobStatusSnapshot): number {
  const value = snapshot.part.updatedAt;
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function sortUserJobSnapshots(snapshots: JobStatusSnapshot[]): JobStatusSnapshot[] {
  return [...snapshots].sort((left, right) => {
    const activeDelta = Number(isActiveUserJobStatus(right.part.status)) - Number(isActiveUserJobStatus(left.part.status));
    if (activeDelta !== 0) {
      return activeDelta;
    }

    return getUserJobSnapshotTimestamp(right) - getUserJobSnapshotTimestamp(left);
  });
}