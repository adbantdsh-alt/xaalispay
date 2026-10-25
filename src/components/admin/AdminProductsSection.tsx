"use client";

import { useEffect, useState } from "react";
import { EyeOff, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type ProductRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField, StatStrip, StatusPill, Tabs } from "./AdminUI";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récents" },
  { value: "-orders_count", label: "Plus de commandes" },
  { value: "-price", label: "Prix décroissant" },
  { value: "name", label: "Nom (A→Z)" },
] as const;

export function AdminProductsSection({
  products,
  deactivatingId,
  onSearch,
  onDeactivate,
}: {
  products: ProductRow[];
  deactivatingId: number | null;
  onSearch: (params: { search?: string; active?: string; ordering?: string }) => void;
  onDeactivate: (productId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [ordering, setOrdering] = useState<string>("-created_at");

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, active: active || undefined, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, active, ordering]);

  const handleDeactivate = (product: ProductRow) => {
    if (
      !window.confirm(
        `Désactiver « ${product.name} » ? Le produit ne sera plus visible sur la boutique publique.`
      )
    ) {
      return;
    }
    onDeactivate(product.id);
  };

  const stats = {
    active: products.filter((p) => p.active).length,
    sold: products.filter((p) => p.ordersCount > 0).length,
    orders: products.reduce((sum, p) => sum + p.ordersCount, 0),
  };

  return (
    <section className="admin-section">
      <StatStrip
        items={[
          { label: "Produits", value: products.length, hint: `${stats.active} actif(s)`, tone: "accent" },
          {
            label: "Déjà vendus",
            value: stats.sold,
            hint: products.length ? `${Math.round((stats.sold / products.length) * 100)} % du catalogue` : "—",
          },
          { label: "Commandes générées", value: stats.orders, hint: "tous produits listés" },
        ]}
      />

      <Panel
        title="Catalogue"
        count={products.length}
        toolbar={
          <>
            <SearchField value={search} onChange={setSearch} placeholder="Produit ou vendeur…" />
            <Tabs
              label="Filtrer par statut"
              value={active}
              onChange={setActive}
              options={[
                { value: "", label: "Tous" },
                { value: "true", label: "Actifs" },
                { value: "false", label: "Inactifs" },
              ]}
            />
            <label className="ax-select">
              <span className="ax-sr-only">Trier</span>
              <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
                {ORDERING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      >
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" hint="Aucun produit ne correspond à ces filtres." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Vendeur</th>
                <th className="is-num">Prix</th>
                <th className="is-num">Commandes</th>
                <th>Statut</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="ax-cell-strong">{p.name}</span>
                    <span className="ax-cell-sub">Ajouté le {formatAdminDate(p.createdAt)}</span>
                  </td>
                  <td>
                    <EntityCell name={p.sellerBusinessName} sub={`@${p.sellerUsername}`} />
                  </td>
                  <td className="is-num">{formatCurrency(p.price)}</td>
                  <td className="is-num">{p.ordersCount}</td>
                  <td>
                    <StatusPill tone={p.active ? "good" : "neutral"} label={p.active ? "Actif" : "Inactif"} />
                  </td>
                  <td className="is-nowrap">
                    {p.active && (
                      <button
                        type="button"
                        className="ax-btn ax-btn--sm"
                        disabled={deactivatingId === p.id}
                        onClick={() => handleDeactivate(p)}
                      >
                        <EyeOff size={13} aria-hidden="true" />
                        {deactivatingId === p.id ? "…" : "Désactiver"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}
