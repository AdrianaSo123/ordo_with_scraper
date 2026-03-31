import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { requireAdminPageAccess } from "@/lib/journal/admin-journal";
import { getAdminLeadsDetailPath } from "@/lib/admin/leads/admin-leads-routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Training Detail",
  robots: { index: false, follow: false },
};

export default async function AdminTrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPageAccess();
  const { id } = await params;
  permanentRedirect(getAdminLeadsDetailPath(id));
}
