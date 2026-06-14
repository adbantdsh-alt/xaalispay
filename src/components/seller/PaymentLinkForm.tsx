"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { ProductFields, type ProductFormValues } from "@/components/seller/ProductForm";
import { buildPaymentLinkMessage, buildWhatsAppUrl } from "@/lib/share";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatPublicUrl } from "@/lib/site-url";

export function PaymentLinkForm({
  products,
  linkMode,
  onLinkModeChange,
  selectedProductId,
  onSelectProduct,
  inlineProduct,
  onInlineProductChange,
  clientFirstName,
  clientLastName,
  clientPhone,
  clientNote,
  onClientFirstName,
  onClientLastName,
  onClientPhone,
  onClientNote,
  onSubmit,
  saving,
  createdPayUrl,
  createdProductName,
  onReset,
  onActivateProduct,
}: {
  products: Product[];
  linkMode: "existing" | "new";
  onLinkModeChange: (m: "existing" | "new") => void;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  inlineProduct: ProductFormValues;
  onInlineProductChange: (v: ProductFormValues) => void;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientNote: string;
  onClientFirstName: (v: string) => void;
  onClientLastName: (v: string) => void;
  onClientPhone: (v: string) => void;
  onClientNote: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  createdPayUrl: string;
  createdProductName: string;
  onReset: () => void;
  onActivateProduct?: (product: Product) => void;
}) {
  const [search, setSearch] = useState("");

  const activeProducts = products.filter((p) => p.active);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = linkMode === "existing" ? products : [];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.note?.toLowerCase().includes(q) ||
        String(p.price).includes(q)
    );
  }, [products, search, linkMode]);

  const canSubmit =
    linkMode === "new"
      ? !!inlineProduct.name && !!inlineProduct.price
      : activeProducts.length > 0 && !!selectedProductId && selectedProduct?.active;

  if (createdPayUrl) {
    return (
      <div className="link-success-panel">
        <div className="link-success-icon">✓</div>
        <h2 className="link-success-title">Lien prêt !</h2>
        <p className="link-success-desc text-muted">
          {createdProductName} — envoyez ce lien à votre client.
        </p>

        <div className="link-success-url-box">
          <p className="link-success-url">{formatPublicUrl(createdPayUrl)}</p>
        </div>

        <button
          type="button"
          className="btn-whatsapp-full"
          onClick={() =>
            window.open(
              buildWhatsAppUrl(
                buildPaymentLinkMessage(createdPayUrl, createdProductName || "votre commande")
              ),
              "_blank"
            )
          }
        >
          Envoyer sur WhatsApp
        </button>

        <CopyButton
          text={createdPayUrl}
          label="Copier le lien"
          className="btn-secondary btn-compact btn-inline"
        />

        <button type="button" onClick={onReset} className="btn-ghost btn-inline link-success-new">
          + Créer un autre lien
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="shop-card link-flow-card form-stack">
      <div className="link-flow-steps">
        <span className="link-flow-step link-flow-step-active">① Produit</span>
        <span className="link-flow-step link-flow-step-active">② Client</span>
        <span className="link-flow-step">③ Partager</span>
      </div>

      <p className="shop-card-desc text-muted">
        Tout en un : choisissez ou créez le produit, ajoutez le client, générez le lien.
      </p>

      <div className="link-mode-tabs">
        <button
          type="button"
          className={`link-mode-tab ${linkMode === "existing" ? "link-mode-tab-active" : ""}`}
          onClick={() => onLinkModeChange("existing")}
        >
          Mes produits
        </button>
        <button
          type="button"
          className={`link-mode-tab ${linkMode === "new" ? "link-mode-tab-active" : ""}`}
          onClick={() => onLinkModeChange("new")}
        >
          + Nouveau
        </button>
      </div>

      {linkMode === "existing" ? (
        <section className="link-flow-section">
          <p className="shop-section-label">Rechercher un produit</p>

          {products.length === 0 ? (
            <div className="link-empty-hint">
              <p className="text-muted">Vous n&apos;avez pas encore de produit.</p>
              <button
                type="button"
                className="shop-inline-link-btn"
                onClick={() => onLinkModeChange("new")}
              >
                Créer un produit maintenant →
              </button>
            </div>
          ) : (
            <>
              <input
                className="input-field input-compact product-picker-search"
                placeholder="Nom, prix, note…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="product-picker-list">
                {filteredProducts.length === 0 ? (
                  <p className="text-muted shop-empty">Aucun résultat pour « {search} »</p>
                ) : (
                  filteredProducts.map((product) => {
                    const selected = product.id === selectedProductId;
                    const total = getOrderTotal({
                      productPrice: product.price,
                      deliveryCost: product.deliveryCost || 0,
                    });

                    return (
                      <div
                        key={product.id}
                        role="button"
                        tabIndex={product.active ? 0 : -1}
                        className={`product-pick-card ${selected ? "product-pick-card-selected" : ""} ${!product.active ? "product-pick-card-disabled" : ""}`}
                        onClick={() => product.active && onSelectProduct(product.id)}
                        onKeyDown={(e) => {
                          if (product.active && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onSelectProduct(product.id);
                          }
                        }}
                      >
                        {product.image ? (
                          <img src={product.image} alt="" className="product-pick-img" />
                        ) : (
                          <div className="product-pick-img product-pick-img-empty">📦</div>
                        )}
                        <div className="product-pick-body">
                          <p className="product-pick-name">{product.name}</p>
                          <p className="product-pick-price">{formatCurrency(total)}</p>
                          {!product.active && (
                            <span className="product-pick-badge-off">Inactif</span>
                          )}
                        </div>
                        {selected && product.active && (
                          <span className="product-pick-check">✓</span>
                        )}
                        {!product.active && onActivateProduct && (
                          <button
                            type="button"
                            className="chip-toggle chip-toggle-on"
                            onClick={(e) => {
                              e.stopPropagation();
                              onActivateProduct(product);
                            }}
                          >
                            Activer
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {activeProducts.length === 0 && products.length > 0 && (
                <p className="link-empty-hint text-muted">
                  Aucun produit actif. Activez-en un ou créez-en un nouveau.
                </p>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="link-flow-section">
          <p className="shop-section-label">Créer le produit</p>
          <ProductFields form={inlineProduct} onChange={onInlineProductChange} />
        </section>
      )}

      {selectedProduct && linkMode === "existing" && selectedProduct.active && (
        <div className="link-product-preview">
          <span>Sélectionné :</span> <strong>{selectedProduct.name}</strong>
          {" — "}
          {formatCurrency(
            getOrderTotal({
              productPrice: selectedProduct.price,
              deliveryCost: selectedProduct.deliveryCost || 0,
            })
          )}
        </div>
      )}

      <section className="link-flow-section link-flow-client">
        <p className="shop-section-label">Infos client (optionnel)</p>
        <p className="link-client-hint text-subtle">
          Pré-remplit la fiche de paiement pour votre client.
        </p>
        <div className="field-row">
          <input
            className="input-field input-compact"
            placeholder="Prénom"
            value={clientFirstName}
            onChange={(e) => onClientFirstName(e.target.value)}
          />
          <input
            className="input-field input-compact"
            placeholder="Nom"
            value={clientLastName}
            onChange={(e) => onClientLastName(e.target.value)}
          />
        </div>
        <input
          className="input-field input-compact"
          placeholder="Téléphone (+221…)"
          value={clientPhone}
          onChange={(e) => onClientPhone(e.target.value)}
          inputMode="tel"
        />
        <textarea
          className="input-field input-compact form-textarea-sm"
          placeholder="Note pour le client (ex. couleur, délai…)"
          value={clientNote}
          onChange={(e) => onClientNote(e.target.value)}
          rows={2}
        />
      </section>

      <button
        type="submit"
        disabled={saving || !canSubmit}
        className="btn-seller-primary btn-compact btn-inline"
      >
        {saving ? "Génération…" : "Générer le lien de paiement"}
      </button>
    </form>
  );
}
