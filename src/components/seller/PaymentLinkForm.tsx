"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatCurrency, getOrderTotal } from "@/lib/utils";
import { ProductFields, type ProductFormValues } from "@/components/seller/ProductForm";
import { buildPaymentLinkMessage, buildWhatsAppUrl } from "@/lib/share";
import { PaymentLinkSuccessPanel } from "@/components/seller/PaymentLinkSuccessPanel";
import { CopyButton } from "@/components/ui/CopyButton";
import { IconCheck, IconPackage } from "@/components/ui/AppIcon";
import { ProductImage } from "@/components/ui/ProductImage";
import { buildPaymentLinkUrl, formatPublicUrl } from "@/lib/site-url";

export function PaymentLinkForm({
  products,
  linkMode,
  onLinkModeChange,
  selectedProductId,
  onSelectProduct,
  inlineProduct,
  onInlineProductChange,
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

  const selectedPayUrl = selectedProduct?.paymentSlug
    ? buildPaymentLinkUrl(selectedProduct.paymentSlug)
    : "";

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

  const displayUrl = createdPayUrl || (linkMode === "existing" ? selectedPayUrl : "");

  if (createdPayUrl) {
    return (
      <PaymentLinkSuccessPanel
        payUrl={createdPayUrl}
        productName={createdProductName}
        title="Lien prêt !"
        subtitle={`${createdProductName} — envoyez ce lien à votre client.`}
        onReset={onReset}
        resetLabel="+ Partager un autre produit"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="shop-card link-flow-card form-stack">
      <p className="shop-card-desc text-muted">
        Chaque produit a déjà son lien de paiement. Sélectionnez-le pour le partager.
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
          <p className="shop-section-label">Choisir un produit</p>

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
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="product-pick-img"
                          placeholderClassName="product-pick-img product-pick-img-empty"
                          iconSize={20}
                          width={40}
                          height={40}
                        />
                        <div className="product-pick-body">
                          <p className="product-pick-name">{product.name}</p>
                          <p className="product-pick-price">{formatCurrency(total)}</p>
                          {!product.active && (
                            <span className="product-pick-badge-off">Inactif</span>
                          )}
                        </div>
                        {selected && product.active && (
                          <span className="product-pick-check">
                            <IconCheck size={14} />
                          </span>
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

      {displayUrl && linkMode === "existing" && selectedProduct?.active && (
        <div className="link-product-preview link-product-preview-url">
          <p className="link-success-url">{formatPublicUrl(displayUrl)}</p>
          <div className="share-buttons">
            <CopyButton text={displayUrl} label="Copier le lien" className="btn-secondary btn-compact" />
            <button
              type="button"
              className="btn-whatsapp-full btn-compact"
              onClick={() =>
                window.open(
                  buildWhatsAppUrl(
                    buildPaymentLinkMessage(displayUrl, selectedProduct.name)
                  ),
                  "_blank"
                )
              }
            >
              WhatsApp
            </button>
          </div>
        </div>
      )}

      {linkMode === "new" && (
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="btn-seller-primary btn-compact btn-inline"
        >
          {saving ? "Création…" : "Créer et obtenir le lien"}
        </button>
      )}
    </form>
  );
}
