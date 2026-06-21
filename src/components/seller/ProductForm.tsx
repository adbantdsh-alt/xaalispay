"use client";

import { useId, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import type { DeliveryZoneInputPayload } from "@/lib/api-adapters";
import { formatCurrency } from "@/lib/utils";
import { DELIVERY_DEADLINE_HOURS } from "@/lib/delivery-window";
import { uploadProductImageFile, MAX_IMAGE_INPUT_MB } from "@/lib/product-form";
import { useGeography } from "@/lib/use-geography";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { ChargebackExplainDialog } from "@/components/seller/ChargebackExplainDialog";
import { copyToClipboard } from "@/lib/share";
import { buildProductPaymentUrl, formatPublicUrl } from "@/lib/site-url";

export interface DeliveryZoneFormValue {
  /** Identifiant client-side (pas l'id serveur — la sauvegarde remplace
   * toutes les zones en une fois, voir toProductPayload). */
  tempId: string;
  level: "region" | "department" | "town";
  regionId?: string;
  departmentId?: string;
  townId?: string;
  label: string;
  price: string;
}

export interface ProductFormValues {
  name: string;
  price: string;
  deliveryZones: DeliveryZoneFormValue[];
  note: string;
  description: string;
  image: string;
}

export const emptyProductForm = (): ProductFormValues => ({
  name: "",
  price: "",
  deliveryZones: [],
  note: "",
  description: "",
  image: "",
});

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    price: String(product.price),
    deliveryZones: (product.deliveryZones || []).map((z) => ({
      tempId: z.id,
      level: z.level,
      regionId: z.regionId || "",
      departmentId: z.departmentId,
      townId: z.townId,
      label: z.label,
      price: String(z.price),
    })),
    note: product.note || "",
    description: product.description || "",
    image: product.image || "",
  };
}

/** Forme minimale attendue par le backend (delivery_zones_input) — un seul
 * niveau renseigné par zone, jamais l'id de la zone elle-même (la sauvegarde
 * remplace toutes les zones existantes, voir ProductSerializer._sync_zones). */
export function zonesToPayload(zones: DeliveryZoneFormValue[]): DeliveryZoneInputPayload[] {
  return zones.map((z) => {
    const price = Number(z.price) || 0;
    if (z.level === "town" && z.townId) return { town: Number(z.townId), price };
    if (z.level === "department" && z.departmentId) return { department: Number(z.departmentId), price };
    return { region: Number(z.regionId), price };
  });
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

  const { regions } = useGeography();
  const [pickerRegion, setPickerRegion] = useState("");
  const [pickerDepartment, setPickerDepartment] = useState("");
  const [pickerTown, setPickerTown] = useState("");
  const [pickerPrice, setPickerPrice] = useState("");
  const [zoneError, setZoneError] = useState("");

  const selectedRegion = regions.find((r) => r.id === pickerRegion);
  const selectedDepartment = selectedRegion?.departments.find((d) => d.id === pickerDepartment);

  const resetPicker = () => {
    setPickerRegion("");
    setPickerDepartment("");
    setPickerTown("");
    setPickerPrice("");
  };

  const addZone = () => {
    setZoneError("");
    const price = Number(pickerPrice);
    if (!pickerRegion || !price || price < 0) {
      setZoneError("Choisissez une zone et un prix valide.");
      return;
    }

    let zone: DeliveryZoneFormValue;
    if (pickerTown && selectedDepartment) {
      zone = {
        tempId: `town-${selectedDepartment.town.id}`,
        level: "town",
        townId: selectedDepartment.town.id,
        label: `${selectedDepartment.town.name} (${selectedRegion!.name})`,
        price: pickerPrice,
      };
    } else if (pickerDepartment && selectedDepartment) {
      zone = {
        tempId: `department-${selectedDepartment.id}`,
        level: "department",
        departmentId: selectedDepartment.id,
        label: `${selectedDepartment.name} (${selectedRegion!.name})`,
        price: pickerPrice,
      };
    } else {
      zone = {
        tempId: `region-${pickerRegion}`,
        level: "region",
        regionId: pickerRegion,
        label: selectedRegion!.name,
        price: pickerPrice,
      };
    }

    if (form.deliveryZones.some((z) => z.tempId === zone.tempId)) {
      setZoneError("Cette zone est déjà configurée pour ce produit.");
      return;
    }

    onChange({ ...form, deliveryZones: [...form.deliveryZones, zone] });
    resetPicker();
  };

  const removeZone = (tempId: string) => {
    onChange({ ...form, deliveryZones: form.deliveryZones.filter((z) => z.tempId !== tempId) });
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

        <div className="delivery-zone-list">
          {form.deliveryZones.length === 0 ? (
            <p className="text-muted">Aucune zone configurée — ajoutez-en une ci-dessous.</p>
          ) : (
            form.deliveryZones.map((z) => (
              <div key={z.tempId} className="delivery-zone-chip">
                <span className="delivery-zone-chip-label">{z.label}</span>
                <span className="delivery-zone-chip-price">{formatCurrency(Number(z.price) || 0)}</span>
                <button
                  type="button"
                  className="delivery-zone-chip-remove"
                  onClick={() => removeZone(z.tempId)}
                  aria-label={`Retirer la zone ${z.label}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="delivery-zone-picker">
          <select
            className="input-field input-compact"
            value={pickerRegion}
            onChange={(e) => {
              setPickerRegion(e.target.value);
              setPickerDepartment("");
              setPickerTown("");
            }}
          >
            <option value="">Région…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {selectedRegion && (
            <select
              className="input-field input-compact"
              value={pickerDepartment}
              onChange={(e) => {
                setPickerDepartment(e.target.value);
                setPickerTown("");
              }}
            >
              <option value="">Toute la région ({selectedRegion.name})</option>
              {selectedRegion.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {selectedDepartment && (
            <select
              className="input-field input-compact"
              value={pickerTown}
              onChange={(e) => setPickerTown(e.target.value)}
            >
              <option value="">Tout le département ({selectedDepartment.name})</option>
              <option value={selectedDepartment.town.id}>{selectedDepartment.town.name}</option>
            </select>
          )}

          <input
            className="input-field input-compact"
            type="number"
            placeholder="Prix livraison (FCFA)"
            value={pickerPrice}
            onChange={(e) => setPickerPrice(e.target.value)}
            min={0}
          />

          <button type="button" className="btn-secondary btn-compact" onClick={addZone} disabled={!pickerRegion}>
            Ajouter cette zone
          </button>
        </div>
        {zoneError && <span className="field-error">{zoneError}</span>}

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
