"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { activeStatusClass, formatAdminDate, type SellerRow } from "./admin-types";
import { AdminSellerDetail } from "./AdminSellerDetail";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récents" },
  { value: "-orders_count", label: "Plus de commandes" },
  { value: "-lifetime_gmv", label: "CA le plus élevé" },
  { value: "business_name", label: "Nom (A→Z)" },
] as const;

export function AdminSellersSection({
  sellers,
  onSearch,
}: {
  sellers: SellerRow[];
  onSearch: (params: { search?: string; ordering?: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  return (
    <section className="admin-section">
      <div className="admin-filters">
        <div className="admin-search-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            className="input-field input-compact"
            placeholder="Rechercher un vendeur (nom, @, téléphone)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field input-compact" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          {ORDERING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {sellers.length === 0 ? (
        <p className="admin-empty">Aucun vendeur trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Téléphone</th>
                <th>Commandes</th>
                <th>CA cumulé</th>
                <th>Solde dispo.</th>
                <th>Inscrit le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="admin-row-click" onClick={() => setSelectedSellerId(s.id)}>
                  <td>
                    <strong>{s.businessName}</strong>
                    <span className="admin-cell-sub admin-mono">@{s.username}</span>
                  </td>
                  <td className="admin-mono">{s.phone}</td>
                  <td className="admin-mono">{s.ordersCount}</td>
                  <td className="admin-mono">{formatCurrency(s.lifetimeGmv)}</td>
                  <td className="admin-mono">{formatCurrency(s.balance.availableBalance)}</td>
                  <td>{formatAdminDate(s.createdAt)}</td>
                  <td>
                    <span className={`admin-badge ${activeStatusClass(s.isActive)}`}>
                      {s.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSellerId && (
        <AdminSellerDetail sellerId={selectedSellerId} onClose={() => setSelectedSellerId(null)} />
      )}
    </section>
  );
}
