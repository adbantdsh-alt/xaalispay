"use client";

import { useState } from "react";
import { apiFetch, extractApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";

export function AdminChangePasswordPage() {
  const { refreshUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(extractApiError(data, "Changement impossible"));
      setLoading(false);
      return;
    }
    // La redirection vers la bonne page (selon le rôle) est gérée par
    // AdminShellClient dès que must_change_password repasse à false ici.
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
