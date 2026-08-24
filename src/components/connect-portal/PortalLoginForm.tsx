"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { usePortalAuth } from "@/lib/connect-portal-auth";

export function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = usePortalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Connexion échouée");
      return;
    }
    router.replace(searchParams.get("redirect") || "/connect/portal");
  };

  return (
    <div className="page-shell animate-fade-in" style={{ padding: "1.5rem 1.25rem" }}>
      <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
        <BrandMark size="lg" />
      </div>

      <div className="animate-fade-up">
        <h1 className="page-hero-title" style={{ fontSize: "2.25rem", letterSpacing: "-0.02em" }}>
          Portail Connect
        </h1>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          Réservé aux plateformes intégrées à XaalisPay Connect.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="surface-card mt-6 animate-fade-up-d2"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="portal-email">
            Email
          </label>
          <input
            id="portal-email"
            className="input-field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="portal-password">
            Mot de passe
          </label>
          <input
            id="portal-password"
            className="input-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="alert-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || !email || !password} className="btn-primary">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
