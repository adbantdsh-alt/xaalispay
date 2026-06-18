import { getApiBaseUrl } from "./site-url";

/** Access token courant — en mémoire seulement (jamais localStorage/cookie),
 * tenu synchronisé par AuthProvider (src/lib/auth-client.tsx) à chaque
 * login/signup/refresh/logout. Module à part de React pour rester utilisable
 * depuis n'importe quel code (pas seulement des composants). */
let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getApiAccessToken(): string | null {
  return currentAccessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          currentAccessToken = null;
          return null;
        }
        const data = await res.json();
        currentAccessToken = data.access as string;
        return currentAccessToken;
      })
      .catch(() => {
        currentAccessToken = null;
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Appelle directement l'API Django (jamais via un proxy Next.js, sauf
 * login/signup/refresh/logout — voir la décision d'architecture hybride).
 * Rejoue UNE fois la requête après un refresh automatique sur 401. */
export async function apiFetch(path: string, init: RequestInit = {}, _retried = false): Promise<Response> {
  const headers = new Headers(init.headers);
  if (currentAccessToken) {
    headers.set("Authorization", `Bearer ${currentAccessToken}`);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });

  if (response.status === 401 && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, init, true);
    }
  }

  return response;
}
