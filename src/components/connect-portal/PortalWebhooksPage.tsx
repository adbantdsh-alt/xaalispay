"use client";

import { useEffect, useState } from "react";
import { extractApiError } from "@/lib/api-client";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import { formatPortalDate, type PortalWebhookEndpoint } from "./portal-types";
import { PortalWebhookDetail } from "./PortalWebhookDetail";

export function PortalWebhooksPage() {
  const [endpoints, setEndpoints] = useState<PortalWebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    const res = await portalApiFetch("/api/v1/connect/webhook-endpoints");
    if (res.ok) setEndpoints(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchEndpoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await portalApiFetch("/api/v1/connect/webhook-endpoints", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(extractApiError(data, "Création impossible"));
      return;
    }
    setRevealedSecret(data.secret);
    setUrl("");
    await fetchEndpoints();
  };

  const toggleEnabled = async (endpoint: PortalWebhookEndpoint) => {
    await portalApiFetch(`/api/v1/connect/portal/webhook-endpoints/${endpoint.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !endpoint.enabled }),
    });
    await fetchEndpoints();
  };

  return (
    <section className="admin-section">
      {revealedSecret && (
        <div className="admin-hint-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.4rem" }}>
          <span className="admin-hint-strong">
            Endpoint créé — secret de signature (copiez-le, il ne sera plus affiché) :
          </span>
          <code className="admin-mono" style={{ userSelect: "all", wordBreak: "break-all" }}>
            {revealedSecret}
          </code>
          <button type="button" className="btn-secondary" onClick={() => setRevealedSecret(null)}>
            J&apos;ai copié le secret
          </button>
        </div>
      )}

      <article className="admin-card">
        <h2 className="admin-card-title">Ajouter un endpoint webhook</h2>
        <form onSubmit={createEndpoint} className="admin-filters" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="webhook-url">
              URL
            </label>
            <input
              id="webhook-url"
              className="input-field"
              type="url"
              placeholder="https://api.votre-plateforme.com/webhooks/xaalispay"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "Création…" : "Ajouter"}
          </button>
        </form>
        {error && <p className="alert-danger" role="alert">{error}</p>}
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Endpoints webhook</h2>
        {loading ? (
          <p className="admin-empty">Chargement…</p>
        ) : endpoints.length === 0 ? (
          <p className="admin-empty">Aucun endpoint webhook.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Créé le</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="admin-row-click" onClick={() => setSelectedId(ep.id)}>
                    <td className="admin-mono">{ep.url}</td>
                    <td>{formatPortalDate(ep.created_at)}</td>
                    <td>
                      <span className={`admin-badge ${ep.enabled ? "good" : "neutral"}`}>
                        {ep.enabled ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEnabled(ep);
                        }}
                      >
                        {ep.enabled ? "Désactiver" : "Activer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {selectedId && <PortalWebhookDetail endpointId={selectedId} onClose={() => setSelectedId(null)} />}
    </section>
  );
}
