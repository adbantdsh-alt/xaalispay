"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { buildAuthCallbackUrl } from "@/lib/site-url";
import { isValidUsername, slugifyUsername } from "@/lib/utils";

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className="input-field pr-12"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
        placeholder={placeholder}
        autoComplete={visible ? "off" : "current-password"}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-black/5"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const useSupabase = isSupabaseConfigured();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "confirmation") {
      setError("Lien de confirmation invalide ou expiré. Renvoyez l'email ci-dessous.");
      setMode("login");
    }
  }, [searchParams]);

  const authRedirect = buildAuthCallbackUrl(
    searchParams.get("redirect") || "/dashboard"
  );

  const handleResendConfirmation = async () => {
    const targetEmail = pendingEmail || email;
    if (!targetEmail.trim()) {
      setError("Entrez votre email pour renvoyer la confirmation");
      return;
    }
    setResending(true);
    setError("");
    setSuccess("");
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail.trim(),
        options: { emailRedirectTo: authRedirect },
      });
      if (resendError) throw resendError;
      setSuccess(
        `Email de confirmation renvoyé à ${targetEmail}. Cliquez le lien sur xaalispay.com (pas localhost).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renvoi impossible");
    } finally {
      setResending(false);
    }
  };

  const handleLocalSignup = async () => {
    const cleanUsername = slugifyUsername(username);
    if (!isValidUsername(cleanUsername)) {
      throw new Error(
        "Identifiant invalide : 3-20 caractères, lettres minuscules, chiffres et _"
      );
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName,
        businessName,
        username: cleanUsername,
        phone: phone || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Inscription échouée");
    router.push("/dashboard");
    router.refresh();
  };

  const handleLocalLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Connexion échouée");
    router.push(searchParams.get("redirect") || "/dashboard");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!useSupabase) {
        if (mode === "login") {
          await handleLocalLogin();
        } else {
          await handleLocalSignup();
        }
        return;
      }

      if (mode === "login") {
        const res = await fetch("/api/auth/supabase-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Connexion échouée");
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

      const signupRes = await fetch("/api/auth/supabase-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) throw new Error(signupData.error || "Inscription échouée");

      const profileRes = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: signupData.user.id,
          email: signupData.user.email,
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

      if (signupData.needsEmailVerification) {
        setSuccess(
          "Compte créé et connecté. Confirmez votre email pour publier des produits (lien envoyé par mail)."
        );
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
    <div className="page-shell animate-fade-in" style={{ padding: "1.5rem 1.25rem" }}>
      <Link href="/" className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
        ← Accueil
      </Link>

      <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
        <BrandMark size="lg" />
      </div>

      <div className="animate-fade-up">
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          {mode === "login" ? "Bon retour" : "Créer un compte"}
        </h1>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          {mode === "login" ? "Accédez à votre espace vendeur" : "Votre boutique en 2 minutes"}
        </p>
      </div>

      <div className="surface mt-6 flex gap-1 p-1 animate-fade-up-d1" style={{ padding: "0.25rem" }}>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`tab-pill ${mode === "login" ? "tab-pill-active" : ""}`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`tab-pill ${mode === "signup" ? "tab-pill-active" : ""}`}
        >
          Inscription
        </button>
      </div>

      <form onSubmit={handleSubmit} className="surface-card mt-5 animate-fade-up-d2" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                Votre XaalisTag *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-black">
                  @
                </span>
                <input
                  className="input-field pl-9"
                  value={username}
                  onChange={(e) => setUsername(slugifyUsername(e.target.value))}
                  required
                  placeholder="adba"
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                Comme un Wise Tag : vos clients vous paient via @
                {username || "votre_tag"} sur xaalispay.com/seller/
                {username || "votre_tag"}
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
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="6 caractères minimum"
          />
        </div>

        {error && <p className="alert-danger">{error}</p>}
        {success && <p className="toast-success" role="status">{success}</p>}

        {(pendingEmail || (mode === "login" && email)) && useSupabase && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resending}
            className="btn-secondary"
          >
            {resending ? "Envoi…" : "Renvoyer le lien de vérification (pour publier des produits)"}
          </button>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
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
          <div className="spinner" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
