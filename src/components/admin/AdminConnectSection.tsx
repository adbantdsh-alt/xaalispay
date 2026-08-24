"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AdminDateRangePopover } from "./AdminDateRangePopover";
import { CORAL, NAVY } from "./admin-chart-colors";
import { activeStatusClass, formatAdminDate, type ConnectAnalyticsDayPoint, type ConnectAnalyticsSummaryData, type ConnectAnalyticsWindowMetrics, type ConnectOverviewData, type ConnectPlatformRow } from "./admin-types";

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

const QUICK_RANGES = [
  { label: "Aujourd'hui", from: () => daysAgo(0) },
  { label: "7 jours", from: () => daysAgo(6) },
  { label: "30 jours", from: () => daysAgo(29) },
  { label: "Tout", from: () => "2024-01-01" },
] as const;

function tickDate(value: string) {
  return value.slice(5);
}

function tooltipLabel(label: unknown) {
  return tickDate(String(label));
}

function tooltipCurrency(value: unknown) {
  return formatCurrency(Number(value));
}

function WindowCard({ title, metrics }: { title: string; metrics?: ConnectAnalyticsWindowMetrics }) {
  return (
    <article className="admin-kpi">
      <p className="admin-kpi-label">{title}</p>
      <p className="admin-kpi-value">{metrics ? formatCurrency(metrics.xaalispay_fee_revenue) : "—"}</p>
      <p className="admin-kpi-sub">{metrics ? `${metrics.transactions_count} transaction(s)` : ""}</p>
    </article>
  );
}

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "-transactions_count", label: "Plus de transactions" },
  { value: "name", label: "Nom (A→Z)" },
] as const;

export function AdminConnectSection({
  overview,
  platforms,
  onSearchPlatforms,
  onSelectPlatform,
}: {
  overview: ConnectOverviewData | null;
  platforms: ConnectPlatformRow[];
  onSearchPlatforms: (params: { search?: string; ordering?: string }) => void;
  onSelectPlatform: (platformId: string) => void;
}) {
  const [summary, setSummary] = useState<ConnectAnalyticsSummaryData | null>(null);
  const [days, setDays] = useState<ConnectAnalyticsDayPoint[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(daysAgo(0));
  const [chartLoading, setChartLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    apiFetch("/api/admin/connect/analytics/summary").then(async (res) => {
      if (res.ok) setSummary(await res.json());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    apiFetch(`/api/admin/connect/analytics/timeseries?date_from=${dateFrom}&date_to=${dateTo}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) setDays((await res.json()).days);
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const id = setTimeout(() => onSearchPlatforms({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  const isQuickRangeActive = QUICK_RANGES.some((range) => range.from() === dateFrom && daysAgo(0) === dateTo);
  const hasActivity = days.some((d) => d.transactions_count > 0 || d.xaalispay_fee_revenue > 0);

  return (
    <section className="admin-section">
      <div className="admin-hint-banner">
        <span className="admin-hint-dot" aria-hidden="true" />
        <span className="admin-hint-strong">Revenu XaalisPay Connect</span>
        <span className="admin-hint-muted">
          — commissions perçues via les plateformes tierces intégrées, distinct du revenu natif de l&apos;app
          mobile/web (jamais additionné avec celui-ci).
        </span>
      </div>

      <div className="admin-kpi-grid">
        <article className="admin-kpi">
          <p className="admin-kpi-label">Revenu Connect total</p>
          <p className="admin-kpi-value">{overview ? formatCurrency(overview.revenue.xaalispay_fee_total) : "—"}</p>
          <p className="admin-kpi-sub">{overview ? `${overview.transactions_count} transaction(s)` : ""}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Solde trésorerie XaalisPay</p>
          <p className="admin-kpi-value">
            {overview ? formatCurrency(overview.revenue.treasury_available_balance) : "—"}
          </p>
          <p className="admin-kpi-sub">Disponible pour retrait</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Plateformes actives</p>
          <p className="admin-kpi-value">{overview ? overview.active_platforms_count : "—"}</p>
          <p className="admin-kpi-sub">{overview ? `${overview.platforms_count} au total` : ""}</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Volume Connect (GMV)</p>
          <p className="admin-kpi-value">{overview ? formatCurrency(overview.gmv_total) : "—"}</p>
          <p className="admin-kpi-sub">Toutes transactions confondues</p>
        </article>
      </div>

      <div className="admin-kpi-grid">
        <WindowCard title="Aujourd'hui" metrics={summary?.today} />
        <WindowCard title="7 derniers jours" metrics={summary?.last_7_days} />
        <WindowCard title="30 derniers jours" metrics={summary?.last_30_days} />
        <WindowCard title="Depuis le début" metrics={summary?.all_time} />
      </div>

      <div className="admin-daterange">
        {QUICK_RANGES.map((range) => (
          <button
            key={range.label}
            type="button"
            className={`admin-filter${range.from() === dateFrom && daysAgo(0) === dateTo ? " is-active" : ""}`}
            onClick={() => {
              setDateFrom(range.from());
              setDateTo(daysAgo(0));
            }}
          >
            {range.label}
          </button>
        ))}
        <AdminDateRangePopover
          dateFrom={dateFrom}
          dateTo={dateTo}
          isActive={!isQuickRangeActive}
          maxDate={daysAgo(0)}
          onApply={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
      </div>

      {chartLoading ? (
        <p className="admin-empty">Chargement…</p>
      ) : !hasActivity ? (
        <p className="admin-empty">Aucune activité Connect sur cette période.</p>
      ) : (
        <>
          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Transactions &amp; volume Connect</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} iconType="square" />
                <Bar yAxisId="left" dataKey="transactions_count" name="Transactions" fill={NAVY} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" dataKey="gmv" name="Volume (FCFA)" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Revenu XaalisPay Connect</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} />
                <Bar dataKey="xaalispay_fee_revenue" name="Revenu XaalisPay" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </>
      )}

      <article className="admin-card">
        <h2 className="admin-card-title">Plateformes connectées</h2>
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input-field input-compact"
              placeholder="Rechercher une plateforme…"
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

        {platforms.length === 0 ? (
          <p className="admin-empty">Aucune plateforme connectée.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plateforme</th>
                  <th>Pays</th>
                  <th>Commission XaalisPay</th>
                  <th>Transactions</th>
                  <th>Revenu généré</th>
                  <th>Connectée le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.id} className="admin-row-click" onClick={() => onSelectPlatform(p.id)}>
                    <td>
                      <strong>{p.name}</strong>
                      <span className="admin-cell-sub admin-mono">{p.slug}</span>
                    </td>
                    <td className="admin-mono">{p.country}</td>
                    <td className="admin-mono">{(Number(p.xaalispayFeePercent) * 100).toFixed(2)} %</td>
                    <td className="admin-mono">{p.transactionsCount}</td>
                    <td className="admin-mono">{formatCurrency(p.revenueTotal)}</td>
                    <td>{formatAdminDate(p.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${activeStatusClass(p.isActive)}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
