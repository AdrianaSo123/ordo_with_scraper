import type { User as SessionUser } from "@/core/entities/user";
import type { ContentAudience } from "@/lib/access/content-access";
import { searchAdminEntities, type AdminSearchResult } from "@/lib/admin/search/admin-search";
import { getCorpusSummaries, searchCorpus } from "@/lib/corpus-library";
import type { CorpusSummary } from "@/core/use-cases/CorpusSummaryInteractor";
import { resolveCommandRoutes, type ShellRouteDefinition } from "@/lib/shell/shell-navigation";

export interface GlobalSearchResult {
  kind: "route" | "document" | "section" | "admin-entity";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  audience: ContentAudience | "route";
  source: "shell" | "corpus" | "admin";
  updatedAt?: string;
  entityType?: AdminSearchResult["entityType"];
}

export type GlobalSearchAction = (formData: FormData) => Promise<GlobalSearchResult[]>;

interface GlobalSearchContext {
  id: string;
  roles: SessionUser["roles"];
}

function mapRouteResult(route: ShellRouteDefinition): GlobalSearchResult {
  return {
    kind: "route",
    id: route.id,
    title: route.label,
    subtitle: route.description ?? route.href,
    href: route.href,
    audience: "route",
    source: "shell",
  };
}

function mapAdminResult(result: AdminSearchResult): GlobalSearchResult {
  return {
    kind: "admin-entity",
    id: `${result.entityType}:${result.id}`,
    title: result.title,
    subtitle: result.subtitle,
    href: result.href,
    audience: "admin",
    source: "admin",
    updatedAt: result.updatedAt,
    entityType: result.entityType,
  };
}

function mapCorpusDocumentResult(summary: CorpusSummary): GlobalSearchResult {
  return {
    kind: "document",
    id: summary.id,
    title: summary.title,
    subtitle: summary.number ? `${summary.number} · ${summary.sectionCount} sections` : `${summary.sectionCount} sections`,
    href: `/library/${summary.slug}`,
    audience: summary.audience,
    source: "corpus",
  };
}

function mapCorpusSectionResult(result: Awaited<ReturnType<typeof searchCorpus>>[number]): GlobalSearchResult {
  return {
    kind: "section",
    id: `${result.documentSlug}/${result.sectionSlug}`,
    title: result.section,
    subtitle: `${result.document} · ${result.matchContext}`,
    href: `/library/${result.documentSlug}/${result.sectionSlug}`,
    audience: "public",
    source: "corpus",
  };
}

function getResultRank(result: GlobalSearchResult, loweredQuery: string): number {
  const title = result.title.toLowerCase();
  const subtitle = result.subtitle.toLowerCase();
  const href = result.href.toLowerCase();

  if (result.kind === "route") {
    if (title === loweredQuery || href === loweredQuery) return 0;
    if (title.startsWith(loweredQuery) || href.includes(loweredQuery)) return 1;
    return 2;
  }

  if (result.kind === "section") {
    if (title === loweredQuery) return 10;
    if (title.startsWith(loweredQuery)) return 11;
    if (subtitle.includes(loweredQuery)) return 12;
    return 13;
  }

  if (result.kind === "document") {
    if (title === loweredQuery) return 20;
    if (title.startsWith(loweredQuery)) return 21;
    if (subtitle.includes(loweredQuery)) return 22;
    return 23;
  }

  if (title === loweredQuery) return 30;
  if (title.startsWith(loweredQuery)) return 31;
  if (subtitle.includes(loweredQuery)) return 32;
  return 33;
}

export async function searchGlobalEntities(
  query: string,
  context: GlobalSearchContext,
): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const lowered = trimmed.toLowerCase();
  const shellRoutes = resolveCommandRoutes({ roles: context.roles })
    .filter(
      (route) =>
        route.label.toLowerCase().includes(lowered)
        || route.href.toLowerCase().includes(lowered)
        || route.description?.toLowerCase().includes(lowered),
    )
    .map(mapRouteResult);

  const corpusOptions = { role: context.roles[0] ?? "ANONYMOUS" };
  const [corpusDocuments, corpusSections] = await Promise.all([
    getCorpusSummaries(corpusOptions),
    searchCorpus(trimmed, 10, corpusOptions),
  ]);

  const corpusDocumentResults = corpusDocuments
    .filter(
      (summary) =>
        summary.title.toLowerCase().includes(lowered)
        || summary.slug.toLowerCase().includes(lowered)
        || summary.sections.some((section) => section.toLowerCase().includes(lowered)),
    )
    .map(mapCorpusDocumentResult);

  const corpusSectionResults = corpusSections.map(mapCorpusSectionResult);

  const adminResults = context.roles.includes("ADMIN")
    ? (await searchAdminEntities(trimmed, { limit: 10 })).map(mapAdminResult)
    : [];

  const rankedResults = [...shellRoutes, ...corpusDocumentResults, ...corpusSectionResults, ...adminResults]
    .map((result) => ({ result, rank: getResultRank(result, lowered) }))
    .sort((left, right) => left.rank - right.rank);

  const deduped = new Map<string, GlobalSearchResult>();
  for (const { result } of rankedResults) {
    deduped.set(`${result.kind}:${result.href}`, result);
  }

  return Array.from(deduped.values()).slice(0, 20);
}