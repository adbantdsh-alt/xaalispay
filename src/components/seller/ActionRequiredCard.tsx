"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatCurrency, splitCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export function ActionRequiredCard({
  order,
  onValidate,
  onCancel,
  error,
  protectionMinutes = 30,
  expanded,
  onExpand,
}: {
  order: Order;
  onValidate: (orderId: string, pin: string) => Promise<boolean>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  error?: string;
  protectionMinutes?: number;
  /** Affiche le formulaire PIN directement ; sinon ligne compacte avec bouton "Valider". */
  expanded: boolean;
  onExpand?: () => void;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelWarning, setCancelWarning] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setSuccess(false);
    const ok = await onValidate(order.id, pin);
    setLoading(false);
    if (!ok) return;
    setSuccess(true);
    setPin("");
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    setCancelWarning("");
    await onCancel(order.id, cancelReason || "Vendeur dans l'incapacité de livrer");
    setCancelling(false);
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="action-row">
        <div className="action-row-main">
          <span className="action-row-icon">
            <IconPackage size={20} />
          </span>
          <div className="action-row-body">
            <p className="action-row-name">{order.productName}</p>
            <p className="action-row-meta">
              {order.clientName || "Client"} · payé {timeAgo(order.paidAt)}
            </p>
          </div>
          <div className="action-row-price">
            <p className="action-row-price-amount">{splitCurrency(order.productPrice)[0]}</p>
            <p className="action-row-price-suffix">{splitCurrency(order.productPrice)[1]}</p>
          </div>
        </div>

        {expanded ? (
          <>
            <form onSubmit={handleSubmit} className="action-row-form">
              <input
                className={`input-field action-pin-input${error ? " has-error" : ""}`}
                placeholder="Code PIN client"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={!!error}
              />
              <button type="submit" disabled={loading || !pin} className="btn-primary action-row-submit">
                {success ? (
                  <span className="copy-btn-copied">
                    <IconCheck size={14} /> Validé
                  </span>
                ) : loading ? (
                  <><span className="btn-spinner" aria-hidden="true" />…</>
                ) : (
                  "Valider la livraison"
                )}
              </button>
            </form>
            {error && (
              <p className="alert-danger" role="alert" style={{ marginTop: "0.75rem" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="toast-success" role="status">
                PIN validé — libération dans {protectionMinutes} min
              </p>
            )}
            {onCancel && (
              <button
                type="button"
                className="action-card-cancel-btn"
                onClick={() => setShowCancelModal(true)}
              >
                Je ne peux pas livrer cette commande
              </button>
            )}
          </>
        ) : (
          <button type="button" className="action-row-compact-btn" onClick={onExpand}>
            Valider <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Modal de confirmation d'annulation */}
      {showCancelModal && (
        <div className="modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div
            className="modal-sheet cancel-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-sheet-handle" />
            <h3 className="cancel-modal-title">Annuler la commande</h3>
            <p className="cancel-modal-desc">
              Le client sera informé et remboursé automatiquement. Cette annulation
              compte dans votre taux de chargeback.
            </p>
            <p className="cancel-modal-order">
              <strong>{order.productName}</strong> — {order.clientName || "Client"} —{" "}
              {formatCurrency(order.productPrice)}
            </p>
            <label className="field-block" style={{ marginTop: "1rem" }}>
              <span className="field-block-label">Raison (optionnel)</span>
              <textarea
                className="input-field input-compact form-textarea-sm"
                rows={2}
                placeholder="Ex. rupture de stock, problème de livraison…"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
            {cancelWarning && (
              <p className="alert-danger" role="alert" style={{ marginTop: "0.75rem", fontSize: "0.82rem" }}>
                {cancelWarning}
              </p>
            )}
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
