"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getApiBaseUrl } from "./site-url";
import { refreshAccessToken, setApiAccessToken, extractApiError } from "./api-client";

export interface Profile {
  id: number;
  phone: string;
  email?: string | null;
  username: string;
  display_name: string;
  business_name: string;
  role: "seller" | "super_admin" | "dispute_manager";
  must_change_password: boolean;
  [key: string]: unknown;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Connexion en deux étapes : login() ne renvoie jamais de tokens — un
 * succès signifie "PIN correct, OTP envoyé", la session ne devient
 * effective qu'après confirmLogin(). Voir apps.accounts.views.LoginView
 * côté backend (téléphone public sur la page boutique → l'OTP de
 * confirmation à chaque connexion explicite compense). */
interface LoginResult extends AuthResult {
  lockedUntil?: string | null;
}

interface SignupPayload {
  phone: string;
  ticket: string;
  pin: string;
  display_name: string;
  business_name: string;
  email?: string;
}

interface AdminLoginResult extends AuthResult {
  lockedUntil?: string | null;
}

interface AuthContextValue {
  user: Profile | null;
  accessToken: string | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<LoginResult>;
  confirmLogin: (phone: string, ticket: string) => Promise<AuthResult>;
  signup: (payload: SignupPayload) => Promise<AuthResult>;
  adminLogin: (email: string, password: string) => Promise<AdminLoginResult>;
  logout: () => Promise<void>;
  /** Relit le profil courant (ex. après un changement de mot de passe, pour
   * que must_change_password redescende à false dans le contexte sans avoir
   * à recharger la page). No-op silencieux si non connecté. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(accessToken: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Lu (pas écrit) par refreshUser — une ref plutôt que `accessToken` dans
  // ses dépendances évite de recréer cette fonction à chaque renouvellement
  // de token (accessToken change après chaque refresh silencieux).
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const applyToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setApiAccessToken(token);
  }, []);

  // Au montage : tente un refresh silencieux via la même fonction partagée
  // que apiFetch (src/lib/api-client.ts) — jamais deux appels concurrents à
  // /api/auth/refresh, qui casseraient la rotation de refresh token côté
  // Django (le second utiliserait un token déjà mis en liste noire). Avec
  // REFRESH_TOKEN_LIFETIME à 180 jours, ce refresh silencieux suffit à
  // garder la session active sans repasser par /login dans l'immense
  // majorité des cas (façon Wave).
  useEffect(() => {
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!token) return;
        setAccessToken(token);
        const profile = await fetchProfile(token);
        if (profile) setUser(profile);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (phone: string, pin: string): Promise<LoginResult> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: extractApiError(data, "Connexion échouée"), lockedUntil: data.locked_until };
    }
    return { ok: true };
  }, []);

  const confirmLogin = useCallback(
    async (phone: string, ticket: string): Promise<AuthResult> => {
      const res = await fetch("/api/auth/login/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, ticket }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: extractApiError(data, "Code incorrect") };
      applyToken(data.access);
      setUser(data.profile);
      return { ok: true };
    },
    [applyToken]
  );

  const signup = useCallback(
    async (payload: SignupPayload): Promise<AuthResult> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: extractApiError(data, "Inscription échouée") };
      }
      applyToken(data.access);
      setUser(data.profile);
      return { ok: true };
    },
    [applyToken]
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<AdminLoginResult> => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: extractApiError(data, "Connexion échouée"), lockedUntil: data.locked_until };
      }
      applyToken(data.access);
      setUser(data.profile);
      return { ok: true };
    },
    [applyToken]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  const refreshUser = useCallback(async () => {
    if (!accessTokenRef.current) return;
    const profile = await fetchProfile(accessTokenRef.current);
    if (profile) setUser(profile);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, confirmLogin, signup, adminLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}
