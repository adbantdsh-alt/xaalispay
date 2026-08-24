"use client";

import { useEffect, useState } from "react";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import { formatPortalDate, type PortalWebhookDelivery } from "./portal-types";

export function PortalWebhookDetail({ endpointId, onClose }: { endpointId: string; onClose: () => void }) {
  const [deliveries, setDeliveries] = useState<PortalWebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    portalApiFetch(`/api/v1/connect/portal/webhook-endpoints/${endpointId}/deliveries`).then(async (res) => {
      if (cancelled) return;
      if (res.ok) setDeliveries(await res.json());
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [endpointId]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-head-title">Livraisons webhook</div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        {loading ? (
          <p className="admin-empty">Chargement…</p>
        ) : deliveries.length === 0 ? (
          <p className="admin-empty">Aucune livraison pour l&apos;instant.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Statut</th>
                  <th>Tentatives</th>
                  <th>Dernière erreur</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td className="admin-mono">{d.event_type}</td>
                    <td>
                      <span
                        className={`admin-badge ${d.status === "succeeded" ? "good" : d.status === "failed" ? "bad" : "warn"}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td>{d.attempts}</td>
                    <td className="admin-dispute-reason">{d.last_error || "—"}</td>
                    <td>{formatPortalDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
