/**
 * Higher-order wrapper for admin server actions.
 * Handles auth gating; caller handles revalidation + redirect.
 */

import type { User as SessionUser } from "@/core/entities/user";
import { requireAdminPageAccess } from "@/lib/journal/admin-journal";

export async function runAdminAction<T>(
  formData: FormData,
  handler: (user: SessionUser, formData: FormData) => Promise<T>,
): Promise<T> {
  const user = await requireAdminPageAccess();
  return handler(user, formData);
}
