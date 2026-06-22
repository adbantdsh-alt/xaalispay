"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import {
  adminStatusClass,
  formatAdminDate,
  payoutStatusLabel,
  type OrderSummaryRow,
  type PayoutRow,
  type SellerDetail,
} from "./admin-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptOrderSummary(o: any): OrderSummaryRow {
  return {
    id: String(o.id),
    orderNumber: o.order_number,
    slug: o.slug,
    productName: o.product_name,
    clientName: o.client_name,
    clientPhone: o.client_phone,
    status: o.status,
    total: o.total_amount,
    paymentMethod: o.payment_method,
    paidAt: o.paid_at || undefined,
    disputeTypeLabel: o.dispute?.dispute_type_display,
    disputeReason: o.dispute?.reason,
    createdAt: o.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptPayoutRow(p: any): PayoutRow {
  return {
    id: String(p.id),
    sellerUsername: p.seller_username,
    sellerName: p.seller_business_name,
    amount: p.amount,
    method: p.method,
    phone: p.phone,
    status: p.status,
    failureReason: p.failure_reason || undefined,
    createdAt: p.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptDetail(data: any): SellerDetail {
  const profile = data.profile;
  return {
    profile: {
      id: profile.id,
      username: profile.username,
      businessName: profile.business_name,
      displayName: profile.display_name,
      phone: profile.phone,
      email: profile.email || null,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      ordersCount: profile.orders_count,
      lifetimeGmv: profile.lifetime_gmv,
      balance: {
        escrowBalance: profile.balance.escrow_balance,
        availableBalance: profile.balance.available_balance,
        blockedBalance: profile.balance.blocked_balance,
        paidOutBalance: profile.balance.paid_out_balance,
      },
      role: profile.role,
      payoutMethod: profile.payout_method || undefined,
      payoutPhone: profile.payout_phone || undefined,
      autoPayoutEnabled: profile.auto_payout_enabled,
      autoPayoutMode: profile.auto_payout_mode || undefined,
    },
    lifetime: {
      ordersCount: data.lifetime.orders_count,
      lifetimeGmv: data.lifetime.lifetime_gmv,
    },
    recentOrders: data.recent_orders.map(adaptOrderSummary),
    recentPayouts: data.recent_payouts.map(adaptPayoutRow),
    disputes: data.disputes.map(adaptOrderSummary),
  };
}

export function AdminSellerDetail({ sellerId, onClose }: { sellerId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/api/admin/sellers/${sellerId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError("Vendeur introuvable.");
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
  }, [sellerId]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article className="admin-modal admin-modal--seller" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-head-id">
            {detail && (
              <span className="admin-seller-avatar" aria-hidden="true">
                {detail.profile.businessName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <div className="admin-modal-head-title">{detail ? detail.profile.businessName : "Vendeur"}</div>
              {detail && (
                <div className="admin-modal-head-subtitle admin-mono">
                  @{detail.profile.username} · {detail.profile.isActive ? "Actif" : "Inactif"}
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
              <span className="admin-mono" style={{ color: "#6b7280" }}>
                <a href={`tel:${detail.profile.phone}`}>{detail.profile.phone}</a>
              </span>
              <span style={{ color: "#9aa3ad" }}>·</span>
              <span style={{ color: "#6b7280" }}>Inscrit le {formatAdminDate(detail.profile.createdAt)}</span>
              {detail.profile.email && (
                <>
                  <span style={{ color: "#9aa3ad" }}>·</span>
                  <span style={{ color: "#6b7280" }}>{detail.profile.email}</span>
                </>
              )}
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Solde</h3>
              <div className="admin-stat-grid">
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">En séquestre</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.profile.balance.escrowBalance)}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Disponible</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.profile.balance.availableBalance)}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Déjà versé</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.profile.balance.paidOutBalance)}</div>
                </div>
              </div>
              <div className="admin-stat-grid" style={{ marginTop: "0.75rem" }}>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Bloqué (litiges)</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.profile.balance.blockedBalance)}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">Commandes (total)</div>
                  <div className="admin-stat-box-value">{detail.lifetime.ordersCount}</div>
                </div>
                <div className="admin-stat-box">
                  <div className="admin-stat-box-label">CA cumulé</div>
                  <div className="admin-stat-box-value">{formatCurrency(detail.lifetime.lifetimeGmv)}</div>
                </div>
              </div>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Commandes récentes</h3>
              {detail.recentOrders.length === 0 ? (
                <p className="admin-empty">Aucune commande.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Commande</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentOrders.map((o) => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.orderNumber}</strong>
                            <span className="admin-cell-sub">{o.productName}</span>
                          </td>
                          <td>{o.clientName}</td>
                          <td>{formatCurrency(o.total)}</td>
                          <td>
                            <span className={`admin-badge ${adminStatusClass(o.status)}`}>
                              {ORDER_STATUS_LABELS[o.status]}
                            </span>
                          </td>
                          <td>{formatAdminDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Retraits récents</h3>
              {detail.recentPayouts.length === 0 ? (
                <p className="admin-empty">Aucun retrait.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.recentPayouts.map((p) => (
                        <tr key={p.id}>
                          <td>{formatCurrency(p.amount)}</td>
                          <td>{p.method}</td>
                          <td>
                            <span className={`admin-badge ${adminStatusClass(p.status)}`}>
                              {payoutStatusLabel(p.status)}
                            </span>
                          </td>
                          <td>{formatAdminDate(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Litiges récents</h3>
              {detail.disputes.length === 0 ? (
                <p className="admin-empty">Aucun litige.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Commande</th>
                        <th>Type</th>
                        <th>Raison</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.disputes.map((d) => (
                        <tr key={d.id}>
                          <td>{d.orderNumber}</td>
                          <td>{d.disputeTypeLabel}</td>
                          <td className="admin-dispute-reason">{d.disputeReason}</td>
                          <td>
                            <span className={`admin-badge ${adminStatusClass(d.status)}`}>
                              {ORDER_STATUS_LABELS[d.status]}
                            </span>
                          </td>
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
