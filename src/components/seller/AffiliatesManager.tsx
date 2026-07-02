"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { buildAffiliateShareMessage, buildWhatsAppUrl, copyToClipboard } from "@/lib/share";
import { buildReferralUrl, formatPublicUrl } from "@/lib/site-url";
import { formatCurrency } from "@/lib/utils";

interface ReferralRow {
  id: string;
  username: string;
  businessName: string;
  displayName: string;
  createdAt: string;
  isBoosted: boolean;
  lifetimeGmv: number;
  commissionEarnedTotal: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptReferral(r: any): ReferralRow {
  return {
    id: String(r.id),
    username: r.username,
    businessName: r.business_name,
    displayName: r.display_name,
    createdAt: r.created_at,
    isBoosted: r.is_boosted,
    lifetimeGmv: r.lifetime_gmv,
    commissionEarnedTotal: r.commission_earned_total,
  };
}

export function AffiliatesManager({ username }: { username: string }) {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (url: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (url: string) => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Rejoignez XaalisPay",
          text: buildAffiliateShareMessage(url),
          url,
        });
        return;
      } catch {
        // user cancelled or API not available — fall through
      }
    }
    window.open(buildWhatsAppUrl(buildAffiliateShareMessage(url)), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/affiliates/me/referrals")
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        const data = await res.json();
        setReferrals((data as unknown[]).map(adaptReferral));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const referralUrl = buildReferralUrl(username);
  const totalEarned = referrals.reduce((sum, r) => sum + r.commissionEarnedTotal, 0);

  return (
    <div className="field-block" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <section className="settings-profile-card">
        <p className="settings-section-label" style={{ padding: 0 }}>
          Mon lien d&apos;affiliation
        </p>
        <p className="text-muted" style={{ fontSize: "0.8125rem", margin: 0 }}>
          Gagnez 1% sur les ventes de chaque vendeur que vous parrainez pendant 3 mois, puis 0,25% à vie —
          sans rien changer pour lui.
        </p>
        <div className="affiliate-link-strip">
          <span className="affiliate-link-url" title={formatPublicUrl(referralUrl)}>
            {formatPublicUrl(referralUrl)}
          </span>
          <button
            type="button"
            className={`affiliate-link-action${copied ? " is-copied" : ""}`}
            onClick={() => handleCopy(referralUrl)}
            aria-label="Copier le lien"
            title="Copier le lien"
          >
            {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.75} />}
          </button>
          <button
            type="button"
            className="affiliate-link-action"
            onClick={() => handleShare(referralUrl)}
            aria-label="Partager"
            title="Partager"
          >
            <Share2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      </section>

      <section className="settings-section">
        <p className="settings-section-label">
          Mes affiliés {referrals.length > 0 && `(${referrals.length})`}
        </p>
        {!loading && referrals.length > 0 && (
          <p className="text-muted" style={{ fontSize: "0.8125rem", padding: "0 0.25rem" }}>
            Total déjà gagné : <strong>{formatCurrency(totalEarned)}</strong>
          </p>
        )}
        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : referrals.length === 0 ? (
          <p className="text-muted">
            Aucun affilié pour l&apos;instant — partagez votre lien pour commencer à gagner des commissions.
          </p>
        ) : (
          <div className="settings-info-grid">
            {referrals.map((r) => (
              <div key={r.id} className="settings-info-row" style={{ alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>{r.businessName}</p>
                  <p className="text-muted" style={{ margin: "0.15rem 0 0", fontSize: "0.75rem" }}>
                    @{r.username} · CA {formatCurrency(r.lifetimeGmv)}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "#059669" }}>
                    +{formatCurrency(r.commissionEarnedTotal)}
                  </p>
                  <span
                    className="settings-verified-badge"
                    style={
                      r.isBoosted
                        ? { marginTop: "0.25rem" }
                        : { background: "#e0e7ff", color: "#4338ca", marginTop: "0.25rem" }
                    }
                  >
                    {r.isBoosted ? "1%" : "0,25%"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
