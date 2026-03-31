import { revalidatePath } from "next/cache";

import { readRequiredText } from "@/lib/admin/shared/admin-form-parsers";
import { runAdminAction } from "@/lib/admin/shared/admin-action-helpers";
import { getJobQueueDataMapper } from "@/adapters/RepositoryFactory";
import type { JobRequest, JobStatus } from "@/core/entities/job";
import type { RoleName } from "@/core/entities/user";
import { getAdminJobsDetailPath } from "@/lib/admin/jobs/admin-jobs-routes";
import { canRolesManageGlobalJob } from "@/lib/jobs/job-capability-registry";

// ── Single actions ─────────────────────────────────────────────────────

function ensureGlobalManagePermission(job: JobRequest, roles: readonly RoleName[]) {
  if (!canRolesManageGlobalJob(job.toolName, roles)) {
    throw new Error(`Job ${job.id} is not globally actionable for this role`);
  }
}

function cloneJobForRetry(job: JobRequest) {
  return {
    conversationId: job.conversationId,
    userId: job.userId ?? undefined,
    toolName: job.toolName,
    priority: job.priority,
    dedupeKey: job.dedupeKey ?? undefined,
    initiatorType: job.initiatorType,
    requestPayload: job.requestPayload as Record<string, unknown>,
  };
}

export async function cancelJobAction(formData: FormData) {
  "use server";

  return runAdminAction(formData, async (admin, formData) => {
    const id = readRequiredText(formData, "id");
    const mapper = getJobQueueDataMapper();
    const job = await mapper.findJobById(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    ensureGlobalManagePermission(job, admin.roles);
    if (!CANCELABLE_STATUSES.has(job.status)) {
      throw new Error(`Job ${id} cannot be canceled from status: ${job.status}`);
    }

    const now = new Date().toISOString();
    await mapper.cancelJob(id, now);
    revalidatePath("/admin/jobs");
    revalidatePath(getAdminJobsDetailPath(id));
  });
}

export async function retryJobAction(formData: FormData) {
  "use server";

  return runAdminAction(formData, async (admin, formData) => {
    const id = readRequiredText(formData, "id");
    const mapper = getJobQueueDataMapper();
    const job = await mapper.findJobById(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    ensureGlobalManagePermission(job, admin.roles);

    if (!RETRIABLE_STATUSES.has(job.status)) {
      throw new Error(`Job ${id} cannot be retried from status: ${job.status}`);
    }

    await mapper.createJob(cloneJobForRetry(job));
    revalidatePath("/admin/jobs");
    revalidatePath(getAdminJobsDetailPath(id));
  });
}

// ── Bulk actions ───────────────────────────────────────────────────────

const CANCELABLE_STATUSES = new Set<JobStatus>(["queued", "running"]);
const RETRIABLE_STATUSES = new Set<JobStatus>(["failed", "canceled"]);

export async function bulkCancelJobsAction(formData: FormData) {
  "use server";

  return runAdminAction(formData, async (admin, formData) => {
    const idsRaw = readRequiredText(formData, "ids");
    const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const mapper = getJobQueueDataMapper();
    const now = new Date().toISOString();

    for (const id of ids) {
      const job = await mapper.findJobById(id);
      if (!job) {
        continue;
      }

      ensureGlobalManagePermission(job, admin.roles);

      if (CANCELABLE_STATUSES.has(job.status)) {
        await mapper.cancelJob(id, now);
      }
    }
    revalidatePath("/admin/jobs");
  });
}

export async function bulkRetryJobsAction(formData: FormData) {
  "use server";

  return runAdminAction(formData, async (admin, formData) => {
    const idsRaw = readRequiredText(formData, "ids");
    const ids = idsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const mapper = getJobQueueDataMapper();

    for (const id of ids) {
      const job = await mapper.findJobById(id);
      if (!job) {
        continue;
      }

      ensureGlobalManagePermission(job, admin.roles);

      if (RETRIABLE_STATUSES.has(job.status)) {
        await mapper.createJob(cloneJobForRetry(job));
      }
    }
    revalidatePath("/admin/jobs");
  });
}
