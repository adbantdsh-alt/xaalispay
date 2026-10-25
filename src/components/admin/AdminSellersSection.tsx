"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type SellerRow } from "./admin-types";
import { EmptyState, EntityCell, Panel, SearchField, StatStrip, StatusPill, Tabs } from "./AdminUI";
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
  const [ordering, setOrdering] = useState<string>("-created_at");
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  const stats = {
    active: sellers.filter((seller) => seller.isActive).length,
    selling: sellers.filter((seller) => seller.ordersCount > 0).length,
    gmv: sellers.reduce((sum, seller) => sum + seller.lifetimeGmv, 0),
    available: sellers.reduce((sum, seller) => sum + seller.balance.availableBalance, 0),
  };

  return (
    <section className="admin-section">
      <StatStrip
        items={[
          { label: "Vendeurs", value: sellers.length, hint: `${stats.active} actif(s)`, tone: "accent" },
          {
            label: "Ont déjà vendu",
            value: stats.selling,
            hint: sellers.length ? `${Math.round((stats.selling / sellers.length) * 100)} % des vendeurs` : "—",
          },
          { label: "CA cumulé", value: formatCurrency(stats.gmv), hint: "tous vendeurs listés" },
          { label: "Disponible à retirer", value: formatCurrency(stats.available), hint: "argent des vendeurs" },
        ]}
      />

      <Panel
        title="Vendeurs"
        count={sellers.length}
        toolbar={
          <>
            <SearchField value={search} onChange={setSearch} placeholder="Nom, @identifiant, téléphone…" />
            <Tabs
              label="Trier"
              value={ordering}
              onChange={setOrdering}
              options={ORDERING_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </>
        }
      >
        {sellers.length === 0 ? (
          <EmptyState icon={Users} title="Aucun vendeur" hint="Aucun vendeur ne correspond à cette recherche." />
        ) : (
          <table className="ax-table">
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Téléphone</th>
                <th className="is-num">Commandes</th>
                <th className="is-num">CA cumulé</th>
                <th className="is-num">Disponible</th>
                <th>Inscrit le</th>
                <th>Statut</th>
                <th aria-label="Ouvrir" />
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr
                  key={seller.id}
                  className="ax-row"
                  tabIndex={0}
                  onClick={() => setSelectedSellerId(seller.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedSellerId(seller.id)}
                >
                  <td>
                    <EntityCell name={seller.businessName} sub={`@${seller.username}`} />
                  </td>
                  <td className="admin-mono is-muted">{seller.phone}</td>
                  <td className="is-num">{seller.ordersCount}</td>
                  <td className="is-num">{formatCurrency(seller.lifetimeGmv)}</td>
                  <td className="is-num">{formatCurrency(seller.balance.availableBalance)}</td>
                  <td className="is-nowrap is-muted">{formatAdminDate(seller.createdAt)}</td>
                  <td>
                    <StatusPill tone={seller.isActive ? "good" : "neutral"} label={seller.isActive ? "Actif" : "Inactif"} />
                  </td>
                  <td className="ax-chevron">
                    <ChevronRight size={16} aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {selectedSellerId && (
        <AdminSellerDetail sellerId={selectedSellerId} onClose={() => setSelectedSellerId(null)} />
      )}
    </section>
  );
}
