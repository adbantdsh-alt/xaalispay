"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { NAVY } from "./admin-chart-colors";
import { formatAdminDate, type AffiliateProgramSummary, type AffiliateRow } from "./admin-types";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récents" },
  { value: "-lifetime_gmv", label: "CA filleul le plus élevé" },
  { value: "-commission_earned_total", label: "Commission la plus élevée" },
  { value: "-boost_expires_at", label: "Boost expirant le plus tard" },
] as const;

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

export function AdminAffiliationSection({
  referrals,
  summary,
  onSearch,
  onExtendBoost,
}: {
  referrals: AffiliateRow[];
  summary: AffiliateProgramSummary | null;
  onSearch: (params: { search?: string; ordering?: string }) => void;
  onExtendBoost: (referralId: string, days: number) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  const topReferrers = useMemo(() => {
    const byReferrer = new Map<string, { name: string; total: number }>();
    for (const r of referrals) {
      const prev = byReferrer.get(r.referrerUsername)?.total ?? 0;
      byReferrer.set(r.referrerUsername, { name: r.referrerBusinessName, total: prev + r.commissionEarnedTotal });
    }
    return [...byReferrer.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [referrals]);

  return (
    <section className="admin-section">
      <div className="admin-kpi-grid">
        <article className="admin-kpi">
          <p className="admin-kpi-label">Parrainages actifs (boost 1 %)</p>
          <p className="admin-kpi-value">{summary ? summary.boostedCount : "—"}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Parrainages à vie (0,25 %)</p>
          <p className="admin-kpi-value">{summary ? summary.lifetimeCount : "—"}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Total parrainages</p>
          <p className="admin-kpi-value">{summary ? summary.totalReferrals : "—"}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Commissions versées (cumulé)</p>
          <p className="admin-kpi-value">{summary ? formatCurrency(summary.commissionsPaidTotal) : "—"}</p>
        </article>
      </div>

      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input-field input-compact"
            placeholder="Rechercher (parrain ou filleul)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field input-compact" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          {ORDERING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {referrals.length === 0 ? (
        <p className="admin-empty">Aucun parrainage trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Parrain</th>
                <th>Filleul</th>
                <th>CA filleul</th>
                <th>Commission gagnée</th>
                <th>Palier</th>
                <th>Prolonger le palier 1 %</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.referrerBusinessName}</strong>
                    <span className="admin-cell-sub admin-mono">@{r.referrerUsername}</span>
                  </td>
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
                    <span className="admin-cell-sub">jusqu&apos;au {formatAdminDate(r.boostExpiresAt)}</span>
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

      {topReferrers.length > 0 && (
        <article className="admin-card admin-chart-card">
          <h2 className="admin-card-title">Top parrains par commission gagnée</h2>
          <ResponsiveContainer width="100%" height={Math.max(160, topReferrers.length * 36)}>
            <BarChart layout="vertical" data={topReferrers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="total" name="Commission gagnée" fill={NAVY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      )}
    </section>
  );
}
