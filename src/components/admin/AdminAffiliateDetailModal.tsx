"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptAffiliateRow } from "./admin-adapters";
import { formatAdminDate, type AffiliateRow } from "./admin-types";

function ExtendBoostCell({
  referral,
  onExtendBoost,
}: {
  referral: AffiliateRow;
  onExtendBoost: (referralId: string, days: number) => Promise<boolean>;
}) {
  const [days, setDays] = useState("");
  const [extending, setExtending] = useState(false);
  const [error, setError] = useState("");

  const handleExtend = async () => {
    const parsed = Number(days);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Jours invalides.");
      return;
    }
    setError("");
    setExtending(true);
    const ok = await onExtendBoost(referral.id, parsed);
    setExtending(false);
    if (ok) setDays("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <input
          type="number"
          min={1}
          placeholder="Jours"
          className="input-field input-compact"
          style={{ width: "5.5rem" }}
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <button type="button" className="btn-secondary" disabled={extending} onClick={handleExtend}>
          {extending ? "…" : "Prolonger"}
        </button>
      </div>
      {error && <span className="admin-cell-sub admin-health-bad">{error}</span>}
    </div>
  );
}

export function AdminAffiliateDetailModal({
  referrerId,
  referrerName,
  onClose,
  onExtendBoost,
}: {
  referrerId: number | null;
  referrerName: string;
  onClose: () => void;
  onExtendBoost: (referralId: string, days: number) => Promise<boolean>;
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

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article
        className="admin-modal admin-modal--affiliate-detail"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-modal-head">
          <div className="admin-modal-head-title">
            Filleuls de {referrerName}
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>

        {loading && <p className="admin-empty">Chargement…</p>}
        {!loading && error && <p className="admin-empty">{error}</p>}
        {!loading && !error && referrals.length === 0 && (
          <p className="admin-empty">Aucun filleul trouvé.</p>
        )}
        {!loading && referrals.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Filleul</th>
                  <th>CA</th>
                  <th>Commission gagnée</th>
                  <th>Palier</th>
                  <th>Prolonger le palier 1 %</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.businessName}</strong>
                      <span className="admin-cell-sub admin-mono">@{r.username}</span>
                    </td>
                    <td className="admin-mono">{formatCurrency(r.lifetimeGmv)}</td>
                    <td className="admin-mono">{formatCurrency(r.commissionEarnedTotal)}</td>
                    <td>
                      <span className={`admin-badge ${r.isBoosted ? "good" : "neutral"}`}>
                        {r.isBoosted ? "1 %" : "0,25 %"}
                      </span>
                      <span className="admin-cell-sub">
                        jusqu&apos;au {formatAdminDate(r.boostExpiresAt)}
                      </span>
                    </td>
                    <td>
                      <ExtendBoostCell referral={r} onExtendBoost={onExtendBoost} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
