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
import { LineChart as LineChartIcon } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AdminDateRangePopover } from "./AdminDateRangePopover";
import { CORAL, NAVY, NEGATIVE_RED, POSITIVE_GREEN } from "./admin-chart-colors";
import type { AnalyticsDayPoint, AnalyticsSummaryData } from "./admin-types";
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

// Style d'axes commun (admin v2) : grille horizontale discrète, pas de
// traits d'axe, libellés gris.
const AXIS_TICK = { fontSize: 11, fill: "#5F6672" };
const GRID = { stroke: "#EEEEEE", vertical: false } as const;
const LEGEND = { wrapperStyle: { fontSize: 11, paddingTop: 8 }, iconType: "circle" as const, iconSize: 8 };

export function AdminAnalyticsSection() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [days, setDays] = useState<AnalyticsDayPoint[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(daysAgo(0));
  // Période réellement couverte : le backend ramène « Tout » au premier jour
  // d'activité réelle.
  const [coveredFrom, setCoveredFrom] = useState<string | null>(null);
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
        setCoveredFrom(data.date_from ?? null);
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

  const activeRange = QUICK_RANGES.find((range) => range.from() === dateFrom && daysAgo(0) === dateTo);
  const totals = days.reduce(
    (acc, d) => ({
      gmv: acc.gmv + d.gmv,
      orders: acc.orders + d.orders_count,
      net: acc.net + d.net_profit,
      sellers: acc.sellers + d.new_sellers,
    }),
    { gmv: 0, orders: 0, net: 0, sellers: 0 }
  );

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
        <span className="ax-muted">
          Du {(coveredFrom ?? dateFrom).split("-").reverse().join("/")} au {dateTo.split("-").reverse().join("/")}
        </span>
      </div>

      <StatStrip
        items={[
          { label: "Bénéfice net", value: formatCurrency(totals.net), hint: "sur la période, frais Bictorys déduits", tone: "accent" },
          { label: "Volume d'affaires", value: formatCurrency(totals.gmv), hint: "commandes payées" },
          { label: "Commandes payées", value: totals.orders },
          { label: "Nouveaux vendeurs", value: totals.sellers },
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
              <span className="ax-window-value admin-mono">{formatCurrency(metrics.gmv)}</span>
              <span className="ax-window-sub">
                {metrics.orders_count} commande(s) · net {formatCurrency(metrics.net_profit)}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="ax-muted ax-pad">Chargement…</p>
      ) : !hasActivity ? (
        <Panel flush={false}>
          <EmptyState icon={LineChartIcon} title="Aucune activité" hint="Aucune commande ni aucun retrait sur cette période." />
        </Panel>
      ) : (
        <div className="ax-charts">
          <Panel title="Commandes & volume d'affaires" flush={false}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={days}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipVolume} cursor={{ fill: "#F5F5F5" }} />
                <Legend {...LEGEND} />
                <Bar yAxisId="left" dataKey="orders_count" name="Commandes" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line yAxisId="right" dataKey="gmv" name="Volume d'affaires (FCFA)" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Bénéfice net XaalisPay" flush={false}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={netProfitChartData} stackOffset="sign">
                <CartesianGrid {...GRID} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} cursor={{ fill: "#F5F5F5" }} />
                <Legend {...LEGEND} />
                <Bar dataKey="buyer_protection_fees" name="Frais protection" stackId="net" fill={NAVY} maxBarSize={22} />
                <Bar dataKey="seller_commissions" name="Commissions vendeur" stackId="net" fill={CORAL} maxBarSize={22} />
                <Bar dataKey="affiliate_commissions_neg" name="Affiliation" stackId="net" fill={NEGATIVE_RED} maxBarSize={22} />
                <Bar dataKey="bictorys_fees_estimated_neg" name="Frais Bictorys" stackId="net" fill="#9FB0C6" maxBarSize={22} />
                <Line dataKey="net_profit" name="Bénéfice net" stroke={POSITIVE_GREEN} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Revenu brut XaalisPay" flush={false}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} cursor={{ fill: "#F5F5F5" }} />
                <Legend {...LEGEND} />
                <Bar dataKey="buyer_protection_fees" name="Frais protection" stackId="revenue" fill={NAVY} maxBarSize={22} />
                <Bar dataKey="seller_commissions" name="Commissions vendeur" stackId="revenue" fill={CORAL} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Volume de retrait" flush={false}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} cursor={{ fill: "#F5F5F5" }} />
                <Bar dataKey="payout_volume" name="Volume de retrait" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Nouveaux vendeurs" flush={false}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                <Tooltip labelFormatter={tooltipLabel} cursor={{ fill: "#F5F5F5" }} />
                <Bar dataKey="new_sellers" name="Nouveaux vendeurs" fill={CORAL} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </section>
  );
}
