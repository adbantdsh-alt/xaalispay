"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { adaptConnectPlatformRow } from "./admin-adapters";
import { AdminConnectPlatformDetail } from "./AdminConnectPlatformDetail";
import { handleAdminAuthStatus } from "./AdminDataProvider";
import { activeStatusClass, formatAdminDate, type ConnectPlatformRow } from "./admin-types";

const AUTO_REFRESH_MS = 30_000;

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "-transactions_count", label: "Plus de transactions" },
  { value: "name", label: "Nom (A→Z)" },
] as const;

export function AdminConnectPlatformsSection() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<ConnectPlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const paramsRef = useRef({ search, ordering });
  paramsRef.current = { search, ordering };

  const fetchPlatforms = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      const qs = new URLSearchParams();
      const { search: s, ordering: o } = paramsRef.current;
      if (s) qs.set("search", s);
      if (o) qs.set("ordering", o);
      const res = await apiFetch(`/api/admin/connect/platforms${qs.toString() ? `?${qs}` : ""}`);
      if (handleAdminAuthStatus(res.status, router, "/admin/connect/platforms")) return;
      if (res.ok) setPlatforms((await res.json()).map(adaptConnectPlatformRow));
      if (!silent) setLoading(false);
    },
    [router]
  );

  useEffect(() => {
    const id = setTimeout(() => fetchPlatforms(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  useEffect(() => {
    const id = setInterval(() => fetchPlatforms(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchPlatforms]);

  return (
    <section className="admin-section">
      <article className="admin-card">
        <h2 className="admin-card-title">Plateformes connectées</h2>
        <div className="admin-hint-banner">
          <span className="admin-hint-dot" aria-hidden="true" />
          <span className="admin-hint-strong">Solde propre / solde marchands</span>
          <span className="admin-hint-muted">
            — le solde propre d&apos;une plateforme est sa commission Connect uniquement, jamais son revenu total
            (une plateforme peut avoir d&apos;autres revenus hors Connect).
          </span>
        </div>
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input
              className="input-field input-compact"
              placeholder="Rechercher une plateforme…"
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

        {loading && platforms.length === 0 ? (
          <p className="admin-empty">Chargement…</p>
        ) : platforms.length === 0 ? (
          <p className="admin-empty">Aucune plateforme connectée.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plateforme</th>
                  <th>Pays</th>
                  <th>Commission payin</th>
                  <th>Commission payout</th>
                  <th>Transactions</th>
                  <th>Revenu généré</th>
                  <th>Solde propre dispo.</th>
                  <th>Solde marchands dispo.</th>
                  <th>Connectée le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.id} className="admin-row-click" onClick={() => setSelectedPlatformId(p.id)}>
                    <td>
                      <strong>{p.name}</strong>
                      <span className="admin-cell-sub admin-mono">{p.slug}</span>
                    </td>
                    <td className="admin-mono">{p.country}</td>
                    <td className="admin-mono">{(Number(p.xaalispayFeePercent) * 100).toFixed(2)} %</td>
                    <td className="admin-mono">{(Number(p.xaalispayPayoutFeePercent) * 100).toFixed(2)} %</td>
                    <td className="admin-mono">{p.transactionsCount}</td>
                    <td className="admin-mono">{formatCurrency(p.revenueTotal)}</td>
                    <td className="admin-mono">{formatCurrency(p.ownAvailableBalance)}</td>
                    <td className="admin-mono">{formatCurrency(p.merchantAvailableBalance)}</td>
                    <td>{formatAdminDate(p.createdAt)}</td>
                    <td>
                      <span className={`admin-badge ${activeStatusClass(p.isActive)}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {selectedPlatformId && (
        <AdminConnectPlatformDetail platformId={selectedPlatformId} onClose={() => setSelectedPlatformId(null)} />
      )}
    </section>
  );
}
