"use client";

import { useId, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDeliveryHours } from "@/lib/utils";
import { uploadProductImageFile, MAX_IMAGE_INPUT_MB } from "@/lib/product-form";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { copyToClipboard } from "@/lib/share";
import { buildProductPaymentUrl, formatPublicUrl } from "@/lib/site-url";

export interface ProductFormValues {
  name: string;
  price: string;
  deliveryCost: string;
  deliveryHours: string;
  note: string;
  description: string;
  image: string;
}

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  price: "",
  deliveryCost: "0",
  deliveryHours: "48",
  note: "",
  description: "",
  image: "",
});

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: String(product.price),
    deliveryCost: String(product.deliveryCost || 0),
    deliveryHours: String(product.deliveryHours),
    note: product.note || "",
    description: product.description || "",
    image: product.image || "",
  };
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
  const fileId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

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
            <ProductImage src={form.image} alt="" className="photo-picker-preview" />
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

      <div className="field-row">
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
        <label className="field-block">
          <span className="field-block-label">Frais livraison</span>
          <input
            className="input-field input-compact"
            type="number"
            placeholder="0"
            value={form.deliveryCost}
            onChange={(e) => onChange({ ...form, deliveryCost: e.target.value })}
            min={0}
          />
        </label>
      </div>

      <label className="field-block">
        <span className="field-block-label">Délai livraison (heures)</span>
        <input
          className="input-field input-compact"
          type="number"
          placeholder="48"
          value={form.deliveryHours}
          onChange={(e) => onChange({ ...form, deliveryHours: e.target.value })}
          required
          min={1}
        />
      </label>

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
}: {
  product: Product;
  onToggle: () => void;
  onEdit: () => void;
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
        <ProductImage src={product.image} alt={product.name} className="product-row-img" />
      ) : (
        <div className="product-row-img product-row-img-empty">
          <IconPackage size={22} />
        </div>
      )}
      <div className="product-row-body">
        <p className="product-row-name">{product.name}</p>
        <p className="product-row-meta">
          {formatCurrency(product.price)}
          {(product.deliveryCost || 0) > 0 && ` + ${formatCurrency(product.deliveryCost)} livr.`}
          {" · "}
          {formatDeliveryHours(product.deliveryHours)}
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
