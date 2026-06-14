"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardNav } from "../DashboardNav";
import type { Product } from "@/lib/types";
import { formatCurrency, formatDeliveryHours } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    deliveryHours: "48",
  });

  const load = async () => {
    const res = await fetch("/api/products");
    if (res.status === 401) {
      window.location.href = "/auth";
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        deliveryHours: Number(form.deliveryHours),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }

    setForm({ name: "", description: "", price: "", deliveryHours: "48" });
    setShowForm(false);
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

  if (loading) {
    return (
      <div className="page-shell-wide flex min-h-dvh items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#0FD5C7] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-shell-wide">
      <Link href="/dashboard" className="text-sm text-[var(--muted)]">
        ← Dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Mes produits</h1>

      <div className="mt-4">
        <DashboardNav />
      </div>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="btn-primary w-full"
      >
        {showForm ? "Annuler" : "+ Ajouter un produit"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-4 space-y-3 p-5">
          <input
            className="input-field"
            placeholder="Nom du produit *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Prix (FCFA) *"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            min={1}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">
              Délai de livraison (heures) *
            </label>
            <input
              className="input-field"
              type="number"
              value={form.deliveryHours}
              onChange={(e) => setForm({ ...form, deliveryHours: e.target.value })}
              required
              min={1}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Si vous ne validez pas le PIN dans ce délai, remboursement automatique au client.
            </p>
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
          <button type="submit" disabled={saving} className="btn-accent w-full">
            {saving ? "Enregistrement..." : "Enregistrer le produit"}
          </button>
        </form>
      )}

      <section className="mt-6 space-y-3">
        {products.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            Aucun produit — ajoutez-en un pour que les clients puissent payer
          </div>
        ) : (
          products.map((product) => (
            <article key={product.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  {product.description && (
                    <p className="mt-0.5 text-sm text-[var(--muted)]">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-2 font-bold">{formatCurrency(product.price)}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Livraison : {formatDeliveryHours(product.deliveryHours)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(product)}
                  className={`badge ${product.active ? "badge-verified" : "badge-status"}`}
                >
                  {product.active ? "Actif" : "Inactif"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
