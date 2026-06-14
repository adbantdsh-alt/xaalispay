"use client";

import { Suspense, useEffect, useState } from "react";
import type { Product, Profile } from "@/lib/types";
import { slugifyUsername, isValidUsername } from "@/lib/utils";
import {
  ShopTabs,
  useShopTab,
  type ShopTab,
} from "@/components/seller/ShopTabs";
import {
  ProductFields,
  ProductListItem,
  emptyProductForm,
  type ProductFormValues,
} from "@/components/seller/ProductForm";
import {
  buildPaymentLinkMessage,
  buildWhatsAppUrl,
} from "@/lib/share";
import { CopyButton } from "@/components/ui/CopyButton";

function CreatePageContent() {
  const tab = useShopTab();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [productForm, setProductForm] = useState<ProductFormValues>(emptyProductForm());
  const [showProductForm, setShowProductForm] = useState(false);

  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [inlineProduct, setInlineProduct] = useState<ProductFormValues>(emptyProductForm());
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [createdPayUrl, setCreatedPayUrl] = useState("");
  const [createdProductName, setCreatedProductName] = useState("");

  const [pseudo, setPseudo] = useState("");
  const [pseudoSaving, setPseudoSaving] = useState(false);

  const load = async () => {
    const [dashRes, prodRes] = await Promise.all([
      fetch("/api/dashboard"),
      fetch("/api/products"),
    ]);
    if (dashRes.status === 401) {
      window.location.href = "/auth";
      return;
    }
    if (dashRes.ok) {
      const dash = await dashRes.json();
      setProfile(dash.profile);
      setPseudo(dash.profile.username);
    }
    if (prodRes.ok) {
      const data = await prodRes.json();
      const list = data.products || [];
      setProducts(list);
      if (!selectedProductId && list.length > 0) {
        setSelectedProductId(list.find((p: Product) => p.active)?.id || list[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setError("");
    setSuccess("");
    setCreatedPayUrl("");
    if (tab === "products") setShowProductForm(true);
  }, [tab]);

  const shopUrl =
    typeof window !== "undefined" && profile
      ? `${window.location.origin}/${profile.username}`
      : "";

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSaving(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        deliveryCost: Number(productForm.deliveryCost) || 0,
        deliveryHours: Number(productForm.deliveryHours),
        note: productForm.note,
        image: productForm.image,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }

    setProductForm(emptyProductForm());
    setSuccess("Produit créé");
    load();
  };

  const toggleActive = async (product: Product) => {
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    });
    load();
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSaving(true);

    const body: Record<string, unknown> = {
      clientFirstName: clientFirstName.trim(),
      clientLastName: clientLastName.trim(),
      clientPhone: clientPhone.trim(),
      clientNote: clientNote.trim(),
    };

    if (linkMode === "existing") {
      if (!selectedProductId) {
        setSaving(false);
        setError("Sélectionnez un produit");
        return;
      }
      body.productId = selectedProductId;
    } else {
      body.product = {
        name: inlineProduct.name,
        price: Number(inlineProduct.price),
        deliveryCost: Number(inlineProduct.deliveryCost) || 0,
        deliveryHours: Number(inlineProduct.deliveryHours),
        note: inlineProduct.note,
        image: inlineProduct.image,
        description: inlineProduct.description,
      };
    }

    const res = await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }

    setCreatedPayUrl(data.order.payUrl);
    setCreatedProductName(data.order.productName);
    setSuccess("Lien de paiement créé");
    load();
  };

  const handlePseudoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const clean = slugifyUsername(pseudo);
    if (!isValidUsername(clean)) {
      setError("Pseudo invalide (3-20 car., lettres/chiffres/_)");
      return;
    }
    setPseudoSaving(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: clean }),
    });
    const data = await res.json();
    setPseudoSaving(false);
    if (!res.ok) {
      setError(data.error || "Modification impossible");
      return;
    }
    setProfile(data.profile);
    setPseudo(data.profile.username);
    setSuccess("Pseudo mis à jour");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="seller-dashboard shop-page">
      <header className="shop-page-head">
        <div>
          <h1 className="shop-page-title">Boutique</h1>
          {profile && (
            <p className="shop-page-sub text-muted">@{profile.username}</p>
          )}
        </div>
        {shopUrl && (
          <p className="shop-page-url text-subtle">{shopUrl.replace(/^https?:\/\//, "")}</p>
        )}
      </header>

      <ShopTabs active={tab} />

      {error && <p className="alert-danger">{error}</p>}
      {success && <p className="toast-success" role="status">{success}</p>}

      {tab === "products" && (
        <ProductsTab
          products={products}
          showForm={showProductForm}
          onToggleForm={() => setShowProductForm((v) => !v)}
          form={productForm}
          onFormChange={setProductForm}
          onSubmit={handleCreateProduct}
          saving={saving}
          onToggleProduct={toggleActive}
        />
      )}

      {tab === "link" && (
        <PaymentLinkTab
          products={products.filter((p) => p.active)}
          linkMode={linkMode}
          onLinkModeChange={setLinkMode}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          inlineProduct={inlineProduct}
          onInlineProductChange={setInlineProduct}
          clientFirstName={clientFirstName}
          clientLastName={clientLastName}
          clientPhone={clientPhone}
          clientNote={clientNote}
          onClientFirstName={setClientFirstName}
          onClientLastName={setClientLastName}
          onClientPhone={setClientPhone}
          onClientNote={setClientNote}
          onSubmit={handleCreatePaymentLink}
          saving={saving}
          createdPayUrl={createdPayUrl}
          createdProductName={createdProductName}
        />
      )}

      {tab === "pseudo" && profile && (
        <PseudoTab
          pseudo={pseudo}
          onPseudoChange={setPseudo}
          onSubmit={handlePseudoSave}
          saving={pseudoSaving}
          lastChanged={profile.usernameChangedAt}
          current={profile.username}
        />
      )}
    </div>
  );
}

