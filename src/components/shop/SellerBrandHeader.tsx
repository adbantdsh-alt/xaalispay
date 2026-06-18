"use client";

import Link from "next/link";
import type { SellerBrandView } from "@/lib/profile-images";

interface SellerBrandHeaderProps extends SellerBrandView {
  compact?: boolean;
  showShopLink?: boolean;
}

export function SellerBrandHeader({
  displayName,
  username,
  avatarUrl,
  coverUrl,
  compact = false,
  showShopLink = false,
}: SellerBrandHeaderProps) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <section
      className={`shop-brand-header animate-fade-up${compact ? " shop-brand-header--compact" : ""}`}
      aria-label={`Boutique ${displayName}`}
    >
      <div className="shop-brand-cover">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="shop-brand-cover-img" />
        ) : (
          <div className="shop-brand-cover-fallback" aria-hidden="true" />
        )}
      </div>

      <div className="shop-brand-body">
        <div className="shop-brand-avatar" aria-hidden={!avatarUrl}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="shop-brand-avatar-img" />
          ) : (
            <span className="shop-brand-avatar-letter">{initial}</span>
          )}
        </div>

        <div className="shop-brand-meta">
          <p className="shop-brand-name">{displayName}</p>
          <p className="shop-brand-tag">
            @{username}
            <span className="shop-brand-dot"> · </span>
            Vendeur vérifié
          </p>
          {showShopLink && (
            <Link href={`/seller/${username}`} className="shop-brand-shop-link">
              Voir la boutique
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
