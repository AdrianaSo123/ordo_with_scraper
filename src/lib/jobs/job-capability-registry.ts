import type { RoleName } from "@/core/entities/user";
import {
  type DeferredJobHandlerName,
} from "@/lib/jobs/deferred-job-handlers";

export type JobSurface = "self" | "global";
export type JobFamily = "editorial" | "content" | "workflow" | "training" | "system" | "other";

export interface JobCapabilityDefinition {
  toolName: DeferredJobHandlerName;
  family: JobFamily;
  label: string;
  description: string;
  initiatorRoles: readonly RoleName[];
  ownerViewerRoles: readonly RoleName[];
  ownerActionRoles: readonly RoleName[];
  globalViewerRoles: readonly RoleName[];
  globalActionRoles: readonly RoleName[];
  defaultSurface: JobSurface;
}

export interface JobCapabilityPresentation {
  toolName: DeferredJobHandlerName;
  label: string;
  family: JobFamily;
  defaultSurface: JobSurface;
}

export const CURRENT_SIGNED_IN_JOB_AUDIENCE_ROLES = [
  "AUTHENTICATED",
  "APPRENTICE",
  "STAFF",
  "ADMIN",
] as const satisfies readonly RoleName[];

export const CURRENT_GLOBAL_JOB_OPERATOR_ROLES = ["ADMIN"] as const satisfies readonly RoleName[];

const ADMIN_ONLY_EDITORIAL_POLICY = {
  family: "editorial",
  initiatorRoles: CURRENT_GLOBAL_JOB_OPERATOR_ROLES,
  ownerViewerRoles: CURRENT_GLOBAL_JOB_OPERATOR_ROLES,
  ownerActionRoles: CURRENT_GLOBAL_JOB_OPERATOR_ROLES,
  globalViewerRoles: CURRENT_GLOBAL_JOB_OPERATOR_ROLES,
  globalActionRoles: CURRENT_GLOBAL_JOB_OPERATOR_ROLES,
  defaultSurface: "global",
} satisfies Omit<JobCapabilityDefinition, "toolName" | "label" | "description">;

function defineEditorialCapability(
  toolName: DeferredJobHandlerName,
  label: string,
  description: string,
): JobCapabilityDefinition {
  return {
    toolName,
    label,
    description,
    ...ADMIN_ONLY_EDITORIAL_POLICY,
  };
}

export const JOB_CAPABILITY_REGISTRY = Object.freeze({
  draft_content: defineEditorialCapability(
    "draft_content",
    "Draft Content",
    "Draft a structured journal article and persist the draft for editorial review.",
  ),
  publish_content: defineEditorialCapability(
    "publish_content",
    "Publish Content",
    "Publish an editorial draft and align any linked hero assets for public visibility.",
  ),
  prepare_journal_post_for_publish: defineEditorialCapability(
    "prepare_journal_post_for_publish",
    "Journal Publish Readiness",
    "Check whether a journal post is ready to publish and summarize blockers, active work, and QA findings.",
  ),
  generate_blog_image: defineEditorialCapability(
    "generate_blog_image",
    "Generate Blog Image",
    "Generate the editorial hero image asset for a prepared article.",
  ),
  compose_blog_article: defineEditorialCapability(
    "compose_blog_article",
    "Compose Blog Article",
    "Compose the first editorial article draft from a brief.",
  ),
  qa_blog_article: defineEditorialCapability(
    "qa_blog_article",
    "QA Blog Article",
    "Run editorial QA against the current article draft and return structured findings.",
  ),
  resolve_blog_article_qa: defineEditorialCapability(
    "resolve_blog_article_qa",
    "Resolve Blog Article QA",
    "Apply editorial fixes from a normalized QA report to the current article draft.",
  ),
  generate_blog_image_prompt: defineEditorialCapability(
    "generate_blog_image_prompt",
    "Generate Blog Image Prompt",
    "Design the editorial hero-image prompt and related metadata for a finished article.",
  ),
  produce_blog_article: defineEditorialCapability(
    "produce_blog_article",
    "Produce Blog Article",
    "Run the full editorial production pipeline from composition through draft persistence.",
  ),
}) satisfies Readonly<Record<DeferredJobHandlerName, JobCapabilityDefinition>>;

export function isRegisteredJobCapability(toolName: string): toolName is DeferredJobHandlerName {
  return Object.prototype.hasOwnProperty.call(JOB_CAPABILITY_REGISTRY, toolName);
}

export function getJobCapability(toolName: string): JobCapabilityDefinition | null {
  return isRegisteredJobCapability(toolName) ? JOB_CAPABILITY_REGISTRY[toolName] : null;
}

export function listJobCapabilities(): readonly JobCapabilityDefinition[] {
  return Object.values(JOB_CAPABILITY_REGISTRY);
}

export function listGlobalJobCapabilitiesForRole(role: RoleName): JobCapabilityDefinition[] {
  return listJobCapabilities().filter((capability) => capability.globalViewerRoles.includes(role));
}

export function listGlobalJobCapabilitiesForRoles(
  roles: readonly RoleName[],
): JobCapabilityDefinition[] {
  const seen = new Set<DeferredJobHandlerName>();
  const capabilities: JobCapabilityDefinition[] = [];

  for (const role of roles) {
    for (const capability of listGlobalJobCapabilitiesForRole(role)) {
      if (seen.has(capability.toolName)) {
        continue;
      }

      seen.add(capability.toolName);
      capabilities.push(capability);
    }
  }

  return capabilities;
}

export function canRoleViewGlobalJob(toolName: string, role: RoleName): boolean {
  const capability = getJobCapability(toolName);
  return capability ? capability.globalViewerRoles.includes(role) : false;
}

export function canRolesViewGlobalJob(
  toolName: string,
  roles: readonly RoleName[],
): boolean {
  return roles.some((role) => canRoleViewGlobalJob(toolName, role));
}

export function canRoleManageGlobalJob(toolName: string, role: RoleName): boolean {
  const capability = getJobCapability(toolName);
  return capability ? capability.globalActionRoles.includes(role) : false;
}

export function canRolesManageGlobalJob(
  toolName: string,
  roles: readonly RoleName[],
): boolean {
  return roles.some((role) => canRoleManageGlobalJob(toolName, role));
}

export function getJobCapabilityPresentation(toolName: string): JobCapabilityPresentation | null {
  const capability = getJobCapability(toolName);
  if (!capability) {
    return null;
  }

  return {
    toolName: capability.toolName,
    label: capability.label,
    family: capability.family,
    defaultSurface: capability.defaultSurface,
  };
}

export function getSignedInJobAudienceRoles(): RoleName[] {
  return [...CURRENT_SIGNED_IN_JOB_AUDIENCE_ROLES];
}

export function getGlobalJobOperatorRoles(): RoleName[] {
  return [...CURRENT_GLOBAL_JOB_OPERATOR_ROLES];
}