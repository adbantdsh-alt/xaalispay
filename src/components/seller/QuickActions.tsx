"use client";

import Link from "next/link";
import { useState } from "react";
import { buildShopShareMessage, buildWhatsAppUrl, copyToClipboard } from "@/lib/share";

export function QuickActions({
  shopUrl,
  username,
  embedded = false,
}: {
  shopUrl: string;
  username: string;
  embedded?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const shareShop = () => {
    if (!shopUrl) return;
    try {
      localStorage.setItem("xp_onboarding_shared", "1");
    } catch {
      /* ignore */
    }
    window.open(buildWhatsAppUrl(buildShopShareMessage(shopUrl, username)), "_blank");
  };

  const copyShop = async () => {
    if (!shopUrl) return;
    const ok = await copyToClipboard(shopUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const rootClass = embedded ? "quick-actions quick-actions-embedded" : "quick-actions";

  return (
    <div className={rootClass}>
      <Link href="/create?tab=product" className="quick-action">
        <span className="quick-action-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <span className="quick-action-label">Créer un produit</span>
      </Link>

      <button type="button" onClick={shareShop} className="quick-action">
        <span className="quick-action-icon">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </span>
        <span className="quick-action-label">Partager mon XaalisTag</span>
      </button>

      {shopUrl && (
        <button type="button" onClick={copyShop} className="quick-action">
          <span className="quick-action-icon">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </span>
          <span className="quick-action-label">
            {copied ? "XaalisTag copié" : "Copier mon XaalisTag"}
          </span>
        </button>
      )}
    </div>
  );
}