function ProductsTab({
  products,
  showForm,
  onToggleForm,
  form,
  onFormChange,
  onSubmit,
  saving,
  onToggleProduct,
}: {
  products: Product[];
  showForm: boolean;
  onToggleForm: () => void;
  form: ProductFormValues;
  onFormChange: (v: ProductFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  onToggleProduct: (p: Product) => void;
}) {
  return (
    <>
      {showForm ? (
        <form onSubmit={onSubmit} className="shop-card form-stack">
          <p className="shop-card-title">Nouveau produit</p>
          <ProductFields form={form} onChange={onFormChange} compact />
          <div className="shop-card-actions">
            <button type="submit" disabled={saving} className="btn-seller-primary btn-compact">
              {saving ? "…" : "Enregistrer"}
            </button>
            <button type="button" onClick={onToggleForm} className="btn-ghost btn-compact">
              Masquer
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={onToggleForm} className="btn-seller-primary btn-compact btn-inline">
          + Nouveau produit
        </button>
      )}

      <section className="shop-section">
        <p className="shop-section-label">Mes produits ({products.length})</p>
        {products.length === 0 ? (
          <p className="text-muted shop-empty">Créez un produit pour recevoir des paiements sécurisés.</p>
        ) : (
          <div className="product-list">
            {products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onToggle={() => onToggleProduct(product)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PaymentLinkTab({
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
}) {
  const activeProducts = products;

  return (
    <form onSubmit={onSubmit} className="shop-card form-stack">
      <p className="shop-card-title">Lien de paiement sécurisé</p>
      <p className="shop-card-desc text-muted">
        Envoyez ce lien à votre client — paiement protégé jusqu&apos;à livraison.
      </p>

      <div className="link-mode-tabs">
        <button
          type="button"
          className={`link-mode-tab ${linkMode === "existing" ? "link-mode-tab-active" : ""}`}
          onClick={() => onLinkModeChange("existing")}
        >
          Produit existant
        </button>
        <button
          type="button"
          className={`link-mode-tab ${linkMode === "new" ? "link-mode-tab-active" : ""}`}
          onClick={() => onLinkModeChange("new")}
        >
          Nouveau produit
        </button>
      </div>

      {linkMode === "existing" ? (
        activeProducts.length === 0 ? (
          <p className="text-muted">Aucun produit actif — créez-en un ou utilisez « Nouveau produit ».</p>
        ) : (
          <select
            className="input-field input-compact"
            value={selectedProductId}
            onChange={(e) => onSelectProduct(e.target.value)}
          >
            {activeProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )
      ) : (
        <ProductFields form={inlineProduct} onChange={onInlineProductChange} compact />
      )}

      <p className="shop-section-label" style={{ marginTop: "0.5rem" }}>Client (optionnel)</p>
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
        placeholder="Téléphone"
        value={clientPhone}
        onChange={(e) => onClientPhone(e.target.value)}
        inputMode="tel"
      />
      <textarea
        className="input-field input-compact form-textarea-sm"
        placeholder="Note pour le client (optionnel)"
        value={clientNote}
        onChange={(e) => onClientNote(e.target.value)}
        rows={2}
      />

      <button
        type="submit"
        disabled={saving || (linkMode === "existing" && activeProducts.length === 0)}
        className="btn-seller-primary btn-compact"
      >
        {saving ? "Création…" : "Générer le lien"}
      </button>

      {createdPayUrl && (
        <div className="pay-link-result">
          <p className="shop-section-label">Lien généré</p>
          <p className="pay-link-url">{createdPayUrl}</p>
          <div className="pay-link-actions">
            <CopyButton text={createdPayUrl} label="Copier" />
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() =>
                window.open(
                  buildWhatsAppUrl(
                    buildPaymentLinkMessage(
                      createdPayUrl,
                      createdProductName || "votre commande"
                    )
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
    </form>
  );
}

function PseudoTab({
  pseudo,
  onPseudoChange,
  onSubmit,
  saving,
  lastChanged,
  current,
}: {
  pseudo: string;
  onPseudoChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  lastChanged?: string;
  current: string;
}) {
  const nextChangeHint = lastChanged
    ? "Dernière modification enregistrée — 1 changement max. par mois."
    : "Vous pouvez modifier votre pseudo une fois par mois.";

  return (
    <form onSubmit={onSubmit} className="shop-card form-stack">
      <p className="shop-card-title">Pseudo boutique</p>
      <p className="shop-card-desc text-muted">
        Votre lien : <strong>xaalispay/{current}</strong>
      </p>
      <p className="text-subtle" style={{ fontSize: "0.8125rem" }}>{nextChangeHint}</p>

      <div className="pseudo-input-row">
        <span className="pseudo-prefix">@</span>
        <input
          className="input-field input-compact"
          value={pseudo}
          onChange={(e) => onPseudoChange(slugifyUsername(e.target.value))}
          maxLength={20}
          placeholder="mon_boutique"
        />
      </div>

      <button type="submit" disabled={saving || pseudo === current} className="btn-seller-primary btn-compact">
        {saving ? "…" : "Enregistrer le pseudo"}
      </button>
    </form>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50dvh] items-center justify-center"><div className="spinner" /></div>}>
      <CreatePageContent />
    </Suspense>
  );
}
