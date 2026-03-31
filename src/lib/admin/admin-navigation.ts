import { getShellRouteById } from "@/lib/shell/shell-navigation";

export type AdminNavigationStatus = "live" | "preview";
export type AdminNavigationGroupId = "overview" | "operations" | "content" | "governance" | "platform";

export interface AdminNavigationItem {
  id: string;
  routeId: string;
  href: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  status: AdminNavigationStatus;
  groupId: AdminNavigationGroupId;
  groupLabel: string;
}

export interface AdminNavigationGroup {
  id: AdminNavigationGroupId;
  label: string;
  description?: string;
  items: AdminNavigationItem[];
}

const ADMIN_NAV_GROUP_CONFIG = [
  {
    id: "overview",
    label: "Overview",
    description: "Cross-workspace wayfinding and health.",
    items: [
      { routeId: "admin-dashboard", label: "Dashboard", shortLabel: "Home", icon: "D", status: "live" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Pipeline, review, and queue work.",
    items: [
      { routeId: "admin-leads", label: "Leads", shortLabel: "Leads", icon: "L", status: "live" },
      { routeId: "admin-conversations", label: "Conversations", shortLabel: "Convos", icon: "C", status: "live" },
      { routeId: "admin-jobs", label: "Jobs", shortLabel: "Jobs", icon: "B", status: "live" },
    ],
  },
  {
    id: "content",
    label: "Content",
    description: "Editorial workflow and publishing.",
    items: [
      { routeId: "journal-admin", label: "Journal", shortLabel: "Journal", icon: "J", status: "live" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    description: "Identity and prompt administration.",
    items: [
      { routeId: "admin-users", label: "Users", shortLabel: "Users", icon: "U", status: "live" },
      { routeId: "admin-prompts", label: "Prompts", shortLabel: "Prompts", icon: "P", status: "live" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    description: "Runtime and system controls.",
    items: [
      { routeId: "admin-system", label: "System", shortLabel: "System", icon: "S", status: "live" },
    ],
  },
] as const;

function buildAdminNavigationItem(
  groupId: AdminNavigationGroupId,
  groupLabel: string,
  item: (typeof ADMIN_NAV_GROUP_CONFIG)[number]["items"][number],
): AdminNavigationItem {
  const route = getShellRouteById(item.routeId);

  return {
    id: route.id,
    routeId: route.id,
    href: route.href,
    label: item.label,
    shortLabel: item.shortLabel,
    icon: item.icon,
    description: route.description ?? `${route.label} admin route.`,
    status: item.status,
    groupId,
    groupLabel,
  };
}

export function resolveAdminNavigationGroups(): AdminNavigationGroup[] {
  return ADMIN_NAV_GROUP_CONFIG.map((group) => ({
    id: group.id,
    label: group.label,
    description: group.description,
    items: group.items.map((item) => buildAdminNavigationItem(group.id, group.label, item)),
  }));
}

export function resolveAdminNavigationItems(): AdminNavigationItem[] {
  return resolveAdminNavigationGroups().flatMap((group) => group.items);
}

export function isAdminNavigationItemActive(
  item: Pick<AdminNavigationItem, "href">,
  pathname: string,
): boolean {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
