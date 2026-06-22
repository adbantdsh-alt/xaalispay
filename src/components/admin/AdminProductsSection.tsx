"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type ProductRow } from "./admin-types";

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
  const [ordering, setOrdering] = useState("-created_at");

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

  return (
    <section className="admin-section">
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input-field input-compact"
            placeholder="Rechercher un produit ou un vendeur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`admin-filter ${active === "" ? "is-active" : ""}`}
          onClick={() => setActive("")}
        >
          Tous
        </button>
        <button
          type="button"
          className={`admin-filter ${active === "true" ? "is-active" : ""}`}
          onClick={() => setActive("true")}
        >
          Actifs
        </button>
        <button
          type="button"
          className={`admin-filter ${active === "false" ? "is-active" : ""}`}
          onClick={() => setActive("false")}
        >
          Inactifs
        </button>
        <select className="input-field input-compact" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          {ORDERING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <p className="admin-empty">Aucun produit trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Vendeur</th>
                <th>Prix</th>
                <th>Commandes</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <span className="admin-cell-sub">{formatAdminDate(p.createdAt)}</span>
                  </td>
                  <td>
                    {p.sellerBusinessName}
                    <span className="admin-cell-sub admin-mono">@{p.sellerUsername}</span>
                  </td>
                  <td className="admin-mono">{formatCurrency(p.price)}</td>
                  <td className="admin-mono">{p.ordersCount}</td>
                  <td>
                    <span className={`admin-badge ${p.active ? "good" : "neutral"}`}>
                      {p.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    {p.active ? (
                      <button
                        type="button"
                        className="admin-action-btn"
                        disabled={deactivatingId === p.id}
                        onClick={() => handleDeactivate(p)}
                      >
                        {deactivatingId === p.id ? "…" : "Désactiver"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
