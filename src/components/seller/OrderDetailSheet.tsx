"use client";

import { FloatingSheet } from "@/components/ui/FloatingSheet";
import { formatCurrency, formatDeliveryHours, getOrderTotal } from "@/lib/utils";
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
}: {
  order: Order | null;
  onClose: () => void;
}) {
  if (!order) return null;

  const visual = getOrderStatusVisual(order.status);
  const steps = getSellerTimeline(order.status);
  const total = getOrderTotal(order);
  const clientName = order.clientName?.trim() || order.clientFirstName?.trim() || "Client";

  return (
    <FloatingSheet open={!!order} onClose={onClose} title="Détail de la commande">
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
            <span>{formatDeliveryHours(order.deliveryHours)}</span>
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
    </FloatingSheet>
  );
}
