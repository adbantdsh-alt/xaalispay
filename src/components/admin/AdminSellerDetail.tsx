"use client";

import { useEffect, useState } from "react";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { ContactCard, DetailPanel, DetailSection, StatusPill, toneForStatus } from "./AdminUI";
import {
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

  const profile = detail?.profile;

  return (
    <DetailPanel
      wide
      title={profile ? profile.businessName : "Vendeur"}
      subtitle={profile ? `@${profile.username} · inscrit le ${formatAdminDate(profile.createdAt)}` : undefined}
      badge={profile && <StatusPill tone={profile.isActive ? "good" : "neutral"} label={profile.isActive ? "Actif" : "Inactif"} />}
      onClose={onClose}
    >
      {loading && <p className="ax-muted ax-pad">Chargement…</p>}
      {!loading && error && <p className="ax-muted ax-pad">{error}</p>}

      {!loading && detail && profile && (
        <>
          <div className="ax-summary">
            <div>
              <div className="ax-summary-label">CA cumulé</div>
              <div className="ax-summary-amount">{formatCurrency(detail.lifetime.lifetimeGmv)}</div>
            </div>
            <span className="ax-muted">{detail.lifetime.ordersCount} commande(s) au total</span>
          </div>

          <DetailSection title="Contact">
            <div className="ax-contacts">
              <ContactCard
                role={profile.email ?? "Pas d'email"}
                name={profile.displayName || profile.businessName}
                phone={profile.phone}
                sub={
                  profile.payoutMethod
                    ? `Retraits vers ${profile.payoutMethod === "wave" ? "Wave" : "Orange Money"} ${profile.payoutPhone ?? ""}`
                    : undefined
                }
              />
            </div>
          </DetailSection>

          <DetailSection title="Solde">
            <div className="ax-balance">
              {[
                ["Disponible", profile.balance.availableBalance],
                ["En séquestre", profile.balance.escrowBalance],
                ["Bloqué (litiges)", profile.balance.blockedBalance],
                ["Déjà versé", profile.balance.paidOutBalance],
              ].map(([label, value]) => (
                <div key={label as string} className="ax-balance-cell">
                  <span>{label}</span>
                  <strong className="admin-mono">{formatCurrency(value as number)}</strong>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title={`Commandes récentes · ${detail.recentOrders.length}`}>
            {detail.recentOrders.length === 0 ? (
              <p className="ax-muted">Aucune commande.</p>
            ) : (
              <ul className="ax-list">
                {detail.recentOrders.map((o) => (
                  <li key={o.id}>
                    <span className="ax-list-main">
                      <span className="ax-list-title">
                        <span className="admin-mono">{o.orderNumber}</span> · {o.productName}
                      </span>
                      <span className="ax-list-sub">
                        {o.clientName} · {formatAdminDate(o.createdAt)}
                      </span>
                    </span>
                    <span className="ax-list-amount admin-mono">{formatCurrency(o.total)}</span>
                    <StatusPill tone={toneForStatus(o.status)} label={ORDER_STATUS_LABELS[o.status]} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection title={`Retraits récents · ${detail.recentPayouts.length}`}>
            {detail.recentPayouts.length === 0 ? (
              <p className="ax-muted">Aucun retrait.</p>
            ) : (
              <ul className="ax-list">
                {detail.recentPayouts.map((p) => (
                  <li key={p.id}>
                    <span className="ax-list-main">
                      <span className="ax-list-title">{p.method === "wave" ? "Wave" : p.method === "orange" ? "Orange Money" : p.method}</span>
                      <span className="ax-list-sub">{formatAdminDate(p.createdAt)}</span>
                    </span>
                    <span className="ax-list-amount admin-mono">{formatCurrency(p.amount)}</span>
                    <StatusPill tone={toneForStatus(p.status)} label={payoutStatusLabel(p.status)} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          {detail.disputes.length > 0 && (
            <DetailSection title={`Litiges · ${detail.disputes.length}`}>
              <ul className="ax-list">
                {detail.disputes.map((d) => (
                  <li key={d.id}>
                    <span className="ax-list-main">
                      <span className="ax-list-title">
                        <span className="admin-mono">{d.orderNumber}</span> · {d.disputeTypeLabel}
                      </span>
                      <span className="ax-list-sub">{d.disputeReason}</span>
                    </span>
                    <StatusPill tone={toneForStatus(d.status)} label={ORDER_STATUS_LABELS[d.status]} />
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          <DetailSection title="Affiliation">
            {detail.referredBy && (
              <p className="ax-muted">
                Parrainé par <strong>{detail.referredBy.businessName}</strong> (@{detail.referredBy.username}) le{" "}
                {formatAdminDate(detail.referredBy.createdAt)}.
              </p>
            )}
            {detail.referralsMade.length === 0 ? (
              <p className="ax-muted">N&apos;a parrainé aucun vendeur.</p>
            ) : (
              <ul className="ax-list">
                {detail.referralsMade.map((r) => (
                  <li key={r.id} className="ax-list-wrap">
                    <span className="ax-list-main">
                      <span className="ax-list-title">{r.businessName}</span>
                      <span className="ax-list-sub">
                        CA {formatCurrency(r.lifetimeGmv)} · commission {formatCurrency(r.commissionEarnedTotal)} ·
                        palier {r.isBoosted ? "1 %" : "0,25 %"} jusqu&apos;au {formatAdminDate(r.boostExpiresAt)}
                      </span>
                    </span>
                    <span className="ax-inline-form">
                      <label className="ax-sr-only" htmlFor={`extend-${r.id}`}>
                        Jours de prolongation du palier 1 %
                      </label>
                      <input
                        id={`extend-${r.id}`}
                        type="number"
                        min={1}
                        placeholder="Jours"
                        className="ax-input"
                        value={extendDays[r.id] ?? ""}
                        onChange={(e) => setExtendDays((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="ax-btn ax-btn--sm"
                        disabled={extendingId === r.id}
                        onClick={() => extendBoost(r.id)}
                      >
                        {extendingId === r.id ? "…" : "Prolonger 1 %"}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {extendError && (
              <p className="admin-error" role="alert">
                {extendError}
              </p>
            )}
          </DetailSection>
        </>
      )}
    </DetailPanel>
  );
}
