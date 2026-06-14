"use client";

import Link from "next/link";
import { buildShopShareMessage, buildWhatsAppUrl } from "@/lib/share";

export function QuickActions({
  shopUrl,
  username,
  hasPendingPin,
  embedded = false,
}: {
  shopUrl: string;
  username: string;
  hasPendingPin: boolean;
  embedded?: boolean;
}) {
  const shareShop = () => {
    if (!shopUrl) return;
    try {
      localStorage.setItem("xp_onboarding_shared", "1");
    } catch {
      /* ignore */
    }
    window.open(buildWhatsAppUrl(buildShopShareMessage(shopUrl, username)), "_blank");
  };

  const scrollToPin = () => {
    document.getElementById("pin-action")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const rootClass = embedded ? "quick-actions quick-actions-embedded" : "quick-actions";

  return (
    <div className={rootClass}>
      <Link href="/create?tab=link" className="quick-action">
        <span className="quick-action-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <span className="quick-action-label">Lien</span>
      </Link>

      <Link href="/create?tab=product" className="quick-action">
        <span className="quick-action-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="quick-action-label">Produit</span>
      </Link>

      <button type="button" onClick={shareShop} className="quick-action">
        <span className="quick-action-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </span>
        <span className="quick-action-label">Partager</span>
      </button>

      {hasPendingPin && (
        <button
          type="button"
          onClick={scrollToPin}
          className="quick-action quick-action-highlight"
        >
          <span className="quick-action-icon">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          <span className="quick-action-label">PIN</span>
        </button>
      )}
    </div>
  );
}
