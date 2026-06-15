"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { IconCheck } from "@/components/ui/AppIcon";

export function ActionRequiredCard({
  order,
  onValidate,
  error,
}: {
  order: Order;
  onValidate: (orderId: string, pin: string) => Promise<void>;
  error?: string;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    await onValidate(order.id, pin);
    setLoading(false);
    setSuccess(true);
    setPin("");
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <section className="action-card animate-fade-up-d1">
      <p className="action-card-badge">Action requise</p>
      <h2 className="action-card-title">Valider la livraison</h2>
      <p className="action-card-desc">
        {order.productName} · {order.clientName || "Client"} · {formatCurrency(order.productPrice)}
      </p>
      <p className="action-card-hint">
        Demandez le code PIN au client après livraison du colis.
      </p>
      <form onSubmit={handleSubmit} className="action-card-form">
        <input
          className="input-field action-pin-input"
          placeholder="Code PIN"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !pin} className="btn-seller-primary btn-seller-primary-compact">
          {success ? (
            <span className="copy-btn-copied">
              <IconCheck size={14} /> Validé
            </span>
          ) : loading ? (
            "…"
          ) : (
            "Valider"
          )}
        </button>
      </form>
      {error && <p className="alert-danger" style={{ marginTop: "0.75rem" }}>{error}</p>}
      {success && (
        <p className="toast-success" role="status">
          PIN validé — libération dans 30 min
        </p>
      )}
    </section>
  );
}
