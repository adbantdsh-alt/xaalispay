"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptConnectTransactionRow } from "./admin-adapters";
import { adminStatusClass, connectTransactionStatusLabel, formatAdminDate, type ConnectPlatformDetail } from "./admin-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptDetail(data: any): ConnectPlatformDetail {
  return {
    platform: {
      id: String(data.platform.id),
      name: data.platform.name,
      slug: data.platform.slug,
      country: data.platform.country,
      currency: data.platform.currency,
      xaalispayFeePercent: data.platform.xaalispay_fee_percent,
      isActive: data.platform.is_active,
      createdAt: data.platform.created_at,
    },
    balances: data.balances,
    revenueTotal: data.revenue_total,
    accountsCount: data.accounts_count,
    recentTransactions: data.recent_transactions.map(adaptConnectTransactionRow),
  };
}

export function AdminConnectPlatformDetail({ platformId, onClose }: { platformId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ConnectPlatformDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/api/admin/connect/platforms/${platformId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Plateforme introuvable.");
          return;
        }
        setDetail(adaptDetail(await res.json()));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [platformId]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article className="admin-modal admin-modal--seller" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-head-id">
            {detail && (
              <span className="admin-seller-avatar" aria-hidden="true">
                {detail.platform.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <div className="admin-modal-head-title">{detail ? detail.platform.name : "Plateforme"}</div>
              {detail && (
                <div className="admin-modal-head-subtitle admin-mono">
                  {detail.platform.slug} · {detail.platform.country} · {detail.platform.isActive ? "Active" : "Inactive"}
                </div>
              )}
            </div>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        {loading && <p className="admin-empty">Chargement…</p>}
        {!loading && error && <p className="admin-empty">{error}</p>}

        {!loading && detail && (
          <>
            <div className="admin-dispute-section" style={{ display: "flex", gap: "1.1rem", fontSize: "0.8125rem" }}>
              <span style={{ color: "#6b7280" }}>Inscrite le {formatAdminDate(detail.platform.createdAt)}</span>
              <span style={{ color: "#9aa3ad" }}>·</span>
              <span style={{ color: "#6b7280" }}>
                Commission XaalisPay {(Number(detail.platform.xaalispayFeePercent) * 100).toFixed(2)} %
              </span>
              <span style={{ color: "#9aa3ad" }}>·</span>
              <span style={{ color: "#6b7280" }}>{detail.accountsCount} compte(s) connecté(s)</span>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Revenu XaalisPay généré par cette plateforme</h3>
              <div className="admin-stat-grid">
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Revenu Connect total</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.revenueTotal)}</div>
                </div>
              </div>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Soldes des comptes de cette plateforme</h3>
              <div className="admin-stat-grid">
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">En séquestre</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.balances.escrow_total)}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Disponible</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.balances.available_total)}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Déjà versé</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.balances.paid_out_total)}</div>
                </div>
              </div>
              <div className="admin-stat-grid" style={{ marginTop: "0.75rem" }}>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Bloqué (litiges)</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.balances.blocked_total)}</div>
                </div>
              </div>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Transactions récentes</h3>
              {detail.recentTransactions.length === 0 ? (
                <p className="admin-empty">Aucune transaction.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Référence</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Frais XaalisPay</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="admin-mono">{t.externalRef || t.id.slice(0, 8)}</td>
                          <td className="admin-mono">{formatCurrency(t.amount)}</td>
                          <td>
                            <span className={`admin-badge ${adminStatusClass(t.status)}`}>
                              {connectTransactionStatusLabel(t.status)}
                            </span>
                          </td>
                          <td className="admin-mono">{formatCurrency(t.xaalispayFee)}</td>
                          <td>{formatAdminDate(t.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
