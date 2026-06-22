"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  Banknote,
  Users,
  Package,
  LogOut,
  PanelLeft,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";
import { useAdminData } from "./AdminDataProvider";

const NAV_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/disputes", label: "Litiges", icon: ShieldAlert, badge: "disputes" as const },
  { href: "/admin/payouts", label: "Retraits", icon: Banknote, badge: "payouts" as const },
  { href: "/admin/sellers", label: "Vendeurs", icon: Users },
  { href: "/admin/products", label: "Produits", icon: Package },
];

export function AdminSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { overview } = useAdminData();

  const failedPayouts = overview?.payouts_by_status.failed ?? 0;
  const openDisputes = overview?.open_disputes_count ?? 0;

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <>
      {open && <div className="admin-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`admin-sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`}>
        <div className="admin-sidebar-header">
          <BrandMark size="md" href="/admin" variant={collapsed ? "icon" : "full"} />
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={onToggleCollapsed}
            title="Réduire / déployer le menu"
          >
            <PanelLeft size={17} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Sections admin">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badgeCount = item.badge === "disputes" ? openDisputes : item.badge === "payouts" ? failedPayouts : 0;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={item.label}
                className={`admin-sidebar-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && badgeCount > 0 && (
                  <span className={`admin-tab-badge ${item.badge === "payouts" ? "admin-tab-badge--warn" : ""}`}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-sidebar-link admin-sidebar-logout"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut size={18} aria-hidden="true" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
