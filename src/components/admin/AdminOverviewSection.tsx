"use client";

import { useState } from "react";
import { ArrowRight, Banknote, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { OverviewData } from "./admin-types";

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

export function AdminOverviewSection({
  overview,
  onNavigate,
}: {
  overview: OverviewData;
  onNavigate: (route: "disputes" | "payouts") => void;
}) {
  const [exporting, setExporting] = useState<"orders" | "payouts" | null>(null);

  const exportCsv = async (kind: "orders" | "payouts") => {
    setExporting(kind);
    await downloadCsv(`/api/admin/export/${kind}`, `${kind}.csv`);
    setExporting(null);
  };

  const pendingPayouts = overview.payouts_by_status.pending + overview.payouts_by_status.processing;
  const failedPayouts = overview.payouts_by_status.failed;

  return (
    <section className="admin-section">
      <div className="admin-hero-grid">
        <button
          type="button"
          className="admin-hero-kpi admin-hero-kpi--dark"
          onClick={() => onNavigate("disputes")}
        >
          <div className="admin-hero-kpi-top">
            <span className="admin-hero-kpi-label">Litiges ouverts</span>
            <ShieldAlert size={18} aria-hidden="true" />
          </div>
          <p className="admin-hero-kpi-value admin-mono">{overview.open_disputes_count}</p>
          <p className="admin-hero-kpi-foot">
            Arbitrer maintenant <ArrowRight size={14} aria-hidden="true" />
          </p>
        </button>

        <button
          type="button"
          className="admin-hero-kpi admin-hero-kpi--outline"
          onClick={() => onNavigate("payouts")}
        >
          <div className="admin-hero-kpi-top">
            <span className="admin-hero-kpi-label">Retraits</span>
            <Banknote size={18} aria-hidden="true" />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginTop: "0.65rem" }}>
            <span className="admin-hero-kpi-value admin-mono">{pendingPayouts}</span>
            {failedPayouts > 0 && (
              <span className="admin-hero-kpi-failed-inline">{failedPayouts} échoués</span>
            )}
          </div>
          <p className="admin-hero-kpi-foot">
            En attente · gérer <ArrowRight size={14} aria-hidden="true" />
          </p>
        </button>

        <article className="admin-hero-kpi admin-hero-kpi--outline admin-hero-kpi-plain">
          <span className="admin-hero-kpi-label">GMV aujourd&apos;hui</span>
          <p className="admin-hero-kpi-value admin-mono">{formatCurrency(overview.gmv_today)}</p>
          <p className="admin-hero-kpi-foot">{overview.paid_today_count} commande(s)</p>
        </article>
      </div>

      <div className="admin-info-grid">
        <article className="admin-card">
          <h2 className="admin-card-title">Plateforme</h2>
          <ul className="admin-health-list">
            <li>
              <span>Vendeurs</span>
              <strong>{overview.sellers_count}</strong>
            </li>
            <li>
              <span>Produits</span>
              <strong>{overview.products_count}</strong>
            </li>
            <li>
              <span>Commandes totales</span>
              <strong>{overview.orders_count}</strong>
            </li>
          </ul>
        </article>

        <article className="admin-card">
          <h2 className="admin-card-title">Soldes vendeurs (cumulés)</h2>
          <ul className="admin-health-list">
            <li>
              <span>En séquestre</span>
              <strong>{formatCurrency(overview.balances.escrow_total)}</strong>
            </li>
            <li>
              <span>Bloqué (litiges)</span>
              <strong>{formatCurrency(overview.balances.blocked_total)}</strong>
            </li>
            <li>
              <span>Disponible</span>
              <strong>{formatCurrency(overview.balances.available_total)}</strong>
            </li>
            <li>
              <span>Déjà versé</span>
              <strong>{formatCurrency(overview.balances.paid_out_total)}</strong>
            </li>
          </ul>
        </article>

        <div className="admin-stack-col">
          <article className="admin-card">
            <h2 className="admin-card-title">Revenu XaalisPay</h2>
            <ul className="admin-health-list">
              <li>
                <span>Frais protection acheteur</span>
                <strong>{formatCurrency(overview.revenue.buyer_protection_fees_total)}</strong>
              </li>
              <li>
                <span>Commissions vendeur</span>
                <strong>{formatCurrency(overview.revenue.seller_commissions_total)}</strong>
              </li>
            </ul>
          </article>

          <article className="admin-card">
            <h2 className="admin-card-title">Exports CSV</h2>
            <div className="admin-export-actions">
              <button
                type="button"
                className="admin-action-btn"
                disabled={exporting === "orders"}
                onClick={() => exportCsv("orders")}
              >
                {exporting === "orders" ? "…" : "Télécharger commandes"}
              </button>
              <button
                type="button"
                className="admin-action-btn"
                disabled={exporting === "payouts"}
                onClick={() => exportCsv("payouts")}
              >
                {exporting === "payouts" ? "…" : "Télécharger retraits"}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
