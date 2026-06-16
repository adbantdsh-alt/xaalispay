"use client";

import { useEffect, useState } from "react";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { getOrderStatusVisual } from "@/lib/order-status-ui";
import { getSellerHumanStatus } from "@/lib/order-timeline";
import type { OrderStatus } from "@/lib/types";

interface QuickOrder {
  id: string;
  productName: string;
  productPrice: number;
  deliveryCost: number;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  clientNote?: string;
  status: OrderStatus;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  disputeReason?: string;
  protectionEndsAt?: string;
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_LABELS: Record<string, string> = {
  wave: "Wave",
  orange: "Orange Money",
};

export function OrderQuickView({
  order,
  onClose,
  onCancel,
}: {
  order: QuickOrder;
  onClose: () => void;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
}) {
  const visual = getOrderStatusVisual(order.status);
  const total = getOrderTotal({ productPrice: order.productPrice, deliveryCost: order.deliveryCost || 0 });
  const canCancel = onCancel && (order.status === "pending_payment" || order.status === "paid");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-sheet order-quick-view" onClick={(e) => e.stopPropagation()}>
          <div className="modal-sheet-handle" />

          <div className="oqv-header">
            <div className={`oqv-status-dot oqv-status-dot--${visual.tone}`} />
            <div className="oqv-header-texts">
              <h3 className="oqv-product">{order.productName}</h3>
              <p className="oqv-status-label">{getSellerHumanStatus(order.status)}</p>
            </div>
            <button type="button" className="oqv-close-btn" onClick={onClose} aria-label="Fermer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="oqv-body">
            <div className="oqv-row">
              <span className="oqv-label">Client</span>
              <span className="oqv-value">{order.clientName || "—"}</span>
            </div>
            {order.clientPhone && (
              <div className="oqv-row">
                <span className="oqv-label">Téléphone</span>
                <a href={`tel:${order.clientPhone}`} className="oqv-value oqv-link">
                  {order.clientPhone}
                </a>
              </div>
            )}
            {order.clientAddress && (
              <div className="oqv-row">
                <span className="oqv-label">Adresse</span>
                <span className="oqv-value">{order.clientAddress}</span>
              </div>
            )}
            {order.clientNote && (
              <div className="oqv-row">
                <span className="oqv-label">Note</span>
                <span className="oqv-value">{order.clientNote}</span>
              </div>
            )}

            <div className="oqv-divider" />

            <div className="oqv-row">
              <span className="oqv-label">Montant</span>
              <span className="oqv-value oqv-amount">{formatCurrency(total)}</span>
            </div>
            {order.paymentMethod && (
              <div className="oqv-row">
                <span className="oqv-label">Paiement</span>
                <span className="oqv-value">
                  {METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
            )}
            <div className="oqv-row">
              <span className="oqv-label">Commandé le</span>
              <span className="oqv-value">{fmt(order.createdAt)}</span>
            </div>
            {order.paidAt && (
              <div className="oqv-row">
                <span className="oqv-label">Payé le</span>
                <span className="oqv-value">{fmt(order.paidAt)}</span>
              </div>
            )}
            {order.protectionEndsAt && order.status === "protection" && (
              <div className="oqv-row">
                <span className="oqv-label">Libération auto</span>
                <span className="oqv-value">{fmt(order.protectionEndsAt)}</span>
              </div>
            )}
            {order.disputeReason && (
              <div className="oqv-row oqv-row--danger">
                <span className="oqv-label">Motif litige</span>
                <span className="oqv-value">{order.disputeReason}</span>
              </div>
            )}
            {order.cancellationReason && (
              <div className="oqv-row">
                <span className="oqv-label">Raison annulation</span>
                <span className="oqv-value">{order.cancellationReason}</span>
              </div>
            )}
          </div>

          <div className="oqv-footer">
            {canCancel && (
              <button
                type="button"
                className="btn-danger btn-compact oqv-cancel-btn"
                onClick={() => setShowCancelModal(true)}
              >
                Annuler cette commande
              </button>
            )}
            <button type="button" className="btn-ghost btn-compact" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="modal-backdrop modal-backdrop-stacked" onClick={() => !cancelling && setShowCancelModal(false)}>
          <div className="modal-sheet cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet-handle" />
            <h3 className="cancel-modal-title">Annuler la commande</h3>
            <p className="cancel-modal-desc">
              Le client sera informé et remboursé automatiquement. Cette annulation compte dans
              votre taux de chargeback.
            </p>
            <p className="cancel-modal-order">
              <strong>{order.productName}</strong> — {order.clientName || "Client"} —{" "}
              {formatCurrency(total)}
            </p>
            <label className="field-block" style={{ marginTop: "1rem" }}>
              <span className="field-block-label">Raison (optionnel)</span>
              <textarea
                className="input-field input-compact form-textarea-sm"
                rows={2}
                placeholder="Ex. rupture de stock, problème de livraison…"
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
                {cancelling ? (
                  <><span className="btn-spinner" aria-hidden="true" />Annulation…</>
                ) : (
                  "Confirmer l'annulation"
                )}
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
