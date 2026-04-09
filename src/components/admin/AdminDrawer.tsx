"use client";

/**
 * Hamburger drawer for admin mobile navigation.
 * Replaces AdminBottomNav. Slides in from the left.
 * Focus trap, Escape to close, auto-close on route change.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isAdminNavigationItemActive,
  resolveAdminNavigationGroups,
} from "@/lib/admin/admin-navigation";
import { SHELL_BRAND } from "@/lib/shell/shell-navigation";

export function AdminDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change — deferred to avoid synchronous setState in effect
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      const id = requestAnimationFrame(() => setOpen(false));
      return () => cancelAnimationFrame(id);
    }
  }, [pathname]);

  // Focus trap and Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Focus first item in drawer
    const timer = setTimeout(() => {
      const first = drawerRef.current?.querySelector<HTMLElement>("a[href], button");
      first?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const groupedItems = resolveAdminNavigationGroups();

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open admin menu"
        aria-expanded={open}
        className="admin-nav-trigger flex h-10 w-10 items-center justify-center rounded-full text-foreground/68 transition hover:text-foreground sm:hidden"
        onClick={() => setOpen(true)}
        data-admin-drawer-trigger="true"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Backdrop + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden" data-admin-drawer="true">
          {/* Backdrop */}
          <div
            className="admin-drawer-backdrop absolute inset-0"
            onClick={close}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="admin-drawer-panel safe-area-pt safe-area-pb absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-var(--space-3)))] max-w-full flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-foreground/8 px-(--space-4) py-(--space-3)">
              <div className="grid gap-1">
                <span className="shell-section-heading text-foreground/42">Admin workspace</span>
                <span className="text-sm font-semibold text-foreground">{SHELL_BRAND.shortName} Admin</span>
              </div>
              <button
                type="button"
                aria-label="Close admin menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 transition hover:bg-foreground/8 hover:text-foreground"
                onClick={close}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-(--space-2) py-(--space-3)">
              <div className="flex flex-col gap-(--space-4)">
                {groupedItems.map((group) => (
                  <section key={group.id} className="flex flex-col gap-(--space-2)">
                    <h2 className="shell-section-heading px-(--space-3) text-foreground/35">
                      {group.label}
                    </h2>
                    <ul className="flex flex-col gap-(--space-1)">
                      {group.items.map((item) => {
                        const isActive = isAdminNavigationItemActive(item, pathname);
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              aria-current={isActive ? "page" : undefined}
                              aria-label={item.status === "preview" ? `${item.label} preview` : item.label}
                              className={`admin-nav-link ${isActive ? "admin-nav-link-active" : "admin-nav-link-idle"}`}
                              onClick={() => setOpen(false)}
                            >
                              <span className="admin-nav-link-icon" aria-hidden="true">
                                {item.icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate">{item.label}</span>
                                <span className="mt-1 block truncate text-xs font-normal normal-case tracking-normal text-inherit opacity-62">
                                  {item.description}
                                </span>
                              </span>
                              {item.status === "preview" && (
                                <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-medium text-amber-600">preview</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </nav>

            {/* Mini footer */}
            <div className="border-t border-foreground/8 px-(--space-4) py-(--space-3) text-[0.6rem] text-foreground/30">
              {SHELL_BRAND.name} &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
