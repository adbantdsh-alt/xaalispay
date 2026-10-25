"use client";

import { useState } from "react";
import { ArrowRight, Banknote, Download, ShieldAlert, Undo2, Users } from "lucide-react";
import { formatCurrency, splitCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { OverviewData } from "./admin-types";

export type AdminOverviewRoute = "disputes" | "payouts" | "refunds" | "sellers";

async function downloadCsv(path: string, filename: string) {
  const res = await apiFetch(path);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function percentOf(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

export function AdminOverviewSection({
  overview,
  onNavigate,
}: {
  overview: OverviewData;
  onNavigate: (route: AdminOverviewRoute) => void;
}) {
  const [exporting, setExporting] = useState<"orders" | "payouts" | null>(null);

  const exportCsv = async (kind: "orders" | "payouts") => {
    setExporting(kind);
    await downloadCsv(`/api/admin/export/${kind}`, `${kind}.csv`);
    setExporting(null);
  };

  const { revenue, balances } = overview;
  const failedPayouts = overview.payouts_by_status.failed ?? 0;
  const pendingPayouts = (overview.payouts_by_status.pending ?? 0) + (overview.payouts_by_status.processing ?? 0);
  const refundsToReview = overview.refunds_to_review ?? { count: 0, amount: 0 };
  const actionCount = refundsToReview.count + overview.open_disputes_count + failedPayouts;
  const netMargin = percentOf(revenue.net_profit, overview.gmv_total);
  const [netAmount, netCurrency] = splitCurrency(revenue.net_profit);

  const sellerMoney = balances.escrow_total + balances.available_total + balances.blocked_total;
  const sellerTotal = sellerMoney + balances.paid_out_total;
  const sellerSegments = [
    { key: "paid", label: "Déjà versé", value: balances.paid_out_total, tone: "navy" },
    { key: "available", label: "Disponible", value: balances.available_total, tone: "coral" },
    { key: "escrow", label: "En séquestre", value: balances.escrow_total, tone: "soft" },
    { key: "blocked", label: "Bloqué (litiges)", value: balances.blocked_total, tone: "muted" },
  ];

  const flows = [
    { label: "Encaissé auprès des acheteurs", value: overview.gmv_total, tone: "navy" },
    { label: "Versé aux vendeurs", value: overview.payout_volume_total, tone: "navy-soft" },
    { label: "Gardé par XaalisPay (net)", value: revenue.net_profit, tone: "coral" },
  ];

  return (
    <section className="admin-section av-overview">
      <div className="av-row">
        <article className="av-hero">
          <div className="av-hero-main">
            <span className="av-hero-label">Bénéfice net XaalisPay</span>
            <span className="av-hero-value admin-mono">
              {netAmount}
              {netCurrency && <span className="av-hero-currency">{netCurrency}</span>}
            </span>
            <span className="av-hero-sub">
              {netMargin.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du volume d&apos;affaires · frais
              Bictorys réels déduits
            </span>
            <div className="av-hero-chips">
              <span className="av-chip av-chip--coral">
                Aujourd&apos;hui : {formatCurrency(overview.gmv_today)} · {overview.paid_today_count} commande(s)
              </span>
            </div>
          </div>
          <dl className="av-hero-breakdown">
            <div>
              <dt>Frais protection acheteur</dt>
              <dd className="admin-mono">+ {formatCurrency(revenue.buyer_protection_fees_total)}</dd>
            </div>
            <div>
              <dt>Commissions vendeur</dt>
              <dd className="admin-mono">+ {formatCurrency(revenue.seller_commissions_total)}</dd>
            </div>
            <div>
              <dt>Commissions affiliation</dt>
              <dd className="admin-mono av-minus">− {formatCurrency(revenue.affiliate_commissions_total)}</dd>
            </div>
            <div>
              <dt>Frais Bictorys</dt>
              <dd className="admin-mono av-minus">− {formatCurrency(revenue.bictorys_fees_estimated_total)}</dd>
            </div>
            <div className="av-hero-total">
              <dt>Net</dt>
              <dd className="admin-mono">{formatCurrency(revenue.net_profit)}</dd>
            </div>
          </dl>
        </article>

        <div className="av-side">
          <button type="button" className="av-sellers-card" onClick={() => onNavigate("sellers")}>
            <span className="av-sellers-top">
              <span className="av-card-label">Vendeurs inscrits</span>
              <span className="av-icon-tile" aria-hidden="true">
                <Users size={20} />
              </span>
            </span>
            <span className="av-sellers-value admin-mono">{overview.sellers_count}</span>
            <span className="av-sellers-foot">
              {overview.sellers_new_7d != null && (
                <span className="av-chip av-chip--solid">+ {overview.sellers_new_7d} cette semaine</span>
              )}
              <span className="av-link">
                Voir les vendeurs <ArrowRight size={14} aria-hidden="true" />
              </span>
            </span>
          </button>
          <div className="av-mini-grid">
            <article className="av-mini">
              <span className="av-card-label">Volume</span>
              <span className="av-mini-value admin-mono">{formatCurrency(overview.gmv_total)}</span>
            </article>
            <article className="av-mini">
              <span className="av-card-label">Commandes payées</span>
              <span className="av-mini-value admin-mono">{overview.orders_count}</span>
            </article>
            <article className="av-mini">
              <span className="av-card-label">Produits</span>
              <span className="av-mini-value admin-mono">{overview.products_count}</span>
            </article>
          </div>
        </div>
      </div>

      <div className="av-grid-2">
        <article className="av-card">
          <div className="av-card-head">
            <h2 className="av-card-title">À traiter</h2>
            {actionCount > 0 ? (
              <span className="av-pill av-pill--warn">
                {actionCount} action{actionCount > 1 ? "s" : ""} requise{actionCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="av-pill av-pill--good">Tout est à jour</span>
            )}
          </div>

          <button
            type="button"
            className={`av-todo ${refundsToReview.count > 0 ? "is-urgent" : ""}`}
            onClick={() => onNavigate("refunds")}
          >
            <span className="av-icon-tile" aria-hidden="true">
              <Undo2 size={18} />
            </span>
            <span className="av-todo-text">
              <span className="av-todo-title">
                {refundsToReview.count > 0
                  ? `${refundsToReview.count} remboursement${refundsToReview.count > 1 ? "s" : ""} à vérifier`
                  : "Remboursements"}
              </span>
              <span className="av-todo-sub">
                {refundsToReview.count > 0
                  ? `${formatCurrency(refundsToReview.amount)} à contrôler avant tout renvoi`
                  : "Aucun remboursement en échec"}
              </span>
            </span>
            <span className="av-todo-count admin-mono">{refundsToReview.count}</span>
          </button>

          <button type="button" className="av-todo" onClick={() => onNavigate("disputes")}>
            <span className="av-icon-tile" aria-hidden="true">
              <ShieldAlert size={18} />
            </span>
            <span className="av-todo-text">
              <span className="av-todo-title">Litiges ouverts</span>
              <span className="av-todo-sub">
                {overview.open_disputes_count > 0 ? "En attente d'arbitrage" : "Aucun litige en attente d'arbitrage"}
              </span>
            </span>
            <span className="av-todo-count admin-mono">{overview.open_disputes_count}</span>
          </button>

          <button type="button" className="av-todo" onClick={() => onNavigate("payouts")}>
            <span className="av-icon-tile" aria-hidden="true">
              <Banknote size={18} />
            </span>
            <span className="av-todo-text">
              <span className="av-todo-title">Retraits en échec</span>
              <span className="av-todo-sub">
                {pendingPayouts > 0 ? `${pendingPayouts} en cours chez Bictorys` : "À relancer depuis la page Retraits"}
              </span>
            </span>
            <span className="av-todo-count admin-mono">{failedPayouts}</span>
          </button>
        </article>

        <article className="av-card">
          <div className="av-card-head">
            <h2 className="av-card-title">Argent des vendeurs</h2>
            <span className="av-card-hint">jamais l&apos;argent de XaalisPay</span>
          </div>
          <div className="av-stat">
            <span className="av-card-label">Encore dû aux vendeurs</span>
            <span className="av-stat-value admin-mono">{formatCurrency(sellerMoney)}</span>
          </div>
          <div className="av-stack-bar" aria-hidden="true">
            {sellerSegments.map((segment) =>
              segment.value > 0 ? (
                <span
                  key={segment.key}
                  className={`av-tone-${segment.tone}`}
                  style={{ width: `${percentOf(segment.value, sellerTotal)}%` }}
                />
              ) : null,
            )}
          </div>
          <ul className="av-legend">
            {sellerSegments.map((segment) => (
              <li key={segment.key}>
                <span className={`av-legend-dot av-tone-${segment.tone}`} aria-hidden="true" />
                <span className="av-legend-label">{segment.label}</span>
                <span className="admin-mono">{formatCurrency(segment.value)}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="av-card">
        <div className="av-card-head">
          <h2 className="av-card-title">Flux d&apos;argent</h2>
          <div className="av-actions">
            <button
              type="button"
              className="av-btn"
              disabled={exporting === "orders"}
              onClick={() => exportCsv("orders")}
            >
              <Download size={15} aria-hidden="true" />
              {exporting === "orders" ? "Export…" : "Commandes CSV"}
            </button>
            <button
              type="button"
              className="av-btn"
              disabled={exporting === "payouts"}
              onClick={() => exportCsv("payouts")}
            >
              <Download size={15} aria-hidden="true" />
              {exporting === "payouts" ? "Export…" : "Retraits CSV"}
            </button>
          </div>
        </div>
        <div className="av-flows">
          {flows.map((flow) => (
            <div key={flow.label} className="av-flow">
              <div className="av-flow-row">
                <span>{flow.label}</span>
                <span className="admin-mono">{formatCurrency(flow.value)}</span>
              </div>
              <div className="av-flow-track" aria-hidden="true">
                <span
                  className={`av-tone-${flow.tone}`}
                  style={{ width: `${Math.max(percentOf(flow.value, overview.gmv_total), flow.value > 0 ? 1 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
