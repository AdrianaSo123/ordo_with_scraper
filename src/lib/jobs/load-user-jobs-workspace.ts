import { getJobQueueRepository, getJobStatusQuery } from "@/adapters/RepositoryFactory";
import type { JobHistoryEntry } from "@/lib/jobs/job-event-history";
import { mapJobEventHistory } from "@/lib/jobs/job-event-history";
import type { JobStatusSnapshot } from "@/lib/jobs/job-read-model";
import { sortUserJobSnapshots } from "@/lib/jobs/user-jobs-workspace";

const INITIAL_JOBS_LIMIT = 25;
const JOB_HISTORY_LIMIT = 50;

export interface UserJobsWorkspaceData {
  jobs: JobStatusSnapshot[];
  selectedJobId: string | null;
  selectedJob: JobStatusSnapshot | null;
  selectedJobHistory: JobHistoryEntry[];
}

function normalizeJobId(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mergeSelectedJob(
  jobs: JobStatusSnapshot[],
  selectedJob: JobStatusSnapshot | null,
): JobStatusSnapshot[] {
  if (!selectedJob) {
    return jobs;
  }

  const index = jobs.findIndex((candidate) => candidate.part.jobId === selectedJob.part.jobId);
  if (index === -1) {
    return sortUserJobSnapshots([selectedJob, ...jobs]);
  }

  const next = [...jobs];
  next[index] = selectedJob;
  return sortUserJobSnapshots(next);
}

export async function loadUserJobsWorkspace(
  userId: string,
  requestedJobIdValue?: string | string[],
): Promise<UserJobsWorkspaceData> {
  const jobStatusQuery = getJobStatusQuery();
  const repository = getJobQueueRepository();
  const requestedJobId = normalizeJobId(requestedJobIdValue);

  const [listedJobs, requestedJob] = await Promise.all([
    jobStatusQuery.listUserJobSnapshots(userId, { limit: INITIAL_JOBS_LIMIT }),
    requestedJobId ? jobStatusQuery.getUserJobSnapshot(userId, requestedJobId) : Promise.resolve(null),
  ]);

  const jobs = mergeSelectedJob(sortUserJobSnapshots(listedJobs), requestedJob);
  const selectedJob = requestedJob ?? jobs[0] ?? null;

  if (!selectedJob) {
    return {
      jobs,
      selectedJobId: null,
      selectedJob: null,
      selectedJobHistory: [],
    };
  }

  const selectedJobRecord = await repository.findJobById(selectedJob.part.jobId);
  if (!selectedJobRecord) {
    return {
      jobs,
      selectedJobId: selectedJob.part.jobId,
      selectedJob,
      selectedJobHistory: [],
    };
  }

  const selectedJobEvents = await repository.listEventsForUserJob(userId, selectedJobRecord.id, {
    limit: JOB_HISTORY_LIMIT,
  });

  return {
    jobs,
    selectedJobId: selectedJob.part.jobId,
    selectedJob,
    selectedJobHistory: mapJobEventHistory(selectedJobRecord, selectedJobEvents),
  };
}