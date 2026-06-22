"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const forbidden = searchParams.get("error") === "forbidden";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await adminLogin(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Connexion échouée");
      return;
    }
    router.replace(searchParams.get("redirect") || "/admin");
  };

  return (
    <div className="page-shell animate-fade-in" style={{ padding: "1.5rem 1.25rem" }}>
      <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
        <BrandMark size="lg" />
      </div>

      <div className="animate-fade-up">
        <h1 className="page-hero-title" style={{ fontSize: "2.25rem", letterSpacing: "-0.02em" }}>
          Panel admin
        </h1>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          Réservé à l&apos;équipe XaalisPay.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="surface-card mt-6 animate-fade-up-d2"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            className="input-field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="admin-password">
            Mot de passe
          </label>
          <input
            id="admin-password"
            className="input-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {(error || forbidden) && (
          <p className="alert-danger" role="alert">
            {error || "Session expirée ou accès non autorisé — reconnectez-vous."}
          </p>
        )}

        <button type="submit" disabled={loading || !email || !password} className="btn-primary">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
