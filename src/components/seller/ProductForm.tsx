"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDeliveryHours } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/product-form";

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

export function ProductFields({
  form,
  onChange,
  compact = false,
}: {
  form: ProductFormValues;
  onChange: (next: ProductFormValues) => void;
  compact?: boolean;
}) {
  const [imageError, setImageError] = useState("");

  const handleImage = async (file: File | null) => {
    if (!file) return;
    setImageError("");
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl) {
      setImageError("Image trop lourde (max 450 Ko) ou format invalide");
      return;
    }
    onChange({ ...form, image: dataUrl });
  };

  return (
    <div className={`product-fields ${compact ? "product-fields-compact" : ""}`}>
      <label className="field-label">
        Photo
        <input
          type="file"
          accept="image/*"
          className="field-file"
          onChange={(e) => handleImage(e.target.files?.[0] || null)}
        />
        {form.image ? (
          <img src={form.image} alt="" className="product-thumb" />
        ) : (
          <span className="product-thumb-placeholder">📷 Ajouter une photo</span>
        )}
        {imageError && <span className="field-error">{imageError}</span>}
      </label>

      <input
        className="input-field input-compact"
        placeholder="Nom du produit *"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        required
      />

      <div className="field-row">
        <input
          className="input-field input-compact"
          type="number"
          placeholder="Prix FCFA *"
          value={form.price}
          onChange={(e) => onChange({ ...form, price: e.target.value })}
          required
          min={1}
        />
        <input
          className="input-field input-compact"
          type="number"
          placeholder="Frais livraison"
          value={form.deliveryCost}
          onChange={(e) => onChange({ ...form, deliveryCost: e.target.value })}
          min={0}
        />
      </div>

      <input
        className="input-field input-compact"
        type="number"
        placeholder="Délai livraison (heures) *"
        value={form.deliveryHours}
        onChange={(e) => onChange({ ...form, deliveryHours: e.target.value })}
        required
        min={1}
      />

      <textarea
        className="input-field input-compact form-textarea-sm"
        placeholder="Note (optionnel)"
        value={form.note}
        onChange={(e) => onChange({ ...form, note: e.target.value })}
        rows={2}
      />
    </div>
  );
}

export function ProductListItem({
  product,
  onToggle,
}: {
  product: Product;
  onToggle: () => void;
}) {
  return (
    <article className="product-row">
      {product.image ? (
        <img src={product.image} alt="" className="product-row-img" />
      ) : (
        <div className="product-row-img product-row-img-empty">📦</div>
      )}
      <div className="product-row-body">
        <p className="product-row-name">{product.name}</p>
        <p className="product-row-meta">
          {formatCurrency(product.price)}
          {(product.deliveryCost || 0) > 0 && ` + ${formatCurrency(product.deliveryCost)} livr.`}
          {" · "}
          {formatDeliveryHours(product.deliveryHours)}
        </p>
        {product.note && <p className="product-row-note">{product.note}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`chip-toggle ${product.active ? "chip-toggle-on" : ""}`}
      >
        {product.active ? "Actif" : "Off"}
      </button>
    </article>
  );
}
