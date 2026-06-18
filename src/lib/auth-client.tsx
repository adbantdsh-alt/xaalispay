"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getApiBaseUrl } from "./site-url";
import { setApiAccessToken } from "./api-client";

export interface Profile {
  id: number;
  email: string;
  username: string;
  display_name: string;
  business_name: string;
  phone: string;
  role: "seller" | "super_admin";
  email_verified_at: string | null;
  [key: string]: unknown;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface SignupPayload {
  email: string;
  password: string;
  username: string;
  display_name: string;
  business_name: string;
  phone?: string;
}

interface AuthContextValue {
  user: Profile | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (payload: SignupPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
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

  const applyToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setApiAccessToken(token);
  }, []);

  // Au montage : tente un refresh silencieux. Si le cookie httpOnly est
  // présent et valide, ça restaure la session sans repasser par le formulaire.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        applyToken(data.access);
        const profile = await fetchProfile(data.access);
        if (profile) setUser(profile);
      } finally {
        setLoading(false);
      }
    })();
  }, [applyToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || "Connexion échouée" };
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
        const message =
          data.error ||
          (typeof data === "object" ? Object.values(data).flat()[0] : null) ||
          "Inscription échouée";
        return { ok: false, error: String(message) };
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

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  return ctx;
}
