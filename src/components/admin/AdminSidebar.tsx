"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isAdminNavigationItemActive,
  resolveAdminNavigationGroups,
} from "@/lib/admin/admin-navigation";

export function AdminSidebar() {
  const pathname = usePathname();
  const navGroups = resolveAdminNavigationGroups();

  return (
    <aside
      aria-label="Admin"
      className="admin-panel-surface sticky top-(--space-frame-default) hidden max-h-[calc(var(--viewport-block-size)-var(--space-frame-default)*2)] flex-col gap-(--space-stack-default) overflow-y-auto p-(--space-inset-panel) sm:flex"
    >
      <div className="grid gap-(--space-3)">
        <div className="grid gap-(--space-2)">
          <p className="shell-section-heading text-foreground/46">Admin workspace</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin</h1>
        </div>
        <p className="text-sm leading-6 text-foreground/62">
          Queue health, editorial operations, and upcoming operator surfaces live here without the public marketing chrome.
        </p>
      </div>
      <nav className="grid gap-(--space-4)">
        {navGroups.map((group) => (
          <section key={group.id} className="grid gap-(--space-2)" aria-label={group.label}>
            <h2 className="shell-section-heading px-(--space-2) text-foreground/38">{group.label}</h2>
            <div className="grid gap-(--space-1)">
              {group.items.map((item) => {
                const isActive = isAdminNavigationItemActive(item, pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.status === "preview" ? `${item.label} preview` : item.label}
                    className={`admin-nav-link ${isActive ? "admin-nav-link-active" : "admin-nav-link-idle"}`}
                    data-admin-nav-status={item.status}
                  >
                    <span className="flex items-center gap-(--space-3)">
                      <span className="admin-nav-link-icon" aria-hidden="true">{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        <span className="mt-1 block truncate text-xs font-normal normal-case tracking-normal text-inherit opacity-62">
                          {item.description}
                        </span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}