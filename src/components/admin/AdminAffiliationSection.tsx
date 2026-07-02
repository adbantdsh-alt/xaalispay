"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { NAVY } from "./admin-chart-colors";
import { formatAdminDate, type AffiliateProgramSummary, type ReferrerGroupRow } from "./admin-types";

const ORDERING_OPTIONS = [
  { value: "-total_commission", label: "Commission la plus élevée" },
  { value: "-referral_count", label: "Plus de filleuls" },
  { value: "-latest_boost_expires_at", label: "Boost expirant le plus tard" },
] as const;

function ExtendBoostCell({
  referrerId,
  onExtendAllBoost,
}: {
  referrerId: number;
  onExtendAllBoost: (referrerId: number, days: number) => Promise<boolean>;
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
    const ok = await onExtendAllBoost(referrerId, parsed);
    setExtending(false);
    if (ok) setDays("");
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
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
  referrers,
  summary,
  onSearch,
  onExtendAllBoost,
  onOpenDetail,
}: {
  referrers: ReferrerGroupRow[];
  summary: AffiliateProgramSummary | null;
  onSearch: (params: { search?: string; ordering?: string }) => void;
  onExtendAllBoost: (referrerId: number, days: number) => Promise<boolean>;
  onOpenDetail: (referrerId: number, businessName: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-total_commission");

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  const topReferrers = [...referrers]
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10)
    .map((r) => ({ name: r.referrerBusinessName, total: r.totalCommission }));

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
            placeholder="Rechercher un parrain…"
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

      {referrers.length === 0 ? (
        <p className="admin-empty">Aucun parrain trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Parrain</th>
                <th>Filleuls</th>
                <th>CA global</th>
                <th>Commission totale</th>
                <th>Palier</th>
                <th>Prolonger le palier 1 %</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr
                  key={r.referrerId}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenDetail(r.referrerId, r.referrerBusinessName)}
                >
                  <td>
                    <strong>{r.referrerBusinessName}</strong>
                    <span className="admin-cell-sub admin-mono">@{r.referrerUsername}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${r.boostedCount > 0 ? "good" : "neutral"}`}>
                      {r.boostedCount} boostés
                    </span>
                    <span className="admin-cell-sub">/ {r.referralCount} au total</span>
                  </td>
                  <td className="admin-mono">{formatCurrency(r.totalLifetimeGmv)}</td>
                  <td className="admin-mono">{formatCurrency(r.totalCommission)}</td>
                  <td>
                    <span className={`admin-badge ${r.boostedCount > 0 ? "good" : "neutral"}`}>
                      {r.boostedCount > 0 ? "1 %" : "0,25 %"}
                    </span>
                    <span className="admin-cell-sub">
                      jusqu&apos;au {formatAdminDate(r.latestBoostExpiresAt)}
                    </span>
                  </td>
                  <td>
                    <ExtendBoostCell referrerId={r.referrerId} onExtendAllBoost={onExtendAllBoost} />
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
