"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const PAGE_META: Record<string, [string, string]> = {
  "/dashboard": ["Tableau de bord", "Aperçu de votre activité"],
  "/dashboard/orders": ["Commandes", "Historique de vos commandes"],
  "/dashboard/products": ["Produits", "Gestion de votre catalogue"],
  "/create": ["Ma boutique", "Gérez vos produits et liens de paiement"],
  "/wallet": ["Portefeuille", "Vos gains et demandes de retrait"],
  "/history": ["Historique", "Toutes vos transactions"],
  "/settings": ["Paramètres", "Configuration de votre compte"],
  "/settings/affiliates": ["Affiliation", "Votre programme de parrainage"],
  "/settings/delivery-zones": ["Zones de livraison", "Configurez vos zones de livraison"],
  "/profile": ["Mon profil", "Vos informations personnelles"],
};

function resolvePageMeta(pathname: string): [string, string] {
  const exact = PAGE_META[pathname];
  if (exact) return exact;
  const match = Object.entries(PAGE_META).find(
    ([p]) => p !== "/dashboard" && pathname.startsWith(p)
  );
  return match?.[1] ?? PAGE_META["/dashboard"];
}

export function SellerDesktopTopbar() {
  const pathname = usePathname();
  const [title, sub] = resolvePageMeta(pathname);

  return (
    <header className="seller-topbar">
      <div className="seller-topbar-titles">
        <span className="seller-topbar-title">{title}</span>
        <span className="seller-topbar-sub">{sub}</span>
      </div>
      <div className="seller-topbar-right">
        <span className="seller-topbar-bell" aria-hidden="true">
          <Bell size={20} strokeWidth={1.5} />
          <span className="seller-header-bell-dot" />
        </span>
      </div>
    </header>
  );
}
