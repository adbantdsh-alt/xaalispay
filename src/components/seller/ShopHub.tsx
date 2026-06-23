"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export type ShopView = "home" | "product" | "link" | "pseudo" | "edit";

export function useShopView(): ShopView {
  const params = useSearchParams();
  const tab = params.get("tab");
  if (tab === "link") return "link";
  if (tab === "products" || tab === "product") return "product";
  if (tab === "edit") return "edit";
  if (tab === "pseudo" || tab === "tag") return "pseudo";
  return "home";
}

export function ShopBackBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className="shop-back-bar">
      <button
        type="button"
        className="icon-back-btn"
        onClick={() => router.back()}
        aria-label="Retour"
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <p className="shop-back-title">{title}</p>
    </div>
  );
}

export function ShopActionButtons() {
  return (
    <div className="shop-action-grid">
      <Link href="/create?tab=product" className="shop-action-card shop-action-card-product shop-action-card-full">
        <span className="shop-action-icon" aria-hidden="true">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="shop-action-label">Créer un produit</span>
        <span className="shop-action-hint">Image, prix, lien auto</span>
      </Link>
    </div>
  );
}
