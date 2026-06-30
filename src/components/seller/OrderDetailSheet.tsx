"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { FloatingSheet } from "@/components/ui/FloatingSheet";
import { calculateSellerCommission } from "@/lib/fees";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { formatDeliveryWindow } from "@/lib/delivery-window";
import { getSellerHumanStatus, getSellerTimeline } from "@/lib/order-timeline";
import { getOrderStatusVisual } from "@/lib/order-status-ui";
import { MOBILE_MONEY_LABELS, isMobileMoneyMethod } from "@/lib/payment-methods";
import type { Order } from "@/lib/types";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentLabel(method?: string): string {
  if (!method) return "—";
  if (isMobileMoneyMethod(method)) return MOBILE_MONEY_LABELS[method];
  return method;
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="order-detail-row">
      <span className="order-detail-label">{label}</span>
      <span className={`order-detail-value${valueClassName ? ` ${valueClassName}` : ""}`}>{value}</span>
    </div>
  );
}

export function OrderDetailSheet({
  order,
  onClose,
  onCancel,
}: {
  order: Order | null;
  onClose: () => void;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  if (!order) return null;

  const visual = getOrderStatusVisual(order.status);
  const steps = getSellerTimeline(order.status);
  const total = getOrderTotal(order);
  const sellerCommission = order.sellerCommission ?? calculateSellerCommission(total);
  const sellerNet = total - sellerCommission;
  const clientName = order.clientName?.trim() || order.clientFirstName?.trim() || "Client";
  const canCancel = onCancel && (order.status === "pending_payment" || order.status === "paid");

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    await onCancel(order.id, cancelReason || "Vendeur dans l'incapacité de livrer");
    setCancelling(false);
    setShowCancelModal(false);
    onClose();
  };

  return (
    <>
      <FloatingSheet open={!!order} onClose={onClose} title="Détail de la commande">
        {order.status === "dispute" && (
          <div className="order-dispute-banner" role="alert">
            <p className="order-dispute-banner-title">Litige en cours</p>
            <p className="order-dispute-banner-desc">
              L&apos;équipe XaalisPay examine le dossier. Les fonds sont bloqués jusqu&apos;à la décision.
            </p>
          </div>
        )}

        {/* Hero */}
        <div className="order-sheet-hero">
          {order.productImage ? (
            <Image
              src={order.productImage}
              alt={order.productName}
              width={52}
              height={52}
              className="order-sheet-hero-thumb"
            />
          ) : (
            <div className="order-sheet-hero-thumb-empty" aria-hidden="true" />
          )}
          <p className="order-sheet-hero-product">{order.productName}</p>
          {clientName !== "Client" && (
            <p className="order-sheet-hero-client">{clientName}</p>
          )}
          <p className="order-sheet-hero-amount">
            {formatCurrency(order.status === "released" ? sellerNet : total)}
          </p>
          <span className={`order-sheet-status order-sheet-status-${visual.tone}`}>
            {getSellerHumanStatus(order.status)}
          </span>
        </div>

        {/* Timeline */}
        <ol className="order-timeline" aria-label="Progression de la commande">
          {steps.map((step) => (
            <li
              key={step.id}
              className={`order-timeline-step${step.done ? " is-done" : ""}${step.active ? " is-active" : ""}`}
            >
              <span className="order-timeline-dot" aria-hidden="true" />
              <span className="order-timeline-label">{step.label}</span>
            </li>
          ))}
        </ol>

        {/* Client */}
        <div className="order-detail-section">
          <p className="order-detail-section-label">Client</p>
          <div className="order-detail-card">
            <DetailRow label="Nom" value={clientName} />
            {order.clientPhone && (
              <div className="order-detail-row">
                <span className="order-detail-label">Téléphone</span>
                <a href={`tel:${order.clientPhone}`} className="order-sheet-link">
                  {order.clientPhone}
                </a>
              </div>
            )}
            {order.clientAddress && (
              <DetailRow label="Adresse" value={order.clientAddress} valueClassName="order-detail-value-right" />
            )}
            {order.clientNote && (
              <DetailRow label="Note" value={order.clientNote} valueClassName="order-detail-value-right" />
            )}
          </div>
        </div>

        {/* Montant */}
        <div className="order-detail-section">
          <p className="order-detail-section-label">Montant</p>
          <div className="order-detail-card">
            <DetailRow label="Produit" value={formatCurrency(order.productPrice)} />
            <DetailRow
              label="Livraison"
              value={order.deliveryCost ? formatCurrency(order.deliveryCost) : "Offerte"}
            />
            <DetailRow label="Total payé" value={formatCurrency(total)} valueClassName="order-detail-value-bold" />
            <div className="order-commission-block">
              <div className="order-detail-row">
                <span className="order-detail-label">Commission (5 %)</span>
                <span className="order-sheet-commission-value">−{formatCurrency(sellerCommission)}</span>
              </div>
              <div className="order-detail-row order-detail-row-net">
                <span className="order-detail-label-net">Vous recevrez</span>
                <span className="order-detail-value-net">{formatCurrency(sellerNet)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Litige */}
        {order.status === "dispute" && order.dispute && (
          <div className="order-detail-section">
            <p className="order-detail-section-label">Litige</p>
            <div className="order-detail-card">
              <DetailRow label="Type" value={order.dispute.disputeTypeLabel} valueClassName="order-detail-value-right" />
              <DetailRow label="Ouvert le" value={formatDateTime(order.dispute.openedAt)} />
              {order.dispute.reason && (
                <DetailRow label="Motif" value={order.dispute.reason} valueClassName="order-detail-value-right" />
              )}
              <DetailRow label="Preuves" value={`${order.dispute.media.length} preuve(s)`} />
            </div>
            {order.dispute.media.length > 0 && (
              <div className="order-sheet-photo-grid" aria-label="Photos du litige">
                {order.dispute.media.slice(0, 10).map((media, index) =>
                  media.type === "video" ? (
                    <video key={`${media.url.slice(0, 32)}-${index}`} src={media.url} controls />
                  ) : (
                    <div key={`${media.url.slice(0, 32)}-${index}`} className="order-sheet-photo-cell">
                      <Image src={media.url} alt={`Preuve ${index + 1}`} fill />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Commande */}
        <div className="order-detail-section">
          <p className="order-detail-section-label">Commande</p>
          <div className="order-detail-card">
            <div className="order-detail-row">
              <span className="order-detail-label">Référence</span>
              <span className="order-sheet-ref">{order.orderNumber}</span>
            </div>
            <DetailRow label="Reçue le" value={formatDateTime(order.createdAt)} />
            {order.paidAt && <DetailRow label="Payée le" value={formatDateTime(order.paidAt)} />}
            {order.paymentMethod && (
              <DetailRow label="Moyen de paiement" value={paymentLabel(order.paymentMethod)} />
            )}
            <DetailRow label="Délai de livraison" value={formatDeliveryWindow(order.deliveryHours)} />
            {order.releasedAt && (
              <DetailRow label="Argent libéré le" value={formatDateTime(order.releasedAt)} />
            )}
            {order.refundedAt && (
              <DetailRow label="Remboursée le" value={formatDateTime(order.refundedAt)} />
            )}
          </div>
        </div>

        {canCancel && (
          <div className="order-sheet-actions">
            <button
              type="button"
              className="btn-danger btn-compact"
              onClick={() => setShowCancelModal(true)}
            >
              Annuler cette commande
            </button>
          </div>
        )}
      </FloatingSheet>

      {showCancelModal && (
        <div
          className="modal-backdrop modal-backdrop-stacked"
          onClick={() => !cancelling && setShowCancelModal(false)}
        >
          <div className="modal-sheet cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <h3 className="cancel-modal-title">Annuler la commande</h3>
            <p className="cancel-modal-desc">
              Le client sera remboursé automatiquement. Cette annulation compte dans votre taux de chargeback.
            </p>
            <label className="field-block" style={{ marginTop: "1rem" }}>
              <span className="field-block-label">Raison (optionnel)</span>
              <textarea
                className="input-field input-compact form-textarea-sm"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                disabled={cancelling}
              />
            </label>
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-danger btn-compact"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Annulation…" : "Confirmer"}
              </button>
              <button
                type="button"
                className="btn-ghost btn-compact"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
