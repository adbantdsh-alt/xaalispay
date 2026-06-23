"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, extractApiError } from "@/lib/api-client";

interface PublicDisputeOrder {
  orderNumber: string;
  productName: string;
  productImage?: string;
  productDescription?: string;
  sellerName: string;
  amount: number;
  status: string;
}

const DISPUTE_TYPE_OPTIONS = [
  { value: "non_conforme", label: "Produit non conforme" },
  { value: "non_fonctionnel", label: "Produit non fonctionnel" },
  { value: "erreur_taille_couleur", label: "Erreur taille / couleur" },
  { value: "annulation_caprice", label: "Je ne veux plus du produit" },
  { value: "colis_endommage", label: "Colis endommagé" },
  { value: "article_manquant", label: "Article manquant" },
  { value: "autre", label: "Autre" },
] as const;

interface EvidenceMedia {
  type: "image" | "video";
  url: string;
  name: string;
  size: number;
}

const MAX_IMAGE_SIZE = 2_000_000;
const MAX_VIDEO_SIZE = 8_000_000;
const MAX_MEDIA = 10;

function readMedia(file: File): Promise<EvidenceMedia> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: String(reader.result || ""),
        name: file.name,
        size: file.size,
      });
    reader.onerror = () => reject(new Error("Lecture média impossible"));
    reader.readAsDataURL(file);
  });
}

