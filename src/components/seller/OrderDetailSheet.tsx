"use client";

import { useState } from "react";
import { FloatingSheet } from "@/components/ui/FloatingSheet";
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
      <div className="order-sheet-head">
        <span className={`order-sheet-status order-sheet-status-${visual.tone}`}>
          {getSellerHumanStatus(order.status)}
        </span>
        <p className="order-sheet-amount">{formatCurrency(total)}</p>
        <p className="order-sheet-product">{order.productName}</p>
      </div>

      <ol className="order-timeline" aria-label="Progression de la commande">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`order-timeline-step${step.done ? " is-done" : ""}${
              step.active ? " is-active" : ""
            }`}
          >
            <span className="order-timeline-dot" aria-hidden="true" />
            <span className="order-timeline-label">{step.label}</span>
          </li>
        ))}
      </ol>

      <div>
        <p className="shop-section-label">Client</p>
        <div className="profile-sheet-rows">
          <div className="profile-sheet-row">
            <span className="text-muted">Nom</span>
            <span>{clientName}</span>
          </div>
          {order.clientPhone && (
            <div className="profile-sheet-row">
              <span className="text-muted">Téléphone</span>
              <a href={`tel:${order.clientPhone}`} className="order-sheet-link">
                {order.clientPhone}
              </a>
            </div>
          )}
          {order.clientAddress && (
            <div className="profile-sheet-row">
              <span className="text-muted">Adresse</span>
              <span className="order-sheet-value-right">{order.clientAddress}</span>
            </div>
          )}
          {order.clientNote && (
            <div className="profile-sheet-row">
              <span className="text-muted">Note</span>
              <span className="order-sheet-value-right">{order.clientNote}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="shop-section-label">Montant</p>
        <div className="profile-sheet-rows">
          <div className="profile-sheet-row">
            <span className="text-muted">Produit</span>
            <span>{formatCurrency(order.productPrice)}</span>
          </div>
          <div className="profile-sheet-row">
            <span className="text-muted">Livraison</span>
            <span>{order.deliveryCost ? formatCurrency(order.deliveryCost) : "Offerte"}</span>
          </div>
          <div className="profile-sheet-row order-sheet-row-total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {order.status === "dispute" && (
        <div>
          <p className="shop-section-label">Litige</p>
          <div className="profile-sheet-rows">
            {order.disputeOpenedAt && (
              <div className="profile-sheet-row">
                <span className="text-muted">Ouvert le</span>
                <span>{formatDateTime(order.disputeOpenedAt)}</span>
              </div>
            )}
            {order.disputeReason && (
              <div className="profile-sheet-row">
                <span className="text-muted">Motif</span>
                <span className="order-sheet-value-right">{order.disputeReason}</span>
              </div>
            )}
            <div className="profile-sheet-row">
              <span className="text-muted">Preuves photo</span>
              <span>{order.disputeMedia?.length || order.disputePhotos?.length || 0} preuve(s)</span>
            </div>
          </div>
          {!!(order.disputeMedia?.length || order.disputePhotos?.length) && (
            <div className="order-sheet-photo-grid" aria-label="Photos du litige">
              {(order.disputeMedia || order.disputePhotos?.map((url) => ({ type: "image" as const, url })) || [])
                .slice(0, 10)
                .map((media, index) =>
                  media.type === "video" ? (
                    <video key={`${media.url.slice(0, 32)}-${index}`} src={media.url} controls />
                  ) : (
                    <img
                      key={`${media.url.slice(0, 32)}-${index}`}
                      src={media.url}
                      alt={`Preuve ${index + 1}`}
                    />
                  )
                )}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="shop-section-label">Commande</p>
        <div className="profile-sheet-rows">
          <div className="profile-sheet-row">
            <span className="text-muted">Référence</span>
            <span className="order-sheet-ref">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="profile-sheet-row">
            <span className="text-muted">Reçue le</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.paidAt && (
            <div className="profile-sheet-row">
              <span className="text-muted">Payée le</span>
              <span>{formatDateTime(order.paidAt)}</span>
            </div>
          )}
          {order.paymentMethod && (
            <div className="profile-sheet-row">
              <span className="text-muted">Moyen de paiement</span>
              <span>{paymentLabel(order.paymentMethod)}</span>
            </div>
          )}
          <div className="profile-sheet-row">
            <span className="text-muted">Délai de livraison</span>
            <span>{formatDeliveryWindow(order.deliveryHours)}</span>
          </div>
          {order.releasedAt && (
            <div className="profile-sheet-row">
              <span className="text-muted">Argent libéré le</span>
              <span>{formatDateTime(order.releasedAt)}</span>
            </div>
          )}
          {order.refundedAt && (
            <div className="profile-sheet-row">
              <span className="text-muted">Remboursée le</span>
              <span>{formatDateTime(order.refundedAt)}</span>
            </div>
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
      <div className="modal-backdrop modal-backdrop-stacked" onClick={() => !cancelling && setShowCancelModal(false)}>
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
            <button type="button" className="btn-danger btn-compact" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Annulation…" : "Confirmer"}
            </button>
            <button type="button" className="btn-ghost btn-compact" onClick={() => setShowCancelModal(false)} disabled={cancelling}>
              Retour
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
