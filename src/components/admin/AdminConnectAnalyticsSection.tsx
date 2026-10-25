"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AdminDateRangePopover } from "./AdminDateRangePopover";
import { CORAL, NAVY } from "./admin-chart-colors";
import type { ConnectAnalyticsDayPoint, ConnectAnalyticsSummaryData } from "./admin-types";
import { EmptyState, Panel, StatStrip, Tabs } from "./AdminUI";

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

  const activeRange = QUICK_RANGES.find((range) => range.from() === dateFrom && daysAgo(0) === dateTo);
  const totals = days.reduce(
    (acc, d) => ({
      count: acc.count + d.transactions_count,
      gmv: acc.gmv + d.gmv,
      revenue: acc.revenue + d.xaalispay_fee_revenue,
      net: acc.net + d.net_revenue,
    }),
    { count: 0, gmv: 0, revenue: 0, net: 0 }
  );
  const axisTick = { fontSize: 11, fill: "#5F6672" };

  return (
    <section className="admin-section">
      <div className="ax-filterbar">
        <Tabs
          label="Période"
          value={activeRange?.label ?? "custom"}
          onChange={(label) => {
            const range = QUICK_RANGES.find((r) => r.label === label);
            if (!range) return;
            setDateFrom(range.from());
            setDateTo(daysAgo(0));
          }}
          options={QUICK_RANGES.map((range) => ({ value: range.label as string, label: range.label }))}
        />
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

      <StatStrip
        items={[
          { label: "Bénéfice net Connect", value: formatCurrency(totals.net), hint: "sur la période", tone: "accent" },
          { label: "Revenu brut", value: formatCurrency(totals.revenue), hint: "commissions acquises" },
          { label: "Volume payé", value: formatCurrency(totals.gmv) },
          { label: "Transactions payées", value: totals.count },
        ]}
      />

      {summary && (
        <div className="ax-windows">
          {(
            [
              ["Aujourd'hui", summary.today],
              ["7 derniers jours", summary.last_7_days],
              ["30 derniers jours", summary.last_30_days],
              ["Depuis le début", summary.all_time],
            ] as const
          ).map(([title, metrics]) => (
            <div key={title} className="ax-window">
              <span className="ax-window-title">{title}</span>
              <span className="ax-window-value admin-mono">{formatCurrency(metrics.net_revenue)}</span>
              <span className="ax-window-sub">
                net · {metrics.transactions_count} transaction(s) · brut {formatCurrency(metrics.xaalispay_fee_revenue)}
              </span>
            </div>
          ))}
        </div>
      )}

      {chartLoading ? (
        <p className="ax-muted ax-pad">Chargement…</p>
      ) : !hasActivity ? (
        <Panel flush={false}>
          <EmptyState icon={LineChartIcon} title="Aucune activité Connect" hint="Aucune transaction sur cette période." />
        </Panel>
      ) : (
        <div className="ax-charts">
          <Panel title="Transactions & volume Connect" flush={false}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={days}>
                <CartesianGrid stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
                <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} cursor={{ fill: "#F5F5F5" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar yAxisId="left" dataKey="transactions_count" name="Transactions" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line yAxisId="right" dataKey="gmv" name="Volume (FCFA)" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Revenu XaalisPay Connect" flush={false}>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={days}>
                <CartesianGrid stroke="#EEEEEE" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} cursor={{ fill: "#F5F5F5" }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                <Bar dataKey="xaalispay_fee_revenue" name="Revenu brut" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line dataKey="net_revenue" name="Bénéfice net" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </section>
  );
}
