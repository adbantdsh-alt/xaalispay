"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AdminDateRangePopover } from "./AdminDateRangePopover";
import { CORAL, NAVY, NEGATIVE_RED, POSITIVE_GREEN } from "./admin-chart-colors";
import type { AnalyticsDayPoint, AnalyticsSummaryData, AnalyticsWindowMetrics } from "./admin-types";

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
  return value.slice(5); // MM-DD, l'année alourdit l'axe sans aider sur une plage de quelques semaines
}

// recharts type ses callbacks de Tooltip avec des génériques très larges
// (ReactNode/ValueType) — on coerce en string/number nous-mêmes plutôt que
// de se battre avec ces types pour un simple formatage d'infobulle.
function tooltipLabel(label: unknown) {
  return tickDate(String(label));
}

function tooltipCurrency(value: unknown) {
  return formatCurrency(Number(value));
}

function tooltipVolume(value: unknown, name: unknown): [string | number, string] {
  const label = String(name);
  return [label === "Volume d'affaires (FCFA)" ? formatCurrency(Number(value)) : Number(value), label];
}

function WindowCard({ title, metrics }: { title: string; metrics?: AnalyticsWindowMetrics }) {
  return (
    <article className="admin-kpi">
      <p className="admin-kpi-label">{title}</p>
      <p className="admin-kpi-value">{metrics ? formatCurrency(metrics.gmv) : "—"}</p>
      <p className="admin-kpi-sub">
        {metrics ? `${metrics.orders_count} commande(s)` : ""}
        {metrics && metrics.new_sellers > 0 ? ` · +${metrics.new_sellers} vendeur(s)` : ""}
      </p>
    </article>
  );
}

export function AdminAnalyticsSection() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [days, setDays] = useState<AnalyticsDayPoint[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(daysAgo(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/analytics/summary").then(async (res) => {
      if (res.ok) setSummary(await res.json());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/api/admin/analytics/timeseries?date_from=${dateFrom}&date_to=${dateTo}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Plage de dates invalide.");
          setDays([]);
          return;
        }
        const data = await res.json();
        setDays(data.days);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const hasActivity = days.some(
    (d) =>
      d.orders_count > 0 ||
      d.buyer_protection_fees > 0 ||
      d.seller_commissions > 0 ||
      d.affiliate_commissions > 0 ||
      d.payout_volume > 0 ||
      d.new_sellers > 0
  );

  const isQuickRangeActive = QUICK_RANGES.some(
    (range) => range.from() === dateFrom && daysAgo(0) === dateTo
  );

  // Affiliation/Bictorys sont des coûts — empilés en valeurs négatives dans
  // le même stackId que les revenus positifs, recharts les place alors
  // naturellement sous l'axe zéro.
  const netProfitChartData = useMemo(
    () =>
      days.map((d) => ({
        ...d,
        affiliate_commissions_neg: -d.affiliate_commissions,
        bictorys_fees_estimated_neg: -d.bictorys_fees_estimated,
      })),
    [days]
  );

  return (
    <section className="admin-section">
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

      <div className="admin-kpi-grid">
        <WindowCard title="Aujourd'hui" metrics={summary?.today} />
        <WindowCard title="7 derniers jours" metrics={summary?.last_7_days} />
        <WindowCard title="30 derniers jours" metrics={summary?.last_30_days} />
        <WindowCard title="Depuis le début" metrics={summary?.all_time} />
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-empty">Chargement…</p>
      ) : !hasActivity ? (
        <p className="admin-empty">Aucune activité sur cette période.</p>
      ) : (
        <>
          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Commandes &amp; volume d&apos;affaires</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipVolume} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} iconType="square" />
                <Bar yAxisId="left" dataKey="orders_count" name="Commandes" fill={NAVY} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" dataKey="gmv" name="Volume d'affaires (FCFA)" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Revenu XaalisPay</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} iconType="square" />
                <Bar dataKey="buyer_protection_fees" name="Frais protection acheteur" stackId="revenue" fill={NAVY} />
                <Bar
                  dataKey="seller_commissions"
                  name="Commissions vendeur"
                  stackId="revenue"
                  fill={CORAL}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Bénéfice net XaalisPay</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={netProfitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} />
                <Legend wrapperStyle={{ fontSize: 11.5 }} iconType="square" />
                <Bar dataKey="buyer_protection_fees" name="Frais protection acheteur" stackId="net" fill={NAVY} />
                <Bar dataKey="seller_commissions" name="Commissions vendeur" stackId="net" fill={CORAL} />
                <Bar
                  dataKey="affiliate_commissions_neg"
                  name="Commissions affiliation"
                  stackId="net"
                  fill={NEGATIVE_RED}
                />
                <Bar
                  dataKey="bictorys_fees_estimated_neg"
                  name="Frais Bictorys (estimés)"
                  stackId="net"
                  fill="#8C8C8C"
                  radius={[4, 4, 0, 0]}
                />
                <Line dataKey="net_profit" name="Bénéfice net" stroke={POSITIVE_GREEN} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Volume de retrait</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} />
                <Bar dataKey="payout_volume" name="Volume de retrait" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Nouveaux vendeurs</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} />
                <Bar dataKey="new_sellers" name="Nouveaux vendeurs" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </>
      )}
    </section>
  );
}
