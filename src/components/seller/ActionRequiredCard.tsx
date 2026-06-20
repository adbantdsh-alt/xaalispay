"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { IconCheck } from "@/components/ui/AppIcon";

export function ActionRequiredCard({
  order,
  onValidate,
  onCancel,
  error,
  protectionMinutes = 30,
}: {
  order: Order;
  onValidate: (orderId: string, pin: string) => Promise<boolean>;
  onCancel?: (orderId: string, reason: string) => Promise<void>;
  error?: string;
  protectionMinutes?: number;
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
      <section className="action-card animate-fade-up-d1">
        <p className="action-card-badge">Action requise</p>
        <h2 className="action-card-title">Valider la livraison</h2>
        <p className="action-card-desc">
          {order.productName} · {order.clientName || "Client"} · {formatCurrency(order.productPrice)}
        </p>
        <p className="action-card-hint">
          Demandez le PIN au client après livraison.
        </p>
        <form onSubmit={handleSubmit} className="action-card-form">
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
          <button
            type="submit"
            disabled={loading || !pin}
            className="btn-seller-primary btn-seller-primary-compact"
          >
            {success ? (
              <span className="copy-btn-copied">
                <IconCheck size={14} /> Validé
              </span>
            ) : loading ? (
              <><span className="btn-spinner" aria-hidden="true" />…</>
            ) : (
              "Valider"
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
      </section>

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
