"use client";

import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatPublicUrl } from "@/lib/site-url";
import { buildShopShareMessage, buildWhatsAppUrl } from "@/lib/share";

export function ShopHomeToolbar({
  shopUrl,
  username,
  search,
  onSearchChange,
  productCount,
  filteredCount,
}: {
  shopUrl: string;
  username: string;
  search: string;
  onSearchChange: (value: string) => void;
  productCount: number;
  filteredCount: number;
}) {
  return (
    <div className="shop-home-toolbar">
      {shopUrl && (
        <div className="shop-url-strip">
          <Link href={shopUrl} className="shop-url-strip-link" target="_blank" rel="noopener noreferrer">
            {formatPublicUrl(shopUrl)}
          </Link>
          <div className="shop-url-strip-actions">
            <CopyButton text={shopUrl} label="Copier" className="shop-url-strip-btn" />
            <button
              type="button"
              className="shop-url-strip-btn shop-url-strip-btn-share"
              onClick={() =>
                window.open(buildWhatsAppUrl(buildShopShareMessage(shopUrl, username)), "_blank")
              }
            >
              Partager
            </button>
          </div>
        </div>
      )}

      <div className="shop-toolbar-row">
        <div className="shop-search-wrap">
          <svg
            className="shop-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className="input-field shop-search-input"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Rechercher un produit"
          />
          {search.trim() && (
            <button
              type="button"
              className="shop-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
        <Link href="/create?tab=product" className="shop-create-compact">
          <span className="shop-create-compact-icon" aria-hidden="true">+</span>
          <span className="shop-create-compact-label">Créer</span>
        </Link>
      </div>

      <p className="shop-toolbar-meta text-muted">
        {search.trim()
          ? `${filteredCount} résultat${filteredCount !== 1 ? "s" : ""} sur ${productCount}`
          : `${productCount} produit${productCount !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
