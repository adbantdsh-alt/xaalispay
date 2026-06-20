"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ImagePlus, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, extractApiError } from "@/lib/api-client";

interface PublicDisputeOrder {
  productName: string;
  productImage?: string;
  productDescription?: string;
  sellerName: string;
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
  orderSlug,
  initialPin = "",
  variant = "modal",
}: {
  open: boolean;
  onClose: () => void;
  orderSlug?: string;
  initialPin?: string;
  variant?: "modal" | "page";
}) {
  const [pin, setPin] = useState(initialPin.replace(/\D/g, "").slice(0, 4));
  const [order, setOrder] = useState<PublicDisputeOrder | null>(null);
  const [reason, setReason] = useState("");
  const [media, setMedia] = useState<EvidenceMedia[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(!!orderSlug);
  const [alreadyOpen, setAlreadyOpen] = useState(false);

  // Retrouve la commande par son slug (capability token de la commande,
  // jamais par PIN seul — c'est exactement la faille d'énumération trouvée
  // dans l'audit : PIN seul = 10000 combinaisons à essayer sur toute la base).
  useEffect(() => {
    if (!open || !orderSlug) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/api/orders/${orderSlug}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setOrder(null);
          setError("Commande introuvable. Vérifiez le lien reçu après paiement.");
          return;
        }
        const data = await res.json();
        setOrder({
          productName: data.product_name,
          productImage: data.product_image || undefined,
          productDescription: data.product_description || undefined,
          sellerName: data.seller_business_name,
          amount: data.checkout_total,
          status: data.status,
        });
        if (data.status === "dispute") setAlreadyOpen(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderSlug]);

  useEffect(() => {
    if (open) return;
    setPin(initialPin.replace(/\D/g, "").slice(0, 4));
    setReason("");
    setMedia([]);
    setError("");
    setSuccess("");
  }, [open, initialPin]);

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

    if (!order || !orderSlug) return;
    if (pin.length !== 4) {
      setError("Entrez le code livraison à 4 chiffres reçu après paiement.");
      return;
    }
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
      const res = await apiFetch(`/api/orders/${orderSlug}/dispute`, {
        method: "POST",
        body: JSON.stringify({ pin, reason, media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiError(data, "Litige impossible"));
      setAlreadyOpen(!!data.already_open);
      setSuccess(
        data.already_open
          ? "Ce litige est déjà ouvert. Notre équipe suit le dossier."
          : "Litige ouvert. L'argent reste bloqué le temps de l'examen."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Litige impossible");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Pas de lien de commande : pas de moyen sûr de retrouver une commande
  // sans slug (le PIN seul n'identifie rien de façon sûre — voir plus haut).
  // Oriente vers le seul chemin légitime (lien reçu après paiement) ou le
  // support direct, plutôt que d'exposer une recherche par PIN seul.
  if (!orderSlug) {
    const content = (
      <section
        className={`lp-dispute-dialog ${variant === "page" ? "lp-dispute-dialog-page" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
        onClick={(e) => variant === "modal" && e.stopPropagation()}
      >
        {variant === "modal" && (
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
          Retrouvez le lien de votre commande — envoyé après paiement, ou accessible depuis
          la page &laquo; Validation livraison &raquo; — pour ouvrir un litige depuis là.
          Vous pouvez aussi{" "}
          <Link href="/contact" className="chargeback-link">
            contacter notre support
          </Link>{" "}
          directement.
        </p>
      </section>
    );
    if (variant === "page") return content;
    return (
      <div className="lp-dispute-overlay" role="presentation" onClick={onClose}>
        {content}
      </div>
    );
  }

  const content = (
      <section
        className={`lp-dispute-dialog ${variant === "page" ? "lp-dispute-dialog-page" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
        onClick={(e) => variant === "modal" && e.stopPropagation()}
      >
        {variant === "modal" && (
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

        {loading && !order && <p className="lp-dispute-copy">Recherche de la commande…</p>}

        {!loading && !order && error && <p className="lp-dispute-error">{error}</p>}

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

            {alreadyOpen && !success && (
              <p className="lp-dispute-copy">Un litige est déjà ouvert sur cette commande.</p>
            )}

            {!success && order.status === "protection" && (
              <>
                <p className="lp-dispute-copy">
                  Entrez le code livraison à 4 chiffres reçu après paiement, le motif et au
                  moins une preuve.
                </p>

                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  className="lp-dispute-pin"
                  placeholder="Code livraison"
                  aria-label="Code livraison"
                />

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
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button type="submit" className="lp-btn lp-btn-primary lp-dispute-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true" />
                      Envoi en cours…
                    </>
                  ) : (
                    "Valider le litige"
                  )}
                </button>
              </>
            )}

            {!success && order.status !== "protection" && !alreadyOpen && (
              <p className="lp-dispute-copy">
                Le litige n&apos;est possible que pendant la fenêtre de Séquestre Flash, après
                confirmation de la réception.
              </p>
            )}
          </form>
        )}

        {error && order && <p className="lp-dispute-error">{error}</p>}
        {success && <p className="lp-dispute-success">{success}</p>}
      </section>
  );

  if (variant === "page") return content;

  return (
    <div className="lp-dispute-overlay" role="presentation" onClick={onClose}>
      {content}
    </div>
  );
}
