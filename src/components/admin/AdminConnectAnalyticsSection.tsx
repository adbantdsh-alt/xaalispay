"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AdminDateRangePopover } from "./AdminDateRangePopover";
import { CORAL, NAVY } from "./admin-chart-colors";
import type { ConnectAnalyticsDayPoint, ConnectAnalyticsSummaryData, ConnectAnalyticsWindowMetrics } from "./admin-types";

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

export function AdminConnectAnalyticsSection() {
  const [summary, setSummary] = useState<ConnectAnalyticsSummaryData | null>(null);
  const [days, setDays] = useState<ConnectAnalyticsDayPoint[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(daysAgo(0));
  const [chartLoading, setChartLoading] = useState(true);

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

  const isQuickRangeActive = QUICK_RANGES.some((range) => range.from() === dateFrom && daysAgo(0) === dateTo);
  const hasActivity = days.some((d) => d.transactions_count > 0 || d.xaalispay_fee_revenue > 0);

  return (
    <section className="admin-section">
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
    </section>
  );
}
