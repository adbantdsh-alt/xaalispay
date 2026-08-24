"use client";

import { useEffect, useState } from "react";
import { extractApiError } from "@/lib/api-client";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import { formatPortalDate, type PortalAPIKey } from "./portal-types";

export function PortalApiKeysPage() {
  const [keys, setKeys] = useState<PortalAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<"test" | "live">("test");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    const res = await portalApiFetch("/api/v1/connect/portal/api-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await portalApiFetch("/api/v1/connect/portal/api-keys", {
      method: "POST",
      body: JSON.stringify({ label, mode }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(extractApiError(data, "Création impossible"));
      return;
    }
    setRevealedKey(data.key);
    setLabel("");
    await fetchKeys();
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    await portalApiFetch(`/api/v1/connect/portal/api-keys/${id}/revoke`, { method: "POST" });
    setRevokingId(null);
    await fetchKeys();
  };

  return (
    <section className="admin-section">
      {revealedKey && (
        <div className="admin-hint-banner" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.4rem" }}>
          <span className="admin-hint-strong">Clé créée — copiez-la maintenant, elle ne sera plus affichée.</span>
          <code className="admin-mono" style={{ userSelect: "all", wordBreak: "break-all" }}>
            {revealedKey}
          </code>
          <button type="button" className="btn-secondary" onClick={() => setRevealedKey(null)}>
            J&apos;ai copié la clé
          </button>
        </div>
      )}

      <article className="admin-card">
        <h2 className="admin-card-title">Créer une clé API</h2>
        <form onSubmit={createKey} className="admin-filters" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="key-label">
              Libellé (optionnel)
            </label>
            <input
              id="key-label"
              className="input-field input-compact"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex. serveur production"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="key-mode">
              Mode
            </label>
            <select
              id="key-mode"
              className="input-field input-compact"
              value={mode}
              onChange={(e) => setMode(e.target.value as "test" | "live")}
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "Création…" : "Créer"}
          </button>
        </form>
        {error && <p className="alert-danger" role="alert">{error}</p>}
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Clés API</h2>
        {loading ? (
          <p className="admin-empty">Chargement…</p>
        ) : keys.length === 0 ? (
          <p className="admin-empty">Aucune clé API.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Préfixe</th>
                  <th>Libellé</th>
                  <th>Mode</th>
                  <th>Dernière utilisation</th>
                  <th>Créée le</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="admin-mono">{k.key_prefix}</td>
                    <td>{k.label || "—"}</td>
                    <td>{k.mode}</td>
                    <td>{formatPortalDate(k.last_used_at)}</td>
                    <td>{formatPortalDate(k.created_at)}</td>
                    <td>
                      <span className={`admin-badge ${k.is_active ? "good" : "neutral"}`}>
                        {k.is_active ? "Active" : "Révoquée"}
                      </span>
                    </td>
                    <td>
                      {k.is_active && (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={revokingId === k.id}
                          onClick={() => revokeKey(k.id)}
                        >
                          {revokingId === k.id ? "…" : "Révoquer"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
