"use client";

import { useEffect, useState } from "react";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import {
  adminStatusClass,
  formatAdminDate,
  payoutStatusLabel,
  type OrderSummaryRow,
  type PayoutRow,
  type ReferralRow,
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
function adaptReferralRow(r: any): ReferralRow {
  return {
    id: String(r.id),
    username: r.username,
    businessName: r.business_name,
    displayName: r.display_name,
    createdAt: r.created_at,
    boostExpiresAt: r.boost_expires_at,
    isBoosted: r.is_boosted,
    lifetimeGmv: r.lifetime_gmv,
    commissionEarnedTotal: r.commission_earned_total,
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
    referredBy: data.referred_by
      ? {
          username: data.referred_by.username,
          businessName: data.referred_by.business_name,
          createdAt: data.referred_by.created_at,
        }
      : null,
    referralsMade: data.referrals_made.map(adaptReferralRow),
  };
}

export function AdminSellerDetail({ sellerId, onClose }: { sellerId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [extendError, setExtendError] = useState("");

  const fetchDetail = async () => {
    setError("");
    const res = await apiFetch(`/api/admin/sellers/${sellerId}`);
    if (!res.ok) {
      setError("Vendeur introuvable.");
      return;
    }
    setDetail(adaptDetail(await res.json()));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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

  const extendBoost = async (referralId: string) => {
    const days = Number(extendDays[referralId]);
    if (!Number.isInteger(days) || days <= 0) {
      setExtendError("Indiquez un nombre de jours valide.");
      return;
    }
    setExtendError("");
    setExtendingId(referralId);
    const res = await apiFetch(`/api/admin/affiliates/${referralId}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
    });
    const data = await res.json().catch(() => ({}));
    setExtendingId(null);
    if (!res.ok) {
      setExtendError(extractApiError(data, "Prolongation impossible"));
      return;
    }
    setExtendDays((prev) => ({ ...prev, [referralId]: "" }));
    await fetchDetail();
  };

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

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Affiliation</h3>
              {detail.referredBy && (
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                  Parrainé par <strong>{detail.referredBy.businessName}</strong>{" "}
                  <span className="admin-mono">@{detail.referredBy.username}</span> le{" "}
                  {formatAdminDate(detail.referredBy.createdAt)}.
                </p>
              )}
              {detail.referralsMade.length === 0 ? (
                <p className="admin-empty">N&apos;a parrainé aucun vendeur.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Filleul</th>
                        <th>CA</th>
                        <th>Commission gagnée</th>
                        <th>Palier</th>
                        <th>Prolonger le palier 1 %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.referralsMade.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.businessName}</strong>
                            <span className="admin-cell-sub admin-mono">@{r.username}</span>
                          </td>
                          <td className="admin-mono">{formatCurrency(r.lifetimeGmv)}</td>
                          <td className="admin-mono">{formatCurrency(r.commissionEarnedTotal)}</td>
                          <td>
                            <span className={`admin-badge ${r.isBoosted ? "good" : "neutral"}`}>
                              {r.isBoosted ? "1 %" : "0,25 %"}
                            </span>
                            <span className="admin-cell-sub">jusqu&apos;au {formatAdminDate(r.boostExpiresAt)}</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                              <input
                                type="number"
                                min={1}
                                placeholder="Jours"
                                className="input-field input-compact"
                                style={{ width: "5.5rem" }}
                                value={extendDays[r.id] ?? ""}
                                onChange={(e) =>
                                  setExtendDays((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                              />
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={extendingId === r.id}
                                onClick={() => extendBoost(r.id)}
                              >
                                {extendingId === r.id ? "…" : "Prolonger"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {extendError && <p className="alert-danger" role="alert">{extendError}</p>}
            </div>
          </>
        )}
      </article>
    </div>
  );
}
