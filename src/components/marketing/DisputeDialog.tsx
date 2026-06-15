"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, Search, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PublicDisputeOrder {
  productName: string;
  productImage?: string;
  productDescription?: string;
  sellerName: string;
  clientName?: string;
  amount: number;
  status: string;
}

interface EvidenceMedia {
  type: "image" | "video";
  url: string;
  name: string;
}

const MAX_IMAGE_SIZE = 2_000_000;
const MAX_VIDEO_SIZE = 8_000_000;

function readMedia(file: File): Promise<EvidenceMedia> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: String(reader.result || ""),
        name: file.name,
      });
    reader.onerror = () => reject(new Error("Lecture média impossible"));
    reader.readAsDataURL(file);
  });
}

export function DisputeDialog({
  open,
  onClose,
  initialPin = "",
  embedded = false,
}: {
  open: boolean;
  onClose: () => void;
  initialPin?: string;
  embedded?: boolean;
}) {
  const [pin, setPin] = useState(initialPin.replace(/\D/g, "").slice(0, 4));
  const [order, setOrder] = useState<PublicDisputeOrder | null>(null);
  const [reason, setReason] = useState("");
  const [media, setMedia] = useState<EvidenceMedia[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const lookupPin = async (targetPin: string) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", pin: targetPin }),
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

  useEffect(() => {
    if (!open || embedded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, embedded]);

  useEffect(() => {
    if (open || embedded) return;
    setPin("");
    setOrder(null);
    setReason("");
    setMedia([]);
    setError("");
    setSuccess("");
    setLoading(false);
  }, [open, embedded]);

  useEffect(() => {
    if (!open && !embedded) return;
    const clean = initialPin.replace(/\D/g, "").slice(0, 4);
    if (clean.length !== 4) return;
    setPin(clean);
    lookupPin(clean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPin, open, embedded]);

  if (!open && !embedded) return null;

  const lookup = async (e: FormEvent) => {
    e.preventDefault();
    lookupPin(pin);
  };

  const handleFiles = async (files: FileList | null) => {
    setError("");
    if (!files) return;
    const picked = Array.from(files);
    const nextFiles = [...media];
    const remaining = 10 - nextFiles.length;
    if (remaining <= 0) {
      setError("Maximum 10 preuves par litige.");
      return;
    }

    const selected = picked.slice(0, remaining);
    const oversized = selected.find((file) => {
      if (file.type.startsWith("video/")) return file.size > MAX_VIDEO_SIZE;
      return file.size > MAX_IMAGE_SIZE;
    });
    if (oversized) {
      setError("Image max 2 Mo, vidéo max 8 Mo.");
      return;
    }
    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") && !file.type.startsWith("video/")
    );
    if (invalid) {
      setError("Ajoutez uniquement des images ou des vidéos courtes.");
      return;
    }
    setMedia([...nextFiles, ...(await Promise.all(selected.map(readMedia)))]);
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
    if (media.length < 1 || media.length > 10) {
      setError("Ajoutez au moins 1 preuve (image ou vidéo).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", pin, reason, media }),
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

  const dialog = (
      <section
        className={`lp-dispute-dialog ${embedded ? "lp-dispute-dialog-embedded" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
        onClick={(e) => e.stopPropagation()}
      >
        {!embedded && (
          <button type="button" className="lp-dispute-close" onClick={onClose} aria-label="Fermer">
            <X size={18} strokeWidth={1.5} />
          </button>
        )}

        <span className="lp-dispute-kicker">
          <AlertTriangle size={16} strokeWidth={1.5} />
          Séquestre bloqué en cas de problème
        </span>
        <h2 id="dispute-title" className="lp-dispute-title serif">
          Ouvrir un litige
        </h2>
        <p className="lp-dispute-copy">
          Entrez le code livraison à 4 chiffres reçu après paiement. Nous retrouvons la
          commande, puis vous ajoutez le motif et au moins une preuve.
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
              {order.productImage && (
                <img
                  className="lp-dispute-product-image"
                  src={order.productImage}
                  alt={order.productName}
                />
              )}
              <div>
                <p className="lp-dispute-order-label">Commande retrouvée</p>
                <p className="lp-dispute-order-name">{order.productName}</p>
                <p className="lp-dispute-order-meta">
                  {order.sellerName} · {formatCurrency(order.amount)}
                </p>
                {order.productDescription && (
                  <p className="lp-dispute-order-desc">{order.productDescription}</p>
                )}
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
                  <span>
                    <ImagePlus size={18} strokeWidth={1.5} />
                    Preuves
                  </span>
                  <strong>
                    {media.length ? `${media.length}/10 média(s)` : "Image ou vidéo courte"}
                  </strong>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>

                {media.length > 0 && (
                  <div className="lp-dispute-media-grid" aria-label="Preuves ajoutées">
                    {media.map((item, index) => (
                      <div className="lp-dispute-media-item" key={`${item.name}-${index}`}>
                        {item.type === "image" ? (
                          <img src={item.url} alt={`Preuve ${index + 1}`} />
                        ) : (
                          <video src={item.url} muted playsInline controls />
                        )}
                        <button
                          type="button"
                          aria-label={`Retirer la preuve ${index + 1}`}
                          onClick={() => setMedia(media.filter((_, i) => i !== index))}
                        >
                          <Trash2 size={14} strokeWidth={1.7} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
  );

  if (embedded) return dialog;

  return (
    <div className="lp-dispute-overlay" role="presentation" onClick={onClose}>
      {dialog}
    </div>
  );
}
