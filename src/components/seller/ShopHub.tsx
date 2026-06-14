"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export type ShopView = "home" | "product" | "link" | "pseudo";

export function useShopView(): ShopView {
  const params = useSearchParams();
  const tab = params.get("tab");
  if (tab === "link") return "link";
  if (tab === "products" || tab === "product") return "product";
  if (tab === "pseudo") return "pseudo";
  return "home";
}

export function ShopBackBar({ title }: { title: string }) {
  return (
    <div className="shop-back-bar">
      <Link href="/create" className="shop-back-btn">
        ← Retour
      </Link>
      <p className="shop-back-title">{title}</p>
    </div>
  );
}

export function ShopActionButtons() {
  return (
    <div className="shop-action-grid">
      <Link href="/create?tab=product" className="shop-action-card shop-action-card-product">
        <span className="shop-action-icon" aria-hidden="true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="shop-action-label">Créer un produit</span>
        <span className="shop-action-hint">Photo, prix, livraison</span>
      </Link>

      <Link href="/create?tab=link" className="shop-action-card shop-action-card-link">
        <span className="shop-action-icon" aria-hidden="true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <span className="shop-action-label">Partager un lien</span>
        <span className="shop-action-hint">Lien permanent du produit</span>
      </Link>
    </div>
  );
}
