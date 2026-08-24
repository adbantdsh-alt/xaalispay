"use client";

import { useState } from "react";
import { extractApiError } from "@/lib/api-client";
import { portalApiFetch } from "@/lib/connect-portal-api-client";
import { usePortalAuth } from "@/lib/connect-portal-auth";

export function PortalChangePasswordPage() {
  const { refreshUser } = usePortalAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const res = await portalApiFetch("/api/v1/connect/portal/change-password", {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(extractApiError(data, "Changement impossible"));
      setLoading(false);
      return;
    }
    // La redirection vers /connect/portal est gérée par PortalShellClient dès
    // que must_change_password repasse à false ici.
    await refreshUser();
    setLoading(false);
  };

  return (
    <div className="admin-section" style={{ maxWidth: "28rem" }}>
      <article className="admin-card">
        <h2 className="admin-card-title">Changer mon mot de passe</h2>
        <p className="text-muted" style={{ marginBottom: "1rem" }}>
          Vous devez choisir un nouveau mot de passe avant de continuer.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="new-password">
              Nouveau mot de passe
            </label>
            <input
              id="new-password"
              className="input-field"
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="confirm-password">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-password"
              className="input-field"
              type="password"
              autoComplete="new-password"
              minLength={10}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="alert-danger" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading || !newPassword || !confirmPassword} className="btn-primary">
            {loading ? "Enregistrement…" : "Changer mon mot de passe"}
          </button>
        </form>
      </article>
    </div>
  );
}
