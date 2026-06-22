"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { useDeliveryZones } from "@/lib/use-delivery-zones";

export function DeliveryZonesManager() {
  const { zones, loading, refresh } = useDeliveryZones();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const priceValue = Number(price);
    if (!name.trim() || price.trim() === "" || Number.isNaN(priceValue) || priceValue < 0) {
      setError("Indiquez un nom et un prix valides.");
      return;
    }
    setSaving(true);
    const res = await apiFetch("/api/catalog/delivery-zones/", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), price: priceValue }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(extractApiError(data, "Création impossible"));
      return;
    }
    setName("");
    setPrice("");
    await refresh();
  };

  const removeZone = async (id: string, zoneName: string) => {
    if (!window.confirm(`Supprimer la zone « ${zoneName} » ? Elle sera retirée de tous les produits concernés.`)) {
      return;
    }
    setError("");
    setDeletingId(id);
    const res = await apiFetch(`/api/catalog/delivery-zones/${id}/`, { method: "DELETE" });
    setDeletingId("");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(extractApiError(data, "Suppression impossible"));
      return;
    }
    await refresh();
  };

  return (
    <div className="field-block">
      <div className="delivery-zone-list">
        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : zones.length === 0 ? (
          <p className="text-muted">Aucune zone configurée — ajoutez-en une ci-dessous.</p>
        ) : (
          zones.map((z) => (
            <div key={z.id} className="delivery-zone-chip">
              <span className="delivery-zone-chip-label">{z.name}</span>
              <span className="delivery-zone-chip-price">{formatCurrency(z.price)}</span>
              <button
                type="button"
                className="delivery-zone-chip-remove"
                onClick={() => removeZone(z.id, z.name)}
                disabled={deletingId === z.id}
                aria-label={`Supprimer la zone ${z.name}`}
              >
                {deletingId === z.id ? "…" : "×"}
              </button>
            </div>
          ))
        )}
      </div>

      <form className="delivery-zone-picker" onSubmit={addZone}>
        <input
          className="input-field input-compact"
          placeholder="Nom de la zone (ex. Dakar - Plateau)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          disabled={saving}
        />
        <input
          className="input-field input-compact"
          type="number"
          placeholder="Prix livraison (FCFA)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min={0}
          disabled={saving}
        />
        <button type="submit" className="btn-secondary btn-compact" disabled={saving}>
          {saving ? "…" : "Ajouter cette zone"}
        </button>
      </form>
      <p className="text-muted" style={{ fontSize: "0.6875rem", marginTop: "0.35rem" }}>
        Indiquez 0 si la livraison est gratuite pour cette zone.
      </p>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
