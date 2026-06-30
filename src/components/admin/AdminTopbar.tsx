"use client";

import { usePathname } from "next/navigation";
import { Menu, RefreshCw } from "lucide-react";
import { useAdminData } from "./AdminDataProvider";

const PAGE_META: Record<string, [string, string]> = {
  "/admin": ["Vue d'ensemble", "Surveillance de la plateforme en temps réel"],
  "/admin/analytics": ["Analytics", "Tendances de commandes, volume d'affaires et revenu"],
  "/admin/affiliation": ["Affiliation", "Programme de parrainage et commissions versées"],
  "/admin/disputes": ["Litiges", "Arbitrage des conflits acheteur / vendeur"],
  "/admin/payouts": ["Retraits", "Suivi et relance des versements"],
  "/admin/sellers": ["Vendeurs", "Comptes et soldes des vendeurs"],
  "/admin/products": ["Produits", "Catalogue et modération"],
  "/admin/profile": ["Mon profil", "Votre compte et l'équipe XaalisPay"],
  "/admin/change-password": ["Changer mon mot de passe", "Étape obligatoire avant de continuer"],
};

function resolvePageMeta(pathname: string): [string, string] {
  if (pathname === "/admin") return PAGE_META["/admin"];
  const match = Object.entries(PAGE_META).find(([path]) => path !== "/admin" && pathname.startsWith(path));
  return match?.[1] ?? PAGE_META["/admin"];
}

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { lastUpdated, autoRefreshing, refresh } = useAdminData();
  const [title, sub] = resolvePageMeta(pathname);

  return (
    <header className="admin-topbar">
      <button
        type="button"
        className="admin-topbar-toggle"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <div className="admin-topbar-titles">
        <span className="admin-topbar-title">{title}</span>
        <span className="admin-topbar-sub">{sub}</span>
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
                {lastUpdated.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
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
