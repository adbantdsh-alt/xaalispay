"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { DeliveryZone, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { DELIVERY_DEADLINE_HOURS } from "@/lib/delivery-window";
import { uploadProductImageFile, MAX_IMAGE_INPUT_MB } from "@/lib/product-form";
import { useDeliveryZones } from "@/lib/use-delivery-zones";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { ChargebackExplainDialog } from "@/components/seller/ChargebackExplainDialog";
import { copyToClipboard } from "@/lib/share";
import { buildProductPaymentUrl, formatPublicUrl } from "@/lib/site-url";

export interface ProductFormValues {
  name: string;
  price: string;
  /** null = pas encore personnalisé par le vendeur : toutes les zones
   * définies en Paramètres s'appliquent par défaut (voir zonesToPayload). Un
   * tableau (même vide) reflète une sélection explicite. */
  deliveryZoneIds: string[] | null;
  note: string;
  description: string;
  image: string;
}

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  price: "",
  deliveryZoneIds: null,
  note: "",
  description: "",
  image: "",
});

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: String(product.price),
    deliveryZoneIds: (product.deliveryZones || []).map((z) => z.id),
    note: product.note || "",
    description: product.description || "",
    image: product.image || "",
  };
}

/** Résout la sélection du formulaire en ids serveur — null (non personnalisé)
 * vaut "toutes les zones actuellement définies". */
export function zonesToPayload(ids: string[] | null, zones: DeliveryZone[]): number[] {
  const effective = ids ?? zones.map((z) => z.id);
  return effective.map(Number);
}

