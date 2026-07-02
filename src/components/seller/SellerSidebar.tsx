"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeft, UserCircle } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";
import { SELLER_NAV_TABS, isSellerTabActive } from "./nav-items";

export function SellerSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  const profileActive = pathname.startsWith("/profile");

  return (
    <aside className={`seller-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="seller-sidebar-header">
        <BrandMark size="md" href="/dashboard" variant={collapsed ? "icon" : "full"} light />
        <button
          type="button"
          className="seller-sidebar-toggle"
          onClick={onToggleCollapsed}
          title="Réduire / déployer le menu"
        >
          <PanelLeft size={17} aria-hidden="true" />
        </button>
      </div>

      <nav className="seller-sidebar-nav" aria-label="Navigation vendeur">
        {SELLER_NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = isSellerTabActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`seller-sidebar-link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="seller-sidebar-footer">
        <Link
          href="/profile"
          title="Mon profil"
          className={`seller-sidebar-link ${profileActive ? "is-active" : ""}`}
          aria-current={profileActive ? "page" : undefined}
        >
          <UserCircle size={18} aria-hidden="true" />
          {!collapsed && <span>Mon profil</span>}
        </Link>
        <button
          type="button"
          className="seller-sidebar-link seller-sidebar-logout"
          onClick={handleLogout}
          title="Déconnexion"
        >
          <LogOut size={18} aria-hidden="true" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
