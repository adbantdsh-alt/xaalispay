"use client";

import { usePathname } from "next/navigation";
import { Menu, RefreshCw } from "lucide-react";
import { useAdminData } from "./AdminDataProvider";

// [groupe, titre] — le groupe reprend celui de la barre latérale.
const PAGE_META: Record<string, [string, string]> = {
  "/admin": ["Pilotage", "Vue d'ensemble"],
  "/admin/funnel": ["Pilotage", "Entonnoir"],
  "/admin/analytics": ["Pilotage", "Analytics"],
  "/admin/orders": ["Marketplace", "Commandes"],
  "/admin/disputes": ["Marketplace", "Litiges"],
  "/admin/payouts": ["Marketplace", "Retraits"],
  "/admin/refunds": ["Marketplace", "Remboursements"],
  "/admin/sellers": ["Marketplace", "Vendeurs"],
  "/admin/products": ["Marketplace", "Produits"],
  "/admin/affiliation": ["Marketplace", "Affiliation"],
  "/admin/connect": ["Connect", "Trésorerie"],
  "/admin/connect/analytics": ["Connect", "Analytics Connect"],
  "/admin/connect/platforms": ["Connect", "Plateformes"],
  "/admin/connect/requests": ["Connect", "Demandes bêta"],
  "/admin/profile": ["Compte", "Mon profil"],
  "/admin/change-password": ["Compte", "Changer mon mot de passe"],
};

function resolvePageMeta(pathname: string): [string, string] {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  // Préfixe le plus long d'abord : /admin/connect/platforms avant /admin/connect.
  const match = Object.keys(PAGE_META)
    .filter((path) => path !== "/admin" && pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_META[match] : PAGE_META["/admin"];
}

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { lastUpdated, autoRefreshing, refresh } = useAdminData();
  const [group, title] = resolvePageMeta(pathname);

  return (
    <header className="admin-topbar">
      <button type="button" className="admin-topbar-toggle" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="admin-topbar-titles">
        <span className="admin-topbar-sub">{group}</span>
        <h1 className="admin-topbar-title">{title}</h1>
      </div>

      <div className="admin-refresh-group">
        {lastUpdated && (
          <span className={`admin-last-updated admin-mono ${autoRefreshing ? "admin-last-updated--syncing" : ""}`}>
            {autoRefreshing ? (
              <>
                <span className="btn-spinner admin-sync-spinner" aria-hidden="true" />
                Sync…
              </>
            ) : (
              <>
                <span className="admin-live-dot" aria-hidden="true" />
                {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </>
            )}
          </span>
        )}
        <button type="button" className="admin-refresh-btn" onClick={() => refresh({ silent: false })}>
          <RefreshCw size={15} aria-hidden="true" />
          Actualiser
        </button>
      </div>
    </header>
  );
}
