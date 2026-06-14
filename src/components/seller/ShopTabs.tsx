"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "products", label: "Produits", href: "/create?tab=products" },
  { id: "link", label: "Lien paiement", href: "/create?tab=link" },
  { id: "pseudo", label: "Pseudo", href: "/create?tab=pseudo" },
] as const;

export type ShopTab = (typeof TABS)[number]["id"];

export function ShopTabs({ active }: { active: ShopTab }) {
  return (
    <nav className="shop-tabs" aria-label="Sections boutique">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`shop-tab ${active === tab.id ? "shop-tab-active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function useShopTab(): ShopTab {
  const params = useSearchParams();
  const tab = params.get("tab");
  if (tab === "link" || tab === "pseudo") return tab;
  return "products";
}
