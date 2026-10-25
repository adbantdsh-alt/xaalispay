"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptAffiliateRow } from "./admin-adapters";
import { formatAdminDate, type AffiliateRow } from "./admin-types";
import { DetailPanel, DetailSection, StatusPill } from "./AdminUI";

export function AdminAffiliateDetailModal({
  referrerId,
  referrerName,
  onClose,
}: {
  referrerId: number | null;
  referrerName: string;
  onClose: () => void;
}) {
  const [referrals, setReferrals] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (referrerId === null) {
      setReferrals([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    apiFetch(`/api/admin/affiliates?referrer_id=${referrerId}`)
      .then(async (res) => {
        if (!res.ok) {
          setError("Impossible de charger les filleuls.");
          return;
        }
        const data = await res.json();
        setReferrals(data.map(adaptAffiliateRow));
      })
      .finally(() => setLoading(false));
  }, [referrerId]);

  if (referrerId === null) return null;

  const totalCommission = referrals.reduce((sum, r) => sum + r.commissionEarnedTotal, 0);

  return (
    <DetailPanel title={`Filleuls de ${referrerName}`} subtitle={`${referrals.length} filleul(s)`} onClose={onClose}>
      {loading && <p className="ax-muted ax-pad">Chargement…</p>}
      {!loading && error && <p className="ax-muted ax-pad">{error}</p>}
      {!loading && !error && referrals.length === 0 && <p className="ax-muted ax-pad">Aucun filleul trouvé.</p>}
      {!loading && referrals.length > 0 && (
        <>
          <div className="ax-summary">
            <div>
              <div className="ax-summary-label">Commission totale gagnée</div>
              <div className="ax-summary-amount">{formatCurrency(totalCommission)}</div>
            </div>
          </div>
          <DetailSection title="Filleuls">
            <ul className="ax-list">
              {referrals.map((r) => (
                <li key={r.id}>
                  <span className="ax-list-main">
                    <span className="ax-list-title">{r.businessName}</span>
                    <span className="ax-list-sub">
                      CA {formatCurrency(r.lifetimeGmv)} · palier jusqu&apos;au {formatAdminDate(r.boostExpiresAt)}
                    </span>
                  </span>
                  <span className="ax-list-amount admin-mono">{formatCurrency(r.commissionEarnedTotal)}</span>
                  <StatusPill tone={r.isBoosted ? "good" : "neutral"} label={r.isBoosted ? "1 %" : "0,25 %"} />
                </li>
              ))}
            </ul>
          </DetailSection>
        </>
      )}
    </DetailPanel>
  );
}
