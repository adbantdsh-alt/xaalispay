"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KeyRound, LayoutDashboard, ListOrdered, LogOut, Webhook } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { usePortalAuth } from "@/lib/connect-portal-auth";

const NAV_ITEMS = [
  { href: "/connect/portal", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/connect/portal/transactions", label: "Transactions", icon: ListOrdered },
  { href: "/connect/portal/api-keys", label: "Clés API", icon: KeyRound },
  { href: "/connect/portal/webhooks", label: "Webhooks", icon: Webhook },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = usePortalAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/connect/portal/login");
  };

  return (
    <aside className="admin-sidebar is-open">
      <div className="admin-sidebar-header">
        <BrandMark size="md" href="/connect/portal" variant="full" light />
      </div>

      {user && (
        <div style={{ padding: "0 1.1rem 0.75rem", color: "rgba(255,255,255,0.65)", fontSize: "0.75rem" }}>
          {user.platform_name}
        </div>
      )}

      <nav className="admin-sidebar-nav" aria-label="Sections portail Connect">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-sidebar-link admin-sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
