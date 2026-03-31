import { beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_USER = {
  id: "admin_1",
  email: "admin@example.com",
  name: "Admin",
  roles: ["ADMIN"],
};

const {
  runAdminActionMock,
  revalidatePathMock,
  cancelJobMock,
  findJobByIdMock,
  createJobMock,
} = vi.hoisted(() => ({
  runAdminActionMock: vi.fn(async (formData: FormData, handler: (user: typeof ADMIN_USER, formData: FormData) => Promise<unknown>) =>
    handler(ADMIN_USER, formData)),
  revalidatePathMock: vi.fn(),
  cancelJobMock: vi.fn(),
  findJobByIdMock: vi.fn(),
  createJobMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/admin/shared/admin-action-helpers", () => ({
  runAdminAction: runAdminActionMock,
}));

vi.mock("@/adapters/RepositoryFactory", () => ({
  getJobQueueDataMapper: () => ({
    cancelJob: cancelJobMock,
    findJobById: findJobByIdMock,
    createJob: createJobMock,
  }),
}));

import {
  bulkCancelJobsAction,
  bulkRetryJobsAction,
  cancelJobAction,
  retryJobAction,
} from "@/lib/admin/jobs/admin-jobs-actions";

function makeFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("admin job actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels a single job and revalidates the admin jobs page", async () => {
    findJobByIdMock.mockResolvedValue({
      id: "job_1",
      toolName: "produce_blog_article",
      status: "running",
    });
    cancelJobMock.mockResolvedValue({ id: "job_1" });

    await cancelJobAction(makeFormData({ id: "job_1" }));

    expect(runAdminActionMock).toHaveBeenCalled();
    expect(findJobByIdMock).toHaveBeenCalledWith("job_1");
    expect(cancelJobMock).toHaveBeenCalledWith("job_1", expect.any(String));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/jobs");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/jobs/job_1");
  });

  it("rejects single-job actions for unregistered global job types", async () => {
    findJobByIdMock.mockResolvedValue({
      id: "job_hidden",
      toolName: "legacy_hidden_tool",
      status: "running",
    });

    await expect(cancelJobAction(makeFormData({ id: "job_hidden" }))).rejects.toThrow(
      "Job job_hidden is not globally actionable for this role",
    );

    expect(cancelJobMock).not.toHaveBeenCalled();
  });

  it("retries a failed job by cloning its request payload", async () => {
    findJobByIdMock.mockResolvedValue({
      id: "job_failed",
      conversationId: "conv_1",
      userId: "usr_1",
      toolName: "produce_blog_article",
      status: "failed",
      priority: 100,
      dedupeKey: "brief_1",
      initiatorType: "user",
      requestPayload: { brief: "Roadmap" },
    });
    createJobMock.mockResolvedValue({ id: "job_retry" });

    await retryJobAction(makeFormData({ id: "job_failed" }));

    expect(findJobByIdMock).toHaveBeenCalledWith("job_failed");
    expect(createJobMock).toHaveBeenCalledWith({
      conversationId: "conv_1",
      userId: "usr_1",
      toolName: "produce_blog_article",
      priority: 100,
      dedupeKey: "brief_1",
      initiatorType: "user",
      requestPayload: { brief: "Roadmap" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/jobs");
  });

  it("rejects retry attempts from non-retriable statuses", async () => {
    findJobByIdMock.mockResolvedValue({
      id: "job_running",
      conversationId: "conv_2",
      userId: "usr_2",
      toolName: "publish_content",
      status: "running",
      priority: 80,
      dedupeKey: null,
      initiatorType: "user",
      requestPayload: { post_id: "post_1" },
    });

    await expect(retryJobAction(makeFormData({ id: "job_running" }))).rejects.toThrow(
      "Job job_running cannot be retried from status: running",
    );
    expect(createJobMock).not.toHaveBeenCalled();
  });

  it("bulk-cancels only queued and running jobs", async () => {
    findJobByIdMock
      .mockResolvedValueOnce({ id: "job_1", toolName: "produce_blog_article", status: "queued" })
      .mockResolvedValueOnce({ id: "job_2", toolName: "publish_content", status: "running" })
      .mockResolvedValueOnce({ id: "job_3", toolName: "publish_content", status: "succeeded" });

    await bulkCancelJobsAction(makeFormData({ ids: "job_1,job_2,job_3" }));

    expect(cancelJobMock).toHaveBeenCalledTimes(2);
    expect(cancelJobMock).toHaveBeenNthCalledWith(1, "job_1", expect.any(String));
    expect(cancelJobMock).toHaveBeenNthCalledWith(2, "job_2", expect.any(String));
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/jobs");
  });

  it("bulk-retries only failed and canceled jobs", async () => {
    findJobByIdMock
      .mockResolvedValueOnce({
        id: "job_4",
        conversationId: "conv_4",
        userId: "usr_4",
        toolName: "produce_blog_article",
        status: "failed",
        priority: 50,
        dedupeKey: null,
        initiatorType: "user",
        requestPayload: { brief: "One" },
      })
      .mockResolvedValueOnce({
        id: "job_5",
        conversationId: "conv_5",
        userId: "usr_5",
        toolName: "publish_content",
        status: "canceled",
        priority: 40,
        dedupeKey: null,
        initiatorType: "user",
        requestPayload: { post_id: "post_5" },
      })
      .mockResolvedValueOnce({
        id: "job_6",
        conversationId: "conv_6",
        userId: "usr_6",
        toolName: "publish_content",
        status: "running",
        priority: 20,
        dedupeKey: null,
        initiatorType: "user",
        requestPayload: { post_id: "post_6" },
      });

    await bulkRetryJobsAction(makeFormData({ ids: "job_4,job_5,job_6" }));

    expect(createJobMock).toHaveBeenCalledTimes(2);
    expect(createJobMock).toHaveBeenNthCalledWith(1, {
      conversationId: "conv_4",
      userId: "usr_4",
      toolName: "produce_blog_article",
      priority: 50,
      dedupeKey: undefined,
      initiatorType: "user",
      requestPayload: { brief: "One" },
    });
    expect(createJobMock).toHaveBeenNthCalledWith(2, {
      conversationId: "conv_5",
      userId: "usr_5",
      toolName: "publish_content",
      priority: 40,
      dedupeKey: undefined,
      initiatorType: "user",
      requestPayload: { post_id: "post_5" },
    });
  });

  it("rejects bulk actions when a selected job is not globally manageable", async () => {
    findJobByIdMock.mockResolvedValue({
      id: "job_hidden",
      toolName: "legacy_hidden_tool",
      status: "failed",
    });

    await expect(bulkRetryJobsAction(makeFormData({ ids: "job_hidden" }))).rejects.toThrow(
      "Job job_hidden is not globally actionable for this role",
    );

    expect(createJobMock).not.toHaveBeenCalled();
  });
});