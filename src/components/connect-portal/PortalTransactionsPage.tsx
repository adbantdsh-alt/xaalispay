"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import {
  formatPortalDate,
  transactionStatusClass,
  transactionStatusLabel,
  type PortalTransaction,
} from "./portal-types";

export function PortalTransactionsPage() {
  const [transactions, setTransactions] = useState<PortalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    portalApiFetch("/api/v1/connect/transactions").then(async (res) => {
      if (cancelled) return;
      if (res.ok) setTransactions(await res.json());
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = statusFilter ? transactions.filter((t) => t.status === statusFilter) : transactions;
  const statuses = Array.from(new Set(transactions.map((t) => t.status)));

  return (
    <section className="admin-section">
      <article className="admin-card">
        <h2 className="admin-card-title">Transactions</h2>
        <div className="admin-filters">
          <select
            className="input-field input-compact"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {transactionStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="admin-empty">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">Aucune transaction.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Commission plateforme</th>
                  <th>Frais XaalisPay</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Libérée le</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="admin-mono">{t.external_ref || t.id.slice(0, 8)}</td>
                    <td className="admin-mono">{formatCurrency(t.amount)}</td>
                    <td className="admin-mono">{formatCurrency(t.application_fee)}</td>
                    <td className="admin-mono">{formatCurrency(t.xaalispay_fee)}</td>
                    <td>
                      <span className={`admin-badge ${transactionStatusClass(t.status)}`}>
                        {transactionStatusLabel(t.status)}
                      </span>
                    </td>
                    <td>{formatPortalDate(t.created_at)}</td>
                    <td>{formatPortalDate(t.released_at)}</td>
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
