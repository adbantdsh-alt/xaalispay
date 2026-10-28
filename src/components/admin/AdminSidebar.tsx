"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Handshake,
  Landmark,
  LineChart,
  Layers,
  ShieldAlert,
  Banknote,
  Undo2,
  Users,
  Package,
  ClipboardList,
  LogOut,
  PanelLeft,
  Filter,
  Inbox,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";
import { useAdminData } from "./AdminDataProvider";

type BadgeKind = "disputes" | "payouts" | "refunds";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: BadgeKind;
};

// Trois groupes, dans l'ordre où l'équipe les consulte : pilotage global,
// opérations de la marketplace native, puis Connect (plateformes tierces) —
// l'argent natif et l'argent Connect ne sont jamais mélangés, la navigation
// non plus.
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Pilotage",
    items: [
      { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
      { href: "/admin/funnel", label: "Entonnoir", icon: Filter },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/admin/orders", label: "Commandes", icon: ClipboardList },
      { href: "/admin/disputes", label: "Litiges", icon: ShieldAlert, badge: "disputes" },
      { href: "/admin/payouts", label: "Retraits", icon: Banknote, badge: "payouts" },
      { href: "/admin/refunds", label: "Remboursements", icon: Undo2, badge: "refunds" },
      { href: "/admin/sellers", label: "Vendeurs", icon: Users },
      { href: "/admin/products", label: "Produits", icon: Package },
      { href: "/admin/affiliation", label: "Affiliation", icon: Handshake },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/admin/connect", label: "Trésorerie", icon: Landmark, exact: true },
      { href: "/admin/connect/analytics", label: "Analytics Connect", icon: LineChart },
      { href: "/admin/connect/platforms", label: "Plateformes", icon: Layers },
      { href: "/admin/connect/requests", label: "Demandes bêta", icon: Inbox },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super admin",
  dispute_manager: "Gestion des litiges",
};

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
  const { logout, user } = useAuth();
  const { overview } = useAdminData();

  const badgeCounts: Record<BadgeKind, number> = {
    disputes: overview?.open_disputes_count ?? 0,
    payouts: overview?.payouts_by_status.failed ?? 0,
    refunds: overview?.refunds_to_review?.count ?? 0,
  };
  const groups =
    user?.role === "dispute_manager"
      ? [{ label: "Marketplace", items: NAV_GROUPS[1].items.filter((item) => item.href === "/admin/disputes") }]
      : NAV_GROUPS;
  const profileActive = pathname.startsWith("/admin/profile");
  const displayName = user?.display_name || user?.username || "Mon profil";

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <>
      {open && <div className="admin-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`admin-sidebar ${open ? "is-open" : ""} ${collapsed ? "is-collapsed" : ""}`}>
        <div className="admin-sidebar-header">
          <BrandMark size="md" href="/admin" variant={collapsed ? "icon" : "full"} light />
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={onToggleCollapsed}
            aria-label="Réduire ou déployer le menu"
          >
            <PanelLeft size={17} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Sections admin">
          {groups.map((group) => (
            <div key={group.label} className="admin-sidebar-group">
              {!collapsed && <span className="admin-sidebar-group-label">{group.label}</span>}
              {group.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const badgeCount = item.badge ? badgeCounts[item.badge] : 0;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`admin-sidebar-link ${isActive ? "is-active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && badgeCount > 0 && <span className="admin-sidebar-badge">{badgeCount}</span>}
                    {collapsed && badgeCount > 0 && <span className="admin-sidebar-badge-dot" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            href="/admin/profile"
            onClick={onClose}
            title={collapsed ? "Mon profil" : undefined}
            className={`admin-sidebar-user ${profileActive ? "is-active" : ""}`}
            aria-current={profileActive ? "page" : undefined}
          >
            <span className="admin-sidebar-avatar" aria-hidden="true">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            {!collapsed && (
              <span className="admin-sidebar-user-text">
                <span className="admin-sidebar-user-name">{displayName}</span>
                <span className="admin-sidebar-user-role">{ROLE_LABELS[user?.role ?? ""] ?? "Équipe"}</span>
              </span>
            )}
          </Link>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout} aria-label="Se déconnecter">
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
}
