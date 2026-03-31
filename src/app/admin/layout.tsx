import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminPageAccess } from "@/lib/journal/admin-journal";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageAccess();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground" data-admin-shell="true">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded focus:shadow-md"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-(--space-frame-default) py-(--space-frame-default) sm:px-(--space-frame-wide) sm:py-(--space-frame-default)">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-(--space-section-default) sm:grid-cols-[248px_minmax(0,1fr)] sm:items-start">
          <AdminSidebar />
          <div className="grid min-h-0 min-w-0 gap-(--space-3)">
            <main
              id="admin-main"
              className="admin-shell-main min-h-0 min-w-0 overflow-y-auto px-(--space-frame-default) py-(--space-frame-default) sm:px-(--space-frame-wide) sm:py-(--space-frame-default) sm:pb-(--space-frame-wide)"
              data-admin-scroll-region="true"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
