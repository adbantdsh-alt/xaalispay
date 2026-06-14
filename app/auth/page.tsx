"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isValidUsername, slugifyUsername } from "@/lib/utils";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase non configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local"
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.push(searchParams.get("redirect") || "/dashboard");
        router.refresh();
        return;
      }

      const cleanUsername = slugifyUsername(username);
      if (!isValidUsername(cleanUsername)) {
        throw new Error(
          "Identifiant invalide : 3-20 caractères, lettres minuscules, chiffres et _"
        );
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!data.user) throw new Error("Inscription échouée");

      const profileRes = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          username: cleanUsername,
          displayName,
          businessName,
          phone: phone || undefined,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.error || "Profil vendeur non créé");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
        ← Accueil
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Connexion vendeur" : "Créer un compte vendeur"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {mode === "login"
            ? "Accédez à votre tableau de bord"
            : "Choisissez votre identifiant public (@username)"}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
            mode === "login"
              ? "bg-[#0F1F66] text-white"
              : "bg-white text-[var(--muted)]"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
            mode === "signup"
              ? "bg-[#0F1F66] text-white"
              : "bg-white text-[var(--muted)]"
          }`}
        >
          Inscription
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card mt-5 space-y-4 p-5">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Votre nom</label>
              <input
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Amadou Diallo"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nom de la boutique
              </label>
              <input
                className="input-field"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="Ma Boutique SN"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Identifiant public *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                  @
                </span>
                <input
                  className="input-field pl-9"
                  value={username}
                  onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                  required
                  placeholder="ma_boutique"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Vos clients vous trouveront via xaalispay.com/@{username || "identifiant"}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Téléphone (optionnel)
              </label>
              <input
                className="input-field"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77 123 45 67"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            className="input-field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vous@exemple.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Mot de passe</label>
          <input
            className="input-field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="6 caractères minimum"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? "Chargement..."
            : mode === "login"
              ? "Se connecter"
              : "Créer mon compte vendeur"}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0FD5C7] border-t-transparent" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
