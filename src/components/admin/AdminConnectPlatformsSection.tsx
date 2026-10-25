"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Layers } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptConnectPlatformRow } from "./admin-adapters";
import { AdminConnectPlatformDetail } from "./AdminConnectPlatformDetail";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { formatAdminDate, type ConnectPlatformRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField, StatStrip, StatusPill, Tabs } from "./AdminUI";

const AUTO_REFRESH_MS = 30_000;

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "-transactions_count", label: "Plus de transactions" },
  { value: "name", label: "Nom (A→Z)" },
] as const;

export function AdminConnectPlatformsSection() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<ConnectPlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string>("-created_at");
  const paramsRef = useRef({ search, ordering });
  paramsRef.current = { search, ordering };

  const fetchPlatforms = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search: s, ordering: o } = paramsRef.current;
      if (s) qs.set("search", s);
      if (o) qs.set("ordering", o);
      const res = await apiFetch(`/api/admin/connect/platforms${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/connect/platforms")) return;
      if (res.ok) setPlatforms((await res.json()).map(adaptConnectPlatformRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    const id = setTimeout(() => fetchPlatforms(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  useEffect(() => {
    const id = setInterval(() => fetchPlatforms(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchPlatforms]);

  const totals = platforms.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenueTotal,
      net: acc.net + p.netRevenue,
      merchants: acc.merchants + p.merchantAvailableBalance,
    }),
    { revenue: 0, net: 0, merchants: 0 }
  );

  return (
    <section className="admin-section">
      <StatStrip
        items={[
          {
            label: "Plateformes",
            value: platforms.length,
            hint: `${platforms.filter((p) => p.isActive).length} active(s)`,
            tone: "accent",
          },
          { label: "Revenu brut XaalisPay", value: formatCurrency(totals.revenue), hint: "commissions Connect" },
          { label: "Bénéfice net", value: formatCurrency(totals.net), hint: "après frais Bictorys de leurs flux" },
          { label: "Fonds marchands disponibles", value: formatCurrency(totals.merchants), hint: "argent de tiers" },
        ]}
      />

      <Panel
        title="Plateformes connectées"
        count={platforms.length}
        toolbar={
          <>
            <SearchField value={search} onChange={setSearch} placeholder="Rechercher une plateforme…" />
            <Tabs
              label="Trier"
              value={ordering}
              onChange={setOrdering}
              options={ORDERING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </>
        }
      >
        {loading && platforms.length === 0 ? (
          <p className="ax-muted ax-pad">Chargement…</p>
        ) : platforms.length === 0 ? (
          <EmptyState icon={Layers} title="Aucune plateforme connectée" />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Plateforme</th>
                <th>Commissions</th>
                <th className="is-num">Transactions</th>
                <th className="is-num">Revenu brut</th>
                <th className="is-num">Bénéfice net</th>
                <th className="is-num">Fonds marchands</th>
                <th>Statut</th>
                <th aria-label="Ouvrir" />
              </tr>
            </thead>
            <tbody>
              {platforms.map((p) => (
                <tr
                  key={p.id}
                  className="ax-row"
                  tabIndex={0}
                  onClick={() => setSelectedPlatformId(p.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedPlatformId(p.id)}
                >
                  <td>
                    <EntityCell name={p.name} sub={`${p.slug} · ${p.country} · depuis le ${formatAdminDate(p.createdAt)}`} />
                  </td>
                  <td className="is-nowrap">
                    <span className="ax-cell-strong admin-mono">
                      {(Number(p.xaalispayFeePercent) * 100).toFixed(2)} % · {(Number(p.xaalispayPayoutFeePercent) * 100).toFixed(2)} %
                    </span>
                    <span className="ax-cell-sub">encaissement · retrait</span>
                  </td>
                  <td className="is-num">{p.transactionsCount}</td>
                  <td className="is-num">{formatCurrency(p.revenueTotal)}</td>
                  <td className="is-num ax-cell-strong">{formatCurrency(p.netRevenue)}</td>
                  <td className="is-num">{formatCurrency(p.merchantAvailableBalance)}</td>
                  <td>
                    <StatusPill tone={p.isActive ? "good" : "neutral"} label={p.isActive ? "Active" : "Inactive"} />
                  </td>
                  <td className="ax-chevron">
                    <ChevronRight size={16} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {selectedPlatformId && (
        <AdminConnectPlatformDetail platformId={selectedPlatformId} onClose={() => setSelectedPlatformId(null)} />
      )}
    </section>
  );
}
