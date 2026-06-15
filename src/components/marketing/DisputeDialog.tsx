"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PublicDisputeOrder {
  productName: string;
  sellerName: string;
  clientName?: string;
  amount: number;
  status: string;
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Lecture image impossible"));
    reader.readAsDataURL(file);
  });
}

export function DisputeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [order, setOrder] = useState<PublicDisputeOrder | null>(null);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) return;
    setPin("");
    setOrder(null);
    setReason("");
    setPhotos([]);
    setError("");
    setSuccess("");
    setLoading(false);
  }, [open]);

  if (!open) return null;

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commande introuvable");
      setOrder(data.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "Commande introuvable");
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    setError("");
    if (!files) return;
    const picked = Array.from(files).slice(0, 10);
    const oversized = picked.find((file) => file.size > 1_000_000);
    if (oversized) {
      setError("Chaque photo doit faire moins de 1 Mo.");
      return;
    }
    const invalid = picked.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setError("Ajoutez uniquement des images.");
      return;
    }
    setPhotos(await Promise.all(picked.map(readImage)));
  };

  const submitDispute = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!order) return;
    if (reason.trim().length < 12) {
      setError("Expliquez le problème en quelques mots.");
      return;
    }
    if (photos.length < 2 || photos.length > 10) {
      setError("Ajoutez entre 2 et 10 photos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", pin, reason, photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Litige impossible");
      setOrder(data.order);
      setSuccess(
        data.alreadyOpen
          ? "Ce litige est déjà ouvert. Notre équipe suit le dossier."
          : "Litige ouvert. L'argent reste bloqué le temps de l'examen."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Litige impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-dispute-overlay" role="presentation" onClick={onClose}>
      <section
        className="lp-dispute-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="lp-dispute-close" onClick={onClose} aria-label="Fermer">
          <X size={18} strokeWidth={1.5} />
        </button>

        <span className="lp-dispute-kicker">
          <AlertTriangle size={16} strokeWidth={1.5} />
          Séquestre bloqué en cas de problème
        </span>
        <h2 id="dispute-title" className="lp-dispute-title serif">
          Ouvrir un litige
        </h2>
        <p className="lp-dispute-copy">
          Entrez le code livraison à 4 chiffres reçu après paiement. Nous retrouvons la
          commande, puis vous ajoutez le motif et les preuves.
        </p>

        <form onSubmit={lookup} className="lp-dispute-pin-form">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            pattern="[0-9]{4}"
            className="lp-dispute-pin"
            placeholder="Code livraison"
            aria-label="Code livraison"
          />
          <button type="submit" className="lp-btn lp-btn-primary" disabled={loading || pin.length !== 4}>
            <Search size={17} strokeWidth={1.5} />
            Rechercher
          </button>
        </form>

        {order && (
          <form onSubmit={submitDispute} className="lp-dispute-body">
            <div className="lp-dispute-order">
              <div>
                <p className="lp-dispute-order-label">Commande retrouvée</p>
                <p className="lp-dispute-order-name">{order.productName}</p>
                <p className="lp-dispute-order-meta">
                  {order.sellerName} · {formatCurrency(order.amount)}
                </p>
              </div>
              {success ? (
                <CheckCircle2 size={24} strokeWidth={1.5} />
              ) : (
                <AlertTriangle size={24} strokeWidth={1.5} />
              )}
            </div>

            {!success && (
              <>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="lp-dispute-textarea"
                  placeholder="Expliquez ce qui ne va pas : produit non conforme, colis abîmé, article manquant..."
                />

                <label className="lp-dispute-upload">
                  <span>Photos preuves</span>
                  <strong>{photos.length ? `${photos.length} photo(s)` : "Ajoutez 2 à 10 photos"}</strong>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>

                <button type="submit" className="lp-btn lp-btn-primary lp-dispute-submit" disabled={loading}>
                  Valider le litige
                </button>
              </>
            )}
          </form>
        )}

        {error && <p className="lp-dispute-error">{error}</p>}
        {success && <p className="lp-dispute-success">{success}</p>}
      </section>
    </div>
  );
}
