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
  zonesToPayload,
  type ProductFormValues,
} from "@/components/seller/ProductForm";
import { buildShopUrl, buildProductPaymentUrl, formatPublicUrl } from "@/lib/site-url";
import { PaymentLinkForm } from "@/components/seller/PaymentLinkForm";
import { PaymentLinkSuccessPanel } from "@/components/seller/PaymentLinkSuccessPanel";
import { CopyButton } from "@/components/ui/CopyButton";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { useDeliveryZones } from "@/lib/use-delivery-zones";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { adaptProduct, toProductPayload } from "@/lib/api-adapters";

function CreatePageContent() {
  const view = useShopView();
  const { zones: deliveryZones } = useDeliveryZones();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams.get("id");
  const { data: sellerData, refresh: refreshSeller } = useSellerData();
  const profile = sellerData?.profile ?? null;
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
  const [deletingId, setDeletingId] = useState("");
  const [editDeleting, setEditDeleting] = useState(false);

  const loadProducts = async () => {
    const prodRes = await apiFetch("/api/catalog/products/");
    if (prodRes.ok) {
      const data = await prodRes.json();
      const list = (data || []).map(adaptProduct);
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

    // Toujours recharger le produit depuis l'API (la liste pourrait être
    // périmée si elle a été chargée avant une modification ailleurs).
    let cancelled = false;
    setEditLoading(true);
    apiFetch(`/api/catalog/products/${encodeURIComponent(editProductId)}/`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = adaptProduct(await res.json());
          setEditingProduct(data);
          setEditForm(productToFormValues(data));
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

  const cooldownUntil = useMemo(() => {
    if (!profile?.usernameChangedAt) return null;
    const next = new Date(profile.usernameChangedAt);
    next.setDate(next.getDate() + 30);
    return next > new Date() ? next : null;
  }, [profile?.usernameChangedAt]);

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

    const res = await apiFetch("/api/catalog/products/", {
      method: "POST",
      body: JSON.stringify(
        toProductPayload({
          name: productForm.name,
          description: productForm.description,
          price: Number(productForm.price),
          deliveryZoneIds: zonesToPayload(productForm.deliveryZoneIds, deliveryZones),
          note: productForm.note,
          image: productForm.image,
        })
      ),
    });

    const raw = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(extractApiError(raw, "Erreur"));
      return;
    }

    const product = adaptProduct(raw);
    setProductForm(emptyProductForm());
    setCreatedPayUrl(buildProductPaymentUrl(product));
    setCreatedProductName(product.name);
    setCreatedProductId(product.id);
    setCreatedProductImage(product.image || productForm.image);
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
    await apiFetch(`/api/catalog/products/${product.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ active: !product.active }),
    });
    loadProducts();
  };

  const activateProductForLink = async (product: Product) => {
    await apiFetch(`/api/catalog/products/${product.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ active: true }),
    });
    setSelectedProductId(product.id);
    loadProducts();
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSaving(true);

    // Pas d'équivalent /api/payment-links côté Django : chaque produit a
    // déjà son lien dès sa création (payment_slug), donc "lien depuis un
    // produit existant" n'a besoin d'aucun appel — seul "nouveau produit"
    // en a besoin, et c'est exactement handleCreateProduct.
    if (linkMode === "existing") {
      const product = products.find((p) => p.id === selectedProductId);
      if (!product) {
        setSaving(false);
        setError("Sélectionnez un produit");
        return;
      }
      setSaving(false);
      setCreatedPayUrl(buildProductPaymentUrl(product));
      setCreatedProductName(product.name);
      setSuccess("Lien prêt à envoyer");
      return;
    }

    const res = await apiFetch("/api/catalog/products/", {
      method: "POST",
      body: JSON.stringify(
        toProductPayload({
          name: inlineProduct.name,
          price: Number(inlineProduct.price),
          deliveryZoneIds: zonesToPayload(inlineProduct.deliveryZoneIds, deliveryZones),
          note: inlineProduct.note,
          image: inlineProduct.image,
          description: inlineProduct.description,
        })
      ),
    });

    const raw = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(extractApiError(raw, "Erreur"));
      return;
    }

    const product = adaptProduct(raw);
    setCreatedPayUrl(buildProductPaymentUrl(product));
    setCreatedProductName(product.name);
    setSuccess("Lien prêt à envoyer");
    loadProducts();
  };

  const handleDeleteProduct = async (product: Product, redirectAfter = false) => {
    const confirmed = window.confirm(
      `Supprimer « ${product.name} » ?\n\nSi des commandes existent, le produit sera seulement dépublié.`
    );
    if (!confirmed) return;

    resetMessages();
    if (redirectAfter) setEditDeleting(true);
    else setDeletingId(product.id);

    const res = await apiFetch(`/api/catalog/products/${encodeURIComponent(product.id)}/`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));

    if (redirectAfter) setEditDeleting(false);
    else setDeletingId("");

    if (!res.ok) {
      setError(extractApiError(data, "Suppression impossible"));
      return;
    }

    setSuccess(data.message || "Produit supprimé");
    await loadProducts();
    if (redirectAfter) router.push("/create");
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    resetMessages();

    if (!editForm.name.trim() || Number(editForm.price) <= 0) {
      setError("Nom et prix requis");
      return;
    }

    setSaving(true);

    const res = await apiFetch(`/api/catalog/products/${editingProduct.id}/`, {
      method: "PATCH",
      // Pas besoin de "clearImage" : PATCH applique exactement ce qui est
      // envoyé, donc image: "" efface bien l'image — pas de footgun à
      // contourner comme avec l'ancien backend (blob JSON).
      body: JSON.stringify(
        toProductPayload({
          name: editForm.name,
          description: editForm.description,
          price: Number(editForm.price),
          deliveryZoneIds: zonesToPayload(editForm.deliveryZoneIds, deliveryZones),
          note: editForm.note,
          image: editForm.image,
        })
      ),
    });

    const raw = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(extractApiError(raw, "Modification impossible"));
      return;
    }

    const updated = adaptProduct(raw);
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
    const res = await apiFetch("/api/auth/username/change", {
      method: "POST",
      body: JSON.stringify({ username: clean }),
    });
    const data = await res.json();
    setPseudoSaving(false);
    if (!res.ok) {
      if (res.status === 429 && data.next_change_at) {
        setError(
          `Prochain changement possible le ${new Date(data.next_change_at).toLocaleDateString("fr-FR")}.`
        );
      } else {
        setError(extractApiError(data, "Modification impossible"));
      }
      return;
    }
    setPseudo(data.username);
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

          {error && <p className="alert-danger" role="alert">{error}</p>}
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
                    onDelete={() => handleDeleteProduct(product)}
                    deleting={deletingId === product.id}
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
          {error && <p className="alert-danger" role="alert">{error}</p>}
          {success && !createdPayUrl && <p className="toast-success" role="status">{success}</p>}
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
              <button type="submit" disabled={saving} className="btn-seller-primary btn-compact btn-inline">
                {saving ? "Enregistrement…" : "Créer le produit"}
              </button>
            </form>
          )}
        </>
      )}

      {view === "link" && (
        <>
          <ShopBackBar title="Lien de paiement" />
          {error && <p className="alert-danger" role="alert">{error}</p>}
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
              {error && <p className="alert-danger" role="alert">{error}</p>}
              <ProductFields form={editForm} onChange={setEditForm} />
              <div className="edit-form-actions">
                <button
                  type="submit"
                  disabled={saving || editDeleting}
                  className="btn-seller-primary btn-compact btn-inline"
                >
                  {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
                <Link href="/create" className="btn-ghost btn-inline">
                  Annuler
                </Link>
                <button
                  type="button"
                  className="btn-danger btn-compact btn-inline"
                  disabled={saving || editDeleting}
                  onClick={() => editingProduct && handleDeleteProduct(editingProduct, true)}
                >
                  {editDeleting ? "Suppression…" : "Supprimer le produit"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {view === "pseudo" && profile && (
        <>
          <ShopBackBar title="Mon XaalisTag" />
          {error && <p className="alert-danger" role="alert">{error}</p>}
          {success && <p className="toast-success" role="status">{success}</p>}
          <form onSubmit={handlePseudoSave} className="shop-card form-stack">
            <p className="shop-card-desc text-muted">
              Votre XaalisTag est votre identifiant public unique, simple et
              facile à retenir. Les clients vous trouvent sur{" "}
              <strong>xaalispay.com/seller/{profile.username}</strong>.
            </p>
            {cooldownUntil ? (
              <p className="alert-info">
                Prochain changement possible le {cooldownUntil.toLocaleDateString("fr-FR")}.
              </p>
            ) : (
              <p className="text-xs text-muted">
                Vous pouvez changer votre XaalisTag une fois tous les 30 jours.
              </p>
            )}
            <div className="pseudo-input-row">
              <span className="pseudo-prefix">@</span>
              <input
                className="input-field input-compact"
                value={pseudo}
                onChange={(e) => setPseudo(slugifyUsername(e.target.value))}
                maxLength={20}
                placeholder="adba"
                disabled={!!cooldownUntil}
              />
            </div>
            <button
              type="submit"
              disabled={pseudoSaving || pseudo === profile.username || !!cooldownUntil}
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
