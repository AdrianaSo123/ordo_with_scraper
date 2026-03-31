import Link from "next/link";

interface AdminWorkspaceNavItem {
  id: string;
  label: string;
  href: string;
}

export function AdminWorkspaceNav({
  ariaLabel,
  items,
  currentItemId,
}: {
  ariaLabel: string;
  items: readonly AdminWorkspaceNavItem[];
  currentItemId: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="admin-workspace-nav">
      {items.map((item) => {
        const isActive = item.id === currentItemId;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`admin-workspace-nav-link ${isActive ? "admin-workspace-nav-link-active" : "admin-workspace-nav-link-idle"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}