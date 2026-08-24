"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import { usePortalAuth } from "@/lib/connect-portal-auth";
import {
  formatPortalDate,
  transactionStatusClass,
  transactionStatusLabel,
  type PortalAccount,
  type PortalAccountBalance,
  type PortalTransaction,
} from "./portal-types";

interface AccountWithBalance extends PortalAccount {
  balance: PortalAccountBalance | null;
}

export function PortalOverviewPage() {
  const { user } = usePortalAuth();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [transactions, setTransactions] = useState<PortalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [accountsRes, txnsRes] = await Promise.all([
        portalApiFetch("/api/v1/connect/accounts"),
        portalApiFetch("/api/v1/connect/transactions"),
      ]);
      if (cancelled) return;

      const accountsData: PortalAccount[] = accountsRes.ok ? await accountsRes.json() : [];
      const txnsData: PortalTransaction[] = txnsRes.ok ? await txnsRes.json() : [];

      const withBalances = await Promise.all(
        accountsData.map(async (account) => {
          const balRes = await portalApiFetch(`/api/v1/connect/accounts/${account.id}/balance`);
          return { ...account, balance: balRes.ok ? await balRes.json() : null };
        })
      );

      if (cancelled) return;
      setAccounts(withBalances);
      setTransactions(txnsData);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="admin-empty">Chargement…</p>;
  }

  const activeTxns = transactions.filter((t) => t.status !== "pending_payment" && t.status !== "cancelled");
  const totalVolume = activeTxns.reduce((sum, t) => sum + t.amount, 0);
  const releasedCount = transactions.filter((t) => t.status === "released").length;
  const totalAvailable = accounts.reduce((sum, a) => sum + (a.balance?.available_balance ?? 0), 0);
  const totalEscrow = accounts.reduce((sum, a) => sum + (a.balance?.escrow_balance ?? 0), 0);

  return (
    <section className="admin-section">
      <div className="admin-kpi-grid">
        <article className="admin-kpi">
          <p className="admin-kpi-label">Transactions</p>
          <p className="admin-kpi-value">{transactions.length}</p>
          <p className="admin-kpi-sub">{releasedCount} libérée(s)</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Volume traité</p>
          <p className="admin-kpi-value">{formatCurrency(totalVolume)}</p>
          <p className="admin-kpi-sub">Hors en attente de paiement</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">Disponible</p>
          <p className="admin-kpi-value">{formatCurrency(totalAvailable)}</p>
          <p className="admin-kpi-sub">Cumulé sur vos comptes</p>
        </article>
        <article className="admin-kpi">
          <p className="admin-kpi-label">En séquestre</p>
          <p className="admin-kpi-value">{formatCurrency(totalEscrow)}</p>
          <p className="admin-kpi-sub">Pas encore libéré</p>
        </article>
      </div>

      {user && (
        <article className="admin-card">
          <h2 className="admin-card-title">Votre plateforme</h2>
          <ul className="admin-health-list">
            <li>
              <span>Nom</span>
              <strong>{user.platform_name}</strong>
            </li>
            <li>
              <span>Identifiant</span>
              <strong className="admin-mono">{user.platform_slug}</strong>
            </li>
          </ul>
        </article>
      )}

      <article className="admin-card">
        <h2 className="admin-card-title">Comptes connectés</h2>
        {accounts.length === 0 ? (
          <p className="admin-empty">Aucun compte connecté.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Type</th>
                  <th>Disponible</th>
                  <th>En séquestre</th>
                  <th>Déjà versé</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.display_name}</strong>
                      <span className="admin-cell-sub admin-mono">{a.external_ref}</span>
                    </td>
                    <td>{a.kind}</td>
                    <td className="admin-mono">{formatCurrency(a.balance?.available_balance ?? 0)}</td>
                    <td className="admin-mono">{formatCurrency(a.balance?.escrow_balance ?? 0)}</td>
                    <td className="admin-mono">{formatCurrency(a.balance?.paid_out_balance ?? 0)}</td>
                    <td>
                      <span className={`admin-badge ${a.status === "active" ? "good" : "neutral"}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Transactions récentes</h2>
        {transactions.length === 0 ? (
          <p className="admin-empty">Aucune transaction.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td className="admin-mono">{t.external_ref || t.id.slice(0, 8)}</td>
                    <td className="admin-mono">{formatCurrency(t.amount)}</td>
                    <td>
                      <span className={`admin-badge ${transactionStatusClass(t.status)}`}>
                        {transactionStatusLabel(t.status)}
                      </span>
                    </td>
                    <td>{formatPortalDate(t.created_at)}</td>
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
