"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import { slugifyUsername, isValidUsername } from "@/lib/utils";
import {
  ShopBackBar,
  useShopView,
} from "@/components/seller/ShopHub";
import { ShopHomeToolbar } from "@/components/seller/ShopHomeToolbar";
import {
  ProductFields,
  ProductListItem,
  emptyProductForm,
  productToFormValues,
  type ProductFormValues,
} from "@/components/seller/ProductForm";
import { buildShopUrl, buildProductPaymentUrl, formatPublicUrl } from "@/lib/site-url";
import { PaymentLinkForm } from "@/components/seller/PaymentLinkForm";
import { PaymentLinkSuccessPanel } from "@/components/seller/PaymentLinkSuccessPanel";
import { CopyButton } from "@/components/ui/CopyButton";
import { useSellerData } from "@/components/seller/SellerDataProvider";

function CreatePageContent() {
  const view = useShopView();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams.get("id");
  const { data: sellerData, refresh: refreshSeller } = useSellerData();
  const profile = sellerData?.profile ?? null;
  const canCreateProducts = sellerData?.canCreateProducts !== false;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [productForm, setProductForm] = useState<ProductFormValues>(emptyProductForm());
  const [linkMode, setLinkMode] = useState<"existing" | "new">("existing");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [inlineProduct, setInlineProduct] = useState<ProductFormValues>(emptyProductForm());
  const [createdPayUrl, setCreatedPayUrl] = useState("");
  const [createdProductName, setCreatedProductName] = useState("");
  const [createdProductId, setCreatedProductId] = useState("");
  const [createdProductImage, setCreatedProductImage] = useState("");

  const [pseudo, setPseudo] = useState("");
  const [pseudoSaving, setPseudoSaving] = useState(false);
  const [editForm, setEditForm] = useState<ProductFormValues>(emptyProductForm());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSaved, setEditSaved] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const loadProducts = async () => {
    const prodRes = await fetch("/api/products");
    if (prodRes.ok) {
      const data = await prodRes.json();
      const list = data.products || [];
      setProducts(list);
      const firstActive = list.find((p: Product) => p.active);
      if (!selectedProductId && list.length > 0) {
        setSelectedProductId(firstActive?.id || list[0].id);
      }
      if (!firstActive && list.length === 0) {
        setLinkMode("new");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (profile) setPseudo(profile.username);
  }, [profile?.username]);

  useEffect(() => {
    if (view !== "link") setCreatedPayUrl("");
    if (view !== "edit") setEditSaved(false);
  }, [view]);

  useEffect(() => {
    if (view !== "edit" || !editProductId) {
      setEditingProduct(null);
      setEditLoading(false);
      return;
    }

    // Toujours charger le produit complet (avec image) depuis l'API
    // La liste /api/products strip les images pour alléger les réponses
    let cancelled = false;
    setEditLoading(true);
    fetch(`/api/products?id=${encodeURIComponent(editProductId)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setEditingProduct(data.product);
          setEditForm(productToFormValues(data.product));
        } else {
          // Fallback sur la liste si l'API échoue
          const fromList = products.find((p) => p.id === editProductId);
          if (fromList) {
            setEditingProduct(fromList);
            setEditForm(productToFormValues(fromList));
          } else {
            setEditingProduct(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fromList = products.find((p) => p.id === editProductId);
          if (fromList) {
            setEditingProduct(fromList);
            setEditForm(productToFormValues(fromList));
          }
          setEditingProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setEditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, editProductId]);

  const shopUrl = profile ? buildShopUrl(profile.username) : "";

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.note?.toLowerCase().includes(q) ||
        String(p.price).includes(q) ||
        p.paymentSlug?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

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
      setError(
        data.code === "EMAIL_NOT_VERIFIED"
          ? "Confirmez votre email pour créer des produits (lien dans votre boîte mail)."
          : data.error || "Erreur"
      );
      return;
    }

    const savedImage = data.product?.image || productForm.image;
    setProductForm(emptyProductForm());
    setCreatedPayUrl(data.payUrl || buildProductPaymentUrl(data.product));
    setCreatedProductName(data.product.name);
    setCreatedProductId(data.product.id || "");
    setCreatedProductImage(savedImage);
    setSuccess("Produit créé — lien de paiement prêt");
    loadProducts();
  };

  const resetLinkForm = () => {
    setCreatedPayUrl("");
    setCreatedProductName("");
    setInlineProduct(emptyProductForm());
    setError("");
    setSuccess("");
  };

  const toggleActive = async (product: Product) => {
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    });
    loadProducts();
  };

  const activateProductForLink = async (product: Product) => {
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: true }),
    });
    setSelectedProductId(product.id);
    loadProducts();
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSaving(true);

    const body: Record<string, unknown> = {};

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
    setSuccess("Lien prêt à envoyer");
    loadProducts();
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    resetMessages();

    if (!editForm.name.trim() || Number(editForm.price) <= 0 || Number(editForm.deliveryHours) <= 0) {
      setError("Nom, prix et délai livraison requis");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingProduct.id,
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        deliveryCost: Number(editForm.deliveryCost) || 0,
        deliveryHours: Number(editForm.deliveryHours),
        note: editForm.note,
        image: editForm.image,
        // Signal explicite de suppression d'image (bouton "Supprimer la photo")
        clearImage: editForm.image === "" && editingProduct.image !== "",
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Modification impossible");
      return;
    }

    const updated = data.product as Product;
    setEditingProduct(updated);
    setEditSaved(true);
    setSuccess("Produit mis à jour");
    loadProducts();
  };

  const handlePseudoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const clean = slugifyUsername(pseudo);
    if (!isValidUsername(clean)) {
      setError("XaalisTag invalide (3-20 car., lettres/chiffres/_)");
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
    setPseudo(data.profile.username);
    setSuccess("XaalisTag mis à jour");
    await refreshSeller({ silent: true });
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
      {view === "home" && (
        <>
          <header className="shop-page-head shop-page-head-compact">
            <div className="shop-page-head-main">
              <h1 className="shop-page-title">Mes produits</h1>
              {profile && (
                <p className="shop-page-sub text-muted">
                  @{profile.username}
                  <span className="shop-page-dot"> · </span>
                  <Link href="/create?tab=tag" className="shop-pseudo-inline">
                    Mon XaalisTag
                  </Link>
                </p>
              )}
            </div>
          </header>

          <ShopHomeToolbar
            shopUrl={shopUrl}
            username={profile?.username || ""}
            search={productSearch}
            onSearchChange={setProductSearch}
            productCount={products.length}
            filteredCount={filteredProducts.length}
          />

          {error && <p className="alert-danger">{error}</p>}
          {success && <p className="toast-success" role="status">{success}</p>}

          <section className="shop-section shop-section-list">
            {products.length === 0 ? (
              <div className="shop-empty-card">
                <p className="shop-empty-title">Aucun produit</p>
                <p className="text-muted shop-empty-desc">
                  Créez votre premier produit pour obtenir un lien de paiement.
                </p>
                <Link href="/create?tab=product" className="btn-seller-primary btn-compact">
                  + Créer un produit
                </Link>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-muted shop-empty">
                Aucun produit pour « {productSearch} ».
              </p>
            ) : (
              <div className="product-list">
                {filteredProducts.map((product) => (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    onToggle={() => toggleActive(product)}
                    onEdit={() => router.push(`/create?tab=edit&id=${product.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {view === "product" && (
        <>
          <ShopBackBar title="Nouveau produit" />
          {error && <p className="alert-danger">{error}</p>}
          {success && !createdPayUrl && <p className="toast-success" role="status">{success}</p>}
          {!canCreateProducts && (
            <p className="alert-danger" role="status">
              Email non vérifié — connectez-vous et cliquez le lien reçu par mail pour publier des produits.
              {" "}
              <Link href="/auth" className="shop-inline-link-btn">Renvoyer le lien</Link>
            </p>
          )}
          {createdPayUrl ? (
            <PaymentLinkSuccessPanel
              payUrl={createdPayUrl}
              productName={createdProductName}
              productImage={createdProductImage}
              productId={createdProductId}
              onReset={() => {
                setCreatedPayUrl("");
                setCreatedProductName("");
                setCreatedProductId("");
                setCreatedProductImage("");
                setSuccess("");
              }}
            />
          ) : (
            <form onSubmit={handleCreateProduct} className="shop-card form-stack">
              <p className="shop-card-desc text-muted">
                Chaque produit reçoit automatiquement son lien de paiement XaalisPay.
              </p>
              <ProductFields form={productForm} onChange={setProductForm} />
              <button type="submit" disabled={saving || !canCreateProducts} className="btn-seller-primary btn-compact btn-inline">
                {saving ? "Enregistrement…" : "Créer le produit"}
              </button>
            </form>
          )}
        </>
      )}

      {view === "link" && (
        <>
          <ShopBackBar title="Lien de paiement" />
          {error && <p className="alert-danger">{error}</p>}
          {success && <p className="toast-success" role="status">{success}</p>}
          <PaymentLinkForm
            products={products}
            linkMode={linkMode}
            onLinkModeChange={setLinkMode}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
            inlineProduct={inlineProduct}
            onInlineProductChange={setInlineProduct}
            onSubmit={handleCreatePaymentLink}
            saving={saving}
            createdPayUrl={createdPayUrl}
            createdProductName={createdProductName}
            onReset={resetLinkForm}
            onActivateProduct={activateProductForLink}
          />
        </>
      )}

      {view === "edit" && (
        <>
          <ShopBackBar title="Modifier le produit" />
          {editLoading && (
            <div className="flex min-h-[30dvh] items-center justify-center">
              <div className="spinner" />
            </div>
          )}
          {!editLoading && !editingProduct && (
            <section className="seller-tip-card">
              <p className="seller-tip-title">Produit introuvable</p>
              <p className="seller-tip-desc text-muted">
                Ce produit n&apos;existe plus ou vous n&apos;y avez pas accès.
              </p>
              <Link href="/create" className="btn-seller-primary">
                Retour à mes produits
              </Link>
            </section>
          )}
          {!editLoading && editingProduct && editSaved && (
            <PaymentLinkSuccessPanel
              payUrl={buildProductPaymentUrl(editingProduct)}
              productName={editingProduct.name}
              productImage={editingProduct.image}
              productId={editingProduct.id}
              title="Produit mis à jour !"
              subtitle={`${editingProduct.name} — votre lien de paiement est inchangé.`}
              autoCopy={false}
              showEdit={false}
              onReset={() => router.push("/create")}
              resetLabel="← Retour à mes produits"
            />
          )}
          {!editLoading && editingProduct && !editSaved && (
            <form onSubmit={handleEditProduct} className="shop-card form-stack">
              <div className="edit-link-strip">
                <p className="edit-link-strip-label">Lien de paiement (permanent)</p>
                <CopyButton
                  text={buildProductPaymentUrl(editingProduct)}
                  label="Copier le lien"
                  copiedLabel="✓ Copié"
                  className="btn-secondary btn-compact"
                />
                <p className="edit-link-strip-url text-muted">
                  {formatPublicUrl(buildProductPaymentUrl(editingProduct))}
                </p>
              </div>
              {error && <p className="alert-danger">{error}</p>}
              <ProductFields form={editForm} onChange={setEditForm} />
              <div className="edit-form-actions">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-seller-primary btn-compact btn-inline"
                >
                  {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
                <Link href="/create" className="btn-ghost btn-inline">
                  Annuler
                </Link>
              </div>
            </form>
          )}
        </>
      )}

      {view === "pseudo" && profile && (
        <>
          <ShopBackBar title="Mon XaalisTag" />
          {error && <p className="alert-danger">{error}</p>}
          {success && <p className="toast-success" role="status">{success}</p>}
          <form onSubmit={handlePseudoSave} className="shop-card form-stack">
            <p className="shop-card-desc text-muted">
              Votre XaalisTag est votre identifiant public unique, simple et
              facile à retenir. Les clients vous trouvent sur{" "}
              <strong>xaalispay.com/seller/{profile.username}</strong>
              {" "}— 1 changement max. par mois.
            </p>
            <div className="pseudo-input-row">
              <span className="pseudo-prefix">@</span>
              <input
                className="input-field input-compact"
                value={pseudo}
                onChange={(e) => setPseudo(slugifyUsername(e.target.value))}
                maxLength={20}
                placeholder="adba"
              />
            </div>
            <button
              type="submit"
              disabled={pseudoSaving || pseudo === profile.username}
              className="btn-seller-primary btn-compact btn-inline"
            >
              {pseudoSaving ? "…" : "Enregistrer"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50dvh] items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <CreatePageContent />
    </Suspense>
  );
}
