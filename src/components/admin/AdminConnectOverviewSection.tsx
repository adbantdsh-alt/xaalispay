"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { connectTransactionStatusLabel, type ConnectBalanceSummary, type ConnectOverviewData } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

function BalanceGroup({ title, balances }: { title: string; balances: ConnectBalanceSummary }) {
  return (
    <div className="admin-stat-grid">
      <div className="admin-stat-box">
        <div className="admin-stat-box-label">{title} — en séquestre</div>
        <div className="admin-stat-box-value">{formatCurrency(balances.escrow_total)}</div>
      </div>
      <div className="admin-stat-box">
        <div className="admin-stat-box-label">{title} — disponible</div>
        <div className="admin-stat-box-value">{formatCurrency(balances.available_total)}</div>
      </div>
      <div className="admin-stat-box">
        <div className="admin-stat-box-label">{title} — bloqué (litiges)</div>
        <div className="admin-stat-box-value">{formatCurrency(balances.blocked_total)}</div>
      </div>
      <div className="admin-stat-box">
        <div className="admin-stat-box-label">{title} — déjà retiré</div>
        <div className="admin-stat-box-value">{formatCurrency(balances.paid_out_total)}</div>
      </div>
    </div>
  );
}

export function AdminConnectOverviewSection() {
  const router = useRouter();
  const [overview, setOverview] = useState<ConnectOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);

  const fetchOverview = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const res = await apiFetch("/api/admin/connect/overview");
      if (handleAdminAuthStatus(res.status, router, "/admin/connect")) return;
      if (res.ok) setOverview(await res.json());
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const id = setInterval(() => fetchOverview(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchOverview]);

  if (loading && !overview) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!overview) return null;

  const statusEntries = Object.entries(overview.transactions_by_status);

  return (
    <section className="admin-section">
      <article className="admin-card">
        <h2 className="admin-card-title">Trésorerie XaalisPay — son propre argent</h2>
        <div className="admin-stat-grid">
          <div className="admin-stat-box">
            <div className="admin-stat-box-label">Revenu Connect depuis le début</div>
            <div className="admin-stat-box-value">{formatCurrency(overview.revenue.xaalispay_fee_total)}</div>
          </div>
          <div className="admin-stat-box">
            <div className="admin-stat-box-label">Disponible pour retrait</div>
            <div className="admin-stat-box-value">{formatCurrency(overview.revenue.treasury_available_balance)}</div>
          </div>
          <div className="admin-stat-box">
            <div className="admin-stat-box-label">Déjà retiré par XaalisPay</div>
            <div className="admin-stat-box-value">{formatCurrency(overview.revenue.treasury_paid_out_balance)}</div>
          </div>
        </div>
        {(overview.revenue.treasury_escrow_balance > 0 || overview.revenue.treasury_blocked_balance > 0) && (
          <div className="admin-stat-grid" style={{ marginTop: "0.75rem" }}>
            <div className="admin-stat-box">
              <div className="admin-stat-box-label">En séquestre (trésorerie)</div>
              <div className="admin-stat-box-value">{formatCurrency(overview.revenue.treasury_escrow_balance)}</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-box-label">Bloqué (trésorerie)</div>
              <div className="admin-stat-box-value">{formatCurrency(overview.revenue.treasury_blocked_balance)}</div>
            </div>
          </div>
        )}
      </article>

      <article className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 className="admin-card-title">Fonds détenus dans Connect — n&apos;appartient PAS à XaalisPay</h2>
        <div className="admin-hint-banner">
          <span className="admin-hint-dot" aria-hidden="true" />
          <span className="admin-hint-strong">Commission Connect uniquement</span>
          <span className="admin-hint-muted">
            — &ldquo;Solde propre des plateformes&rdquo; ne montre que la commission perçue via les transactions
            Connect. Une plateforme (ex. CopyX) peut avoir d&apos;autres revenus totalement invisibles ici
            (abonnements…) : ce chiffre n&apos;est jamais son revenu total.
          </span>
        </div>
        <BalanceGroup title="Solde propre des plateformes" balances={overview.platform_balances.platform_own} />
        <div style={{ marginTop: "0.75rem" }}>
          <BalanceGroup
            title="Solde de leurs marchands / bénéficiaires"
            balances={overview.platform_balances.merchants}
          />
        </div>
      </article>

      <div className="admin-kpi-grid" style={{ marginTop: "1rem" }}>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Plateformes actives</p>
          <p className="admin-kpi-value">{overview.active_platforms_count}</p>
          <p className="admin-kpi-sub">{overview.platforms_count} au total</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Transactions</p>
          <p className="admin-kpi-value">{overview.transactions_count}</p>
          <p className="admin-kpi-sub">Toutes plateformes confondues</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Volume Connect (GMV)</p>
          <p className="admin-kpi-value">{formatCurrency(overview.gmv_total)}</p>
          <p className="admin-kpi-sub">Toutes transactions confondues</p>
        </article>
      </div>

      <article className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 className="admin-card-title">Transactions par statut</h2>
        {statusEntries.length === 0 ? (
          <p className="admin-empty">Aucune transaction.</p>
        ) : (
          <div className="admin-stat-grid">
            {statusEntries.map(([status, count]) => (
              <div className="admin-stat-box" key={status}>
                <div className="admin-stat-box-label">{connectTransactionStatusLabel(status)}</div>
                <div className="admin-stat-box-value">{count}</div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