export function ProductFields({
  form,
  onChange,
  showDescription = true,
}: {
  form: ProductFormValues;
  onChange: (next: ProductFormValues) => void;
  showDescription?: boolean;
}) {
  const [imageError, setImageError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [chargebackOpen, setChargebackOpen] = useState(false);
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const { zones, loading: zonesLoading } = useDeliveryZones();
  const effectiveZoneIds = form.deliveryZoneIds ?? zones.map((z) => z.id);

  const toggleZone = (zoneId: string) => {
    const next = effectiveZoneIds.includes(zoneId)
      ? effectiveZoneIds.filter((id) => id !== zoneId)
      : [...effectiveZoneIds, zoneId];
    onChange({ ...form, deliveryZoneIds: next });
  };

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setImageError("");
    setUploadingImage(true);
    try {
      const url = await uploadProductImageFile(file);
      onChange({ ...form, image: url });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload impossible");
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="product-fields">
      <div className="photo-picker">
        <input
          ref={fileRef}
          id={fileId}
          type="file"
          accept="image/*"
          className="photo-picker-input"
          onChange={(e) => handleImage(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          className="photo-picker-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              <span>Envoi…</span>
            </>
          ) : form.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="" className="photo-picker-preview" />
          ) : (
            <>
              <span className="photo-picker-icon">📷</span>
              <span>Ajouter une photo</span>
            </>
          )}
        </button>
        {!uploadingImage && !form.image && (
          <p className="photo-picker-hint text-muted">JPEG, PNG ou WebP — max {MAX_IMAGE_INPUT_MB} Mo</p>
        )}
        {form.image && (
          <button
            type="button"
            className="btn-ghost btn-compact photo-remove-btn"
            onClick={() => onChange({ ...form, image: "" })}
          >
            Supprimer la photo
          </button>
        )}
        {imageError && <span className="field-error">{imageError}</span>}
      </div>

      <label className="field-block">
        <span className="field-block-label">Nom du produit</span>
        <input
          className="input-field input-compact"
          placeholder="Ex. iPhone 13"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          required
        />
      </label>

      <label className="field-block">
        <span className="field-block-label">Prix (FCFA)</span>
        <input
          className="input-field input-compact"
          type="number"
          placeholder="25000"
          value={form.price}
          onChange={(e) => onChange({ ...form, price: e.target.value })}
          required
          min={1}
        />
      </label>

      <div className="field-block">
        <span className="field-block-label">Zones de livraison</span>

        {zonesLoading ? (
          <p className="text-muted">Chargement…</p>
        ) : zones.length === 0 ? (
          <p className="text-muted">
            Aucune zone de livraison définie.{" "}
            <Link href="/settings/delivery-zones">Configurer mes zones de livraison</Link>
          </p>
        ) : (
          <div className="delivery-zone-list">
            {zones.map((z) => {
              const checked = effectiveZoneIds.includes(z.id);
              return (
                <label key={z.id} className={`delivery-zone-chip ${checked ? "" : "delivery-zone-chip-off"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleZone(z.id)} />
                  <span className="delivery-zone-chip-label">{z.name}</span>
                  <span className="delivery-zone-chip-price">{formatCurrency(z.price)}</span>
                </label>
              );
            })}
          </div>
        )}

        <p className="delivery-policy-notice">
          Si le produit n&apos;est pas livré dans les{" "}
          <strong>{DELIVERY_DEADLINE_HOURS} h après paiement</strong>, remboursement automatique
          au client — compté comme un{" "}
          <button
            type="button"
            className="chargeback-link"
            onClick={() => setChargebackOpen(true)}
          >
            chargeback
          </button>
          .
        </p>
      </div>

      <ChargebackExplainDialog open={chargebackOpen} onClose={() => setChargebackOpen(false)} />

      {showDescription && (
        <label className="field-block">
          <span className="field-block-label">Description (optionnel)</span>
          <textarea
            className="input-field input-compact form-textarea-sm"
            placeholder="Décrivez votre produit…"
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            rows={2}
          />
        </label>
      )}

      <label className="field-block">
        <span className="field-block-label">Note interne (optionnel)</span>
        <textarea
          className="input-field input-compact form-textarea-sm"
          placeholder="Couleur, taille, précisions…"
          value={form.note}
          onChange={(e) => onChange({ ...form, note: e.target.value })}
          rows={2}
        />
      </label>
    </div>
  );
}

export function ProductListItem({
  product,
  onToggle,
  onEdit,
  onDelete,
  deleting = false,
}: {
  product: Product;
  onToggle: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const payUrl = buildProductPaymentUrl(product);
  const [copied, setCopied] = useState(false);

  const handleQuickCopy = async () => {
    const ok = await copyToClipboard(payUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="product-row">
      {product.image ? (
        <ProductImage src={product.image} alt={product.name} className="product-row-img" width={56} height={56} />
      ) : (
        <div className="product-row-img product-row-img-empty">
          <IconPackage size={22} />
        </div>
      )}
      <div className="product-row-body">
        <p className="product-row-name">{product.name}</p>
        <p className="product-row-meta">
          {formatCurrency(product.price)}
          {product.deliveryZones.length > 0 &&
            ` · ${product.deliveryZones.length} zone${product.deliveryZones.length > 1 ? "s" : ""} de livraison`}
        </p>
        {product.description && (
          <p className="product-row-note">{product.description}</p>
        )}
        {product.note && <p className="product-row-note text-muted">{product.note}</p>}
        {product.paymentSlug && (
          <div className="product-row-actions">
            <button
              type="button"
              className="product-link-tap"
              onClick={handleQuickCopy}
              aria-label="Copier le lien de paiement"
            >
              <span className="product-link-tap-url">{formatPublicUrl(payUrl)}</span>
              <span className="product-link-tap-hint">
                {copied ? (
                  <span className="copy-btn-copied">
                    <IconCheck size={14} /> Copié !
                  </span>
                ) : (
                  "Appuyer pour copier"
                )}
              </span>
            </button>
            <button type="button" className="btn-secondary btn-compact" onClick={onEdit}>
              Modifier
            </button>
            {onDelete && (
              <button
                type="button"
                className="btn-ghost btn-compact product-delete-btn"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "…" : "Supprimer"}
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`chip-toggle product-publish-toggle ${product.active ? "chip-toggle-on" : ""}`}
      >
        {product.active ? "Dépublier" : "Publier"}
      </button>
    </article>
  );
}
