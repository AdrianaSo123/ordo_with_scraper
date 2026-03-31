import { runAdminAction } from "@/lib/admin/shared/admin-action-helpers";
import {
  type AdminSearchResult,
  searchAdminEntities,
} from "./admin-search";

export async function searchAction(formData: FormData): Promise<AdminSearchResult[]> {
  "use server";

  return runAdminAction(formData, async (_user, formData): Promise<AdminSearchResult[]> => {
    const query = String(formData.get("query") ?? "").trim();
    if (query.length < 2) return [];
    return searchAdminEntities(query);
  });
}
