"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, splitCurrency } from "@/lib/utils";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { connectTransactionStatusLabel, type ConnectBalanceSummary, type ConnectOverviewData } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

function BalanceGroup({
  title,
  hint,
  balances,
}: {
  title: string;
  hint: string;
  balances: ConnectBalanceSummary;
}) {
  const rows = [
    ["Disponible", balances.available_total],
    ["En séquestre", balances.escrow_total],
    ["Bloqué (litiges)", balances.blocked_total],
    ["Déjà retiré", balances.paid_out_total],
  ] as const;
  return (
    <div className="av-balance-group">
      <div>
        <h3 className="av-subtitle">{title}</h3>
        <p className="av-card-hint">{hint}</p>
      </div>
      <dl className="av-balance-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="av-balance-cell">
            <dt className="av-card-label">{label}</dt>
            <dd className="admin-mono">{formatCurrency(value)}</dd>
          </div>
        ))}
      </dl>
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

  const statusEntries = Object.entries(overview.transactions_by_status).filter(([, count]) => count > 0);
  const { revenue } = overview;
  const [withdrawable, withdrawableCurrency] = splitCurrency(revenue.treasury_withdrawable);

  return (
    <section className="admin-section av-overview">
      <div className="av-row">
        <article className="av-hero">
          <div className="av-hero-main">
            <span className="av-hero-label">Disponible pour retrait</span>
            <span className="av-hero-value admin-mono">
              {withdrawable}
              {withdrawableCurrency && <span className="av-hero-currency">{withdrawableCurrency}</span>}
            </span>
            <span className="av-hero-sub">
              Solde comptable de la trésorerie moins les frais Bictorys déjà prélevés sur le compte commun.
            </span>
          </div>
          <dl className="av-hero-breakdown">
            <div>
              <dt>Revenu Connect brut</dt>
              <dd className="admin-mono">{formatCurrency(revenue.xaalispay_fee_total)}</dd>
            </div>
            <div>
              <dt>Frais Bictorys</dt>
              <dd className="admin-mono av-minus">− {formatCurrency(revenue.bictorys_fees_total)}</dd>
            </div>
            <div>
              <dt>Déjà retiré</dt>
              <dd className="admin-mono av-minus">− {formatCurrency(revenue.treasury_paid_out_balance)}</dd>
            </div>
            <div className="av-hero-total">
              <dt>Bénéfice net Connect</dt>
              <dd className="admin-mono">{formatCurrency(revenue.net_revenue)}</dd>
            </div>
            {(revenue.treasury_escrow_balance > 0 || revenue.treasury_blocked_balance > 0) && (
              <div>
                <dt>Commissions à venir (séquestre / litiges)</dt>
                <dd className="admin-mono">
                  {formatCurrency(revenue.treasury_escrow_balance + revenue.treasury_blocked_balance)}
                </dd>
              </div>
            )}
          </dl>
        </article>

        <div className="av-side">
          <div className="av-mini-grid">
            <article className="av-mini">
              <span className="av-card-label">Plateformes actives</span>
              <span className="av-mini-value admin-mono">{overview.active_platforms_count}</span>
            </article>
            <article className="av-mini">
              <span className="av-card-label">Transactions</span>
              <span className="av-mini-value admin-mono">{overview.transactions_count}</span>
            </article>
            <article className="av-mini">
              <span className="av-card-label">Volume payé</span>
              <span className="av-mini-value admin-mono">{formatCurrency(overview.gmv_total)}</span>
            </article>
          </div>
          <article className="av-card">
            <h2 className="av-card-title">Transactions par statut</h2>
            {statusEntries.length === 0 ? (
              <p className="av-card-hint">Aucune transaction.</p>
            ) : (
              <ul className="av-legend">
                {statusEntries.map(([status, count]) => (
                  <li key={status}>
                    <span className="av-legend-label">{connectTransactionStatusLabel(status)}</span>
                    <span className="admin-mono">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>

      <article className="av-card">
        <div className="av-card-head">
          <h2 className="av-card-title">Fonds détenus dans Connect</h2>
          <span className="av-card-hint">jamais l&apos;argent de XaalisPay</span>
        </div>
        <div className="av-grid-2">
          <BalanceGroup
            title="Commission des plateformes"
            hint="Leur commission perçue via Connect, jamais leur revenu total"
            balances={overview.platform_balances.platform_own}
          />
          <BalanceGroup
            title="Argent de leurs marchands"
            hint="Argent de tiers en séquestre chez les plateformes"
            balances={overview.platform_balances.merchants}
          />
        </div>
      </article>
    </section>
  );
}