export function DisputeDialog({ orderSlug, initialPin = "" }: { orderSlug?: string; initialPin?: string }) {
  const [pin, setPin] = useState(initialPin.replace(/\D/g, "").slice(0, 4));
  const [order, setOrder] = useState<PublicDisputeOrder | null>(null);
  const [disputeType, setDisputeType] = useState("");
  const [reason, setReason] = useState("");
  const [media, setMedia] = useState<EvidenceMedia[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(!!orderSlug);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyOpen, setAlreadyOpen] = useState(false);

  // Retrouve la commande par son slug (capability token de la commande,
  // jamais par PIN seul -- c'est exactement la faille d'énumération trouvée
  // dans l'audit : PIN seul = 10000 combinaisons à essayer sur toute la base).
  useEffect(() => {
    if (!orderSlug) return;
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
          orderNumber: data.order_number,
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
  }, [orderSlug]);

  const addFiles = async (files: FileList | null): Promise<void> => {
    setMediaError("");
    if (!files) return;
    const picked = Array.from(files);
    const remaining = MAX_MEDIA - media.length;
    if (remaining <= 0) {
      setMediaError("Maximum 10 preuves par litige.");
      return;
    }
    const selected = picked.slice(0, remaining);
    const oversized = selected.find((file) =>
      file.type.startsWith("video/") ? file.size > MAX_VIDEO_SIZE : file.size > MAX_IMAGE_SIZE
    );
    if (oversized) {
      setMediaError("Image max 2 Mo, vidéo max 8 Mo.");
      return;
    }
    const invalid = selected.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
    if (invalid) {
      setMediaError("Ajoutez uniquement des images ou des vidéos courtes.");
      return;
    }
    const newItems = await Promise.all(selected.map(readMedia));
    setMedia((prev) => [...prev, ...newItems]);
  };

  const removeMedia = (index: number) => setMedia((prev) => prev.filter((_, i) => i !== index));

  const canSubmitDispute =
    pin.length === 4 && !!disputeType && reason.trim().length >= 12 && media.length >= 1 && media.length <= MAX_MEDIA;

  const submitDispute = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!order || !orderSlug || !canSubmitDispute) return;

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/orders/${orderSlug}/dispute`, {
        method: "POST",
        body: JSON.stringify({ pin, dispute_type: disputeType, reason, media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiError(data, "Litige impossible"));
      setAlreadyOpen(!!data.already_open);
      setSuccess(
        data.already_open
          ? "Ce litige est déjà ouvert. Notre équipe suit le dossier."
          : "Litige ouvert. L'argent reste bloqué le temps de l'examen."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Litige impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const step = !orderSlug || (!loading && !order) ? 1 : success ? 3 : 2;

  return (
    <div className="lp-litige">
      <section className="border-b border-[#1E3A5F]/8 bg-gradient-to-b from-[#FBF7F2] to-white">
        <div className="lp-container py-14 md:py-20 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#1E3A5F]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8895A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B8895A]" />
            Protection acheteur
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", lineHeight: 1.05, letterSpacing: "-0.025em", fontWeight: 600 }} className="mt-5 text-[#1E3A5F]">
            Ouvrir un litige
          </h1>
          <p className="mt-5 text-[17px] text-[#1E3A5F]/70 leading-relaxed">
            Un problème avec votre commande ? Pas de panique. Votre argent n&apos;a pas été envoyé
            au vendeur — il est <strong className="text-[#1E3A5F]">bloqué chez XaalisPay</strong>.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ReassureCard icon="lock" title="Argent bloqué" text="Tant que le litige n'est pas tranché, rien ne part au vendeur." />
            <ReassureCard icon="users" title="Équipe XaalisPay" text="Notre équipe étudie chaque dossier et tranche en toute neutralité." />
            <ReassureCard icon="refund" title="Remboursement possible" text="Si le litige est validé, vous êtes remboursé intégralement." />
          </div>
        </div>
      </section>

      <section className="border-b border-[#1E3A5F]/8 bg-white">
        <div className="lp-container py-6 max-w-3xl">
          <Stepper step={step} />
        </div>
      </section>

      <main className="bg-[#FAFAF8]">
        <div className="lp-container py-12 md:py-16 max-w-3xl">
          {step === 1 && !orderSlug && (
            <Card>
              <CardHeader
                eyebrow="Commande"
                title="Retrouvez votre commande"
                description="Pour ouvrir un litige en toute sécurité, utilisez le lien reçu par WhatsApp ou SMS après votre paiement — il pointe directement vers votre commande."
              />
              <p className="mt-6 text-[14px] text-[#1E3A5F]/75 leading-relaxed">
                Vous pouvez aussi ouvrir un litige directement depuis la page de paiement de votre
                commande, ou{" "}
                <Link href="/contact" className="font-semibold text-[#1E3A5F] underline underline-offset-4">
                  contacter notre support
                </Link>{" "}
                avec votre référence de commande.
              </p>
            </Card>
          )}

          {step === 1 && orderSlug && (
            <Card>
              <CardHeader eyebrow="Commande" title="Recherche de votre commande…" description="Un instant, nous vérifions votre lien." />
              {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}
            </Card>
          )}

          {step === 2 && order && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {order.productImage && (
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="h-16 w-16 rounded-xl object-cover flex-none lp-hairline"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#B8895A]">
                        Commande retrouvée · {order.orderNumber}
                      </div>
                      <div className="mt-2 text-[20px] font-semibold text-[#1E3A5F] leading-tight">
                        {order.productName}
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                        <SummaryItem label="Vendeur" value={order.sellerName} />
                        <SummaryItem label="Montant" value={formatCurrency(order.amount)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-[#FBF7F2] border border-[#B8895A]/20 px-4 py-3 flex items-start gap-3 text-[13px] text-[#1E3A5F]/80">
                  <strong className="text-[#1E3A5F]">{formatCurrency(order.amount)}</strong>&nbsp;sont
                  actuellement bloqués chez XaalisPay. Le vendeur ne touchera rien tant que ce litige
                  n&apos;est pas résolu.
                </div>
              </Card>

              {alreadyOpen && !success && (
                <Card>
                  <p className="text-[14px] text-[#1E3A5F]/75">Un litige est déjà ouvert sur cette commande. Notre équipe suit le dossier.</p>
                </Card>
              )}

              {!alreadyOpen && order.status !== "protection" && (
                <Card>
                  <p className="text-[14px] text-[#1E3A5F]/75">
                    Le litige n&apos;est possible que pendant la fenêtre de Séquestre Flash, après
                    confirmation de la réception.
                  </p>
                </Card>
              )}

              {!alreadyOpen && order.status === "protection" && (
                <Card>
                  <CardHeader
                    eyebrow="Détails du litige"
                    title="Expliquez le problème"
                    description="Entrez le code livraison reçu après paiement, le type de problème, le motif et au moins une preuve."
                  />
                  <form onSubmit={submitDispute} className="mt-6 space-y-6">
                    <Field label="Code livraison" required hint="4 chiffres">
                      <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        placeholder="0000"
                        aria-label="Code livraison"
                        className="w-32 rounded-2xl border border-[#1E3A5F]/15 bg-white px-4 py-3 text-[18px] tracking-[0.3em] text-center text-[#1E3A5F] focus:outline-none focus:border-[#B8895A] focus:ring-4 focus:ring-[#B8895A]/10 transition"
                      />
                    </Field>

                    <Field label="Type de problème" required>
                      <select
                        value={disputeType}
                        onChange={(e) => setDisputeType(e.target.value)}
                        aria-label="Type de problème"
                        className="w-full rounded-2xl border border-[#1E3A5F]/15 bg-white px-4 py-3 text-[14px] text-[#1E3A5F] focus:outline-none focus:border-[#B8895A] focus:ring-4 focus:ring-[#B8895A]/10 transition"
                      >
                        <option value="">Sélectionnez…</option>
                        {DISPUTE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Que s'est-il passé ?" hint={`${reason.trim().length} caractères (12 min.)`}>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value.slice(0, 1500))}
                        rows={6}
                        placeholder="Ex : J'ai reçu un produit différent de celui commandé, la boîte était ouverte à la livraison…"
                        className="w-full rounded-2xl border border-[#1E3A5F]/15 bg-white px-4 py-3 text-[14px] text-[#1E3A5F] placeholder:text-[#1E3A5F]/35 focus:outline-none focus:border-[#B8895A] focus:ring-4 focus:ring-[#B8895A]/10 transition resize-none"
                      />
                    </Field>

                    <Field label="Photos ou vidéos du problème" required hint="Au moins 1 · max 10 · image 2 Mo / vidéo 8 Mo">
                      <FileDrop
                        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
                        files={media}
                        onAddFiles={addFiles}
                        onRemove={removeMedia}
                      />
                      {mediaError && <p className="mt-2 text-[12.5px] text-red-600">{mediaError}</p>}
                    </Field>

                    {error && <p className="text-[13px] text-red-600">{error}</p>}

                    <div className="rounded-2xl bg-[#1E3A5F]/[0.03] border border-[#1E3A5F]/10 px-4 py-3 text-[13px] text-[#1E3A5F]/75 leading-relaxed">
                      En soumettant ce litige, vous confirmez que les informations fournies sont
                      exactes. L&apos;argent reste bloqué chez XaalisPay pendant toute la durée de
                      l&apos;examen.
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmitDispute || submitting}
                      className="lp-btn lp-btn-primary w-full !py-3.5 !text-[14px] justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Envoi en cours…" : "Soumettre le litige"}
                    </button>
                  </form>
                </Card>
              )}
            </div>
          )}

          {step === 3 && order && (
            <Card>
              <div className="text-center py-6">
                <div className="mx-auto h-20 w-20 rounded-full bg-[#B8895A]/15 grid place-items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#B8895A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="mt-6 text-[28px] font-semibold text-[#1E3A5F]">Litige enregistré ✓</h2>
                <p className="mt-3 text-[15px] text-[#1E3A5F]/70 max-w-md mx-auto leading-relaxed">
                  Votre dossier <strong className="text-[#1E3A5F]">{order.orderNumber}</strong> est
                  entre les mains de notre équipe. {success}
                </p>

                <div className="mt-8 mx-auto max-w-md rounded-2xl bg-[#FBF7F2] border border-[#B8895A]/20 p-5 text-left">
                  <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#B8895A]">Et maintenant ?</div>
                  <ul className="mt-3 space-y-2.5 text-[13.5px] text-[#1E3A5F]/85">
                    <TimelineItem n="1" text="L'argent reste bloqué chez XaalisPay." />
                    <TimelineItem n="2" text="Notre équipe contacte le vendeur pour avoir sa version." />
                    <TimelineItem n="3" text="Décision rapide : remboursement ou libération des fonds." />
                  </ul>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/" className="lp-btn lp-btn-primary !py-3 !text-[14px] justify-center">
                    Retour à l&apos;accueil
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1E3A5F]/15 bg-white text-[#1E3A5F]/80 font-medium text-[14px] py-3 px-6 hover:border-[#1E3A5F]/30 hover:text-[#1E3A5F] transition-colors"
                  >
                    Contacter le support
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {step !== 3 && (
            <div className="mt-10 text-center text-[13px] text-[#1E3A5F]/60">
              Besoin d&apos;aide ?{" "}
              <Link href="/contact" className="font-semibold text-[#1E3A5F] hover:text-[#B8895A] underline underline-offset-4">
                Contactez le support
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-[#1E3A5F]/8 shadow-[0_2px_30px_-12px_rgba(30,58,95,0.12)] p-6 md:p-8">
      {children}
    </div>
  );
}

function CardHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#B8895A]">{eyebrow}</div>
      <h2 className="mt-2 text-[24px] md:text-[28px] font-semibold text-[#1E3A5F] leading-tight tracking-tight">{title}</h2>
      <p className="mt-2 text-[14.5px] text-[#1E3A5F]/65 leading-relaxed">{description}</p>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <label className="block text-[13px] font-semibold text-[#1E3A5F]/85">
          {label}
          {required && <span className="text-[#B8895A] ml-1">*</span>}
        </label>
        {hint && <span className="text-[11.5px] text-[#1E3A5F]/45">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#1E3A5F]/[0.04] px-3 py-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[#1E3A5F]/50">{label}</div>
      <div className="mt-1 text-[13.5px] font-semibold text-[#1E3A5F] leading-tight">{value}</div>
    </div>
  );
}

function TimelineItem({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid place-items-center h-6 w-6 rounded-full bg-[#B8895A] text-white text-[12px] font-semibold flex-none">{n}</span>
      <span>{text}</span>
    </li>
  );
}

function ReassureCard({ icon, title, text }: { icon: "lock" | "users" | "refund"; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#1E3A5F]/10 p-4">
      <div className="h-9 w-9 rounded-xl bg-[#B8895A]/12 grid place-items-center text-[#B8895A]">
        {icon === "lock" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {icon === "users" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )}
        {icon === "refund" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        )}
      </div>
      <div className="mt-3 text-[14px] font-semibold text-[#1E3A5F]">{title}</div>
      <div className="mt-1 text-[12.5px] text-[#1E3A5F]/65 leading-relaxed">{text}</div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Commande" },
    { n: 2, label: "Détails du litige" },
    { n: 3, label: "Confirmation" },
  ] as const;
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        return (
          <li key={s.n} className="flex items-center gap-2 sm:gap-4 flex-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`grid place-items-center h-8 w-8 rounded-full text-[12px] font-semibold flex-none transition ${
                  done ? "bg-[#B8895A] text-white" : active ? "bg-[#1E3A5F] text-white ring-4 ring-[#1E3A5F]/15" : "bg-[#1E3A5F]/8 text-[#1E3A5F]/45"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span className={`text-[12.5px] font-semibold truncate ${active || done ? "text-[#1E3A5F]" : "text-[#1E3A5F]/40"} hidden sm:inline`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-[#1E3A5F]/10 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#B8895A] transition-all" style={{ width: step > s.n ? "100%" : "0%" }} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FileDrop({
  accept,
  files,
  onAddFiles,
  onRemove,
}: {
  accept: string;
  files: EvidenceMedia[];
  onAddFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          onAddFiles(e.dataTransfer.files);
        }}
        className={`w-full rounded-2xl border-2 border-dashed transition px-6 py-8 text-center ${
          hover ? "border-[#B8895A] bg-[#FBF7F2]" : "border-[#1E3A5F]/15 bg-white hover:border-[#B8895A]/60 hover:bg-[#FBF7F2]/50"
        }`}
      >
        <div className="mx-auto h-11 w-11 rounded-2xl bg-[#1E3A5F]/[0.06] grid place-items-center text-[#1E3A5F]/70">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <div className="mt-3 text-[14px] font-semibold text-[#1E3A5F]">Glissez vos preuves ici</div>
        <div className="mt-1 text-[12.5px] text-[#1E3A5F]/55">ou cliquez pour les sélectionner</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-white border border-[#1E3A5F]/10 px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#B8895A]/12 text-[#B8895A] grid place-items-center flex-none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[#1E3A5F] truncate">{f.name}</div>
                <div className="text-[11.5px] text-[#1E3A5F]/50">{(f.size / 1024 / 1024).toFixed(2)} Mo</div>
              </div>
              <button type="button" onClick={() => onRemove(i)} className="text-[12px] font-semibold text-[#1E3A5F]/55 hover:text-red-600 transition" aria-label="Retirer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
