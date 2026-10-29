"use client";

import { useEffect, useState } from "react";
import { Handshake } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { NAVY } from "./admin-chart-colors";
import { boostTierDetail, type AffiliateProgramSummary, type ReferrerGroupRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField, StatStrip, StatusPill, Tabs } from "./AdminUI";

const ORDERING_OPTIONS = [
  { value: "-total_commission", label: "Commission la plus élevée" },
  { value: "-referral_count", label: "Plus de filleuls" },
  { value: "-latest_boost_expires_at", label: "Boost expirant le plus tard" },
] as const;

export function ExtendBoostCell({
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
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <span className="ax-inline-form">
        <label className="ax-sr-only" htmlFor={`extend-all-${referrerId}`}>
          Jours de prolongation du palier 1 %
        </label>
        <input
          id={`extend-all-${referrerId}`}
          type="number"
          min={1}
          placeholder="Jours"
          className="ax-input"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <button type="button" className="ax-btn ax-btn--sm" disabled={extending} onClick={handleExtend}>
          {extending ? "…" : "Prolonger"}
        </button>
      </span>
      {error && <span className="ax-cell-sub">{error}</span>}
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
  const [ordering, setOrdering] = useState<string>("-total_commission");

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
      <StatStrip
        items={[
          {
            label: "Commissions versées",
            value: summary ? formatCurrency(summary.commissionsPaidTotal) : "—",
            hint: "payées par XaalisPay, cumulé",
            tone: "accent",
          },
          { label: "Parrainages au palier 1 %", value: summary ? summary.boostedCount : "—", hint: "boost des 90 premiers jours" },
          { label: "Parrainages à vie (0,25 %)", value: summary ? summary.lifetimeCount : "—" },
          { label: "Total parrainages", value: summary ? summary.totalReferrals : "—" },
        ]}
      />

      <Panel
        title="Parrains"
        count={referrers.length}
        toolbar={
          <>
            <SearchField value={search} onChange={setSearch} placeholder="Rechercher un parrain…" />
            <Tabs
              label="Trier"
              value={ordering}
              onChange={setOrdering}
              options={ORDERING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </>
        }
      >
        {referrers.length === 0 ? (
          <EmptyState icon={Handshake} title="Aucun parrain" hint="Aucun vendeur n'a encore parrainé d'autre vendeur." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Parrain</th>
                <th>Filleuls</th>
                <th className="is-num">CA des filleuls</th>
                <th className="is-num">Commission</th>
                <th>Palier</th>
                <th>Prolonger le palier 1 %</th>
              </tr>
            </thead>
            <tbody>
              {referrers.map((r) => (
                <tr
                  key={r.referrerId}
                  className="ax-row"
                  tabIndex={0}
                  onClick={() => onOpenDetail(r.referrerId, r.referrerBusinessName)}
                  onKeyDown={(e) => e.key === "Enter" && onOpenDetail(r.referrerId, r.referrerBusinessName)}
                >
                  <td>
                    <EntityCell name={r.referrerBusinessName} sub={`@${r.referrerUsername}`} />
                  </td>
                  <td>
                    <span className="ax-cell-strong">{r.referralCount}</span>
                    <span className="ax-cell-sub">dont {r.boostedCount} au palier 1 %</span>
                  </td>
                  <td className="is-num">{formatCurrency(r.totalLifetimeGmv)}</td>
                  <td className="is-num">{formatCurrency(r.totalCommission)}</td>
                  <td>
                    <StatusPill tone={r.boostedCount > 0 ? "good" : "neutral"} label={r.boostedCount > 0 ? "1 %" : "0,25 %"} />
                    <span className="ax-cell-sub">{boostTierDetail(r.boostedCount > 0, r.latestBoostExpiresAt)}</span>
                  </td>
                  <td>
                    <ExtendBoostCell referrerId={r.referrerId} onExtendAllBoost={onExtendAllBoost} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {topReferrers.length > 0 && (
        <Panel title="Top parrains par commission gagnée" flush={false}>
          <ResponsiveContainer width="100%" height={Math.max(160, topReferrers.length * 34)}>
            <BarChart layout="vertical" data={topReferrers} margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="#EEEEEE" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10, fill: "#5F6672" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#1E3A5F" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} cursor={{ fill: "#F5F5F5" }} />
              <Bar dataKey="total" name="Commission gagnée" fill={NAVY} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </section>
  );
}
