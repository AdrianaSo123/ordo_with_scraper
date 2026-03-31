import {
  getBlogAssetRepository,
  getBlogPostRepository,
  getBlogPostRevisionRepository,
  getJobQueueRepository,
  getJobStatusQuery,
} from "@/adapters/RepositoryFactory";
import {
  executeDraftContent,
  executePublishContent,
  parseDraftContentInput,
  parsePublishContentInput,
} from "@/core/use-cases/tools/admin-content.tool";
import {
  executeGenerateBlogImage,
  parseGenerateBlogImageInput,
} from "@/core/use-cases/tools/blog-image.tool";
import {
  executeComposeBlogArticle,
  executeGenerateBlogImagePrompt,
  executeProduceBlogArticle,
  executeQaBlogArticle,
  executeResolveBlogArticleQa,
  parseComposeBlogArticleInput,
  parseGenerateBlogImagePromptInput,
  parseProduceBlogArticleInput,
  parseQaBlogArticleInput,
  parseResolveBlogArticleQaInput,
} from "@/core/use-cases/tools/blog-production.tool";
import {
  parsePrepareJournalPostForPublishInput,
  PrepareJournalPostForPublishInteractor,
} from "@/core/use-cases/tools/journal-write.tool";
import { getBlogArticleProductionService, getBlogImageGenerationService } from "@/lib/blog/blog-production-root";
import type { DeferredJobHandler } from "@/lib/jobs/deferred-job-worker";

export const DEFERRED_JOB_HANDLER_NAMES = [
  "draft_content",
  "publish_content",
  "prepare_journal_post_for_publish",
  "generate_blog_image",
  "compose_blog_article",
  "qa_blog_article",
  "resolve_blog_article_qa",
  "generate_blog_image_prompt",
  "produce_blog_article",
] as const;

export type DeferredJobHandlerName = (typeof DEFERRED_JOB_HANDLER_NAMES)[number];

export function getDeferredJobRepository() {
  return getJobQueueRepository();
}

export function createDeferredJobHandlers(): Record<DeferredJobHandlerName, DeferredJobHandler> {
  const blogRepo = getBlogPostRepository();
  const blogAssetRepo = getBlogAssetRepository();
  const blogRevisionRepo = getBlogPostRevisionRepository();
  const blogImageService = getBlogImageGenerationService();
  const blogArticleService = getBlogArticleProductionService();
  const jobStatusQuery = getJobStatusQuery();
  const prepareJournalPostForPublishInteractor = new PrepareJournalPostForPublishInteractor(
    blogRepo,
    blogRevisionRepo,
    jobStatusQuery,
    blogArticleService,
  );

  return {
    draft_content: async (job) => executeDraftContent(
      blogRepo,
      parseDraftContentInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
    ),
    publish_content: async (job) => executePublishContent(
      blogRepo,
      parsePublishContentInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
      blogAssetRepo,
    ),
    prepare_journal_post_for_publish: async (job) => prepareJournalPostForPublishInteractor.execute(
      parsePrepareJournalPostForPublishInput(job.requestPayload),
      job.userId ?? "unknown",
    ),
    generate_blog_image: async (job) => executeGenerateBlogImage(
      blogImageService,
      parseGenerateBlogImageInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
    ),
    compose_blog_article: async (job) => executeComposeBlogArticle(
      blogArticleService,
      parseComposeBlogArticleInput(job.requestPayload),
    ),
    qa_blog_article: async (job) => executeQaBlogArticle(
      blogArticleService,
      parseQaBlogArticleInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
    ),
    resolve_blog_article_qa: async (job) => executeResolveBlogArticleQa(
      blogArticleService,
      parseResolveBlogArticleQaInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
    ),
    generate_blog_image_prompt: async (job) => executeGenerateBlogImagePrompt(
      blogArticleService,
      parseGenerateBlogImagePromptInput(job.requestPayload),
    ),
    produce_blog_article: async (job, handlerContext) => executeProduceBlogArticle(
      blogArticleService,
      parseProduceBlogArticleInput(job.requestPayload),
      {
        userId: job.userId ?? "unknown",
        role: "ADMIN",
        conversationId: job.conversationId,
      },
      (progressLabel, progressPercent) => handlerContext.reportProgress({
        progressLabel,
        progressPercent,
      }),
    ),
  };
}