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

/** Exporté pour qu'AuthProvider l'utilise aussi à son montage (tentative de
 * session silencieuse) — un seul point d'appel à /api/auth/refresh, jamais
 * deux appels concurrents au sein d'un même onglet. Avec ROTATE_REFRESH_TOKENS
 * côté Django, un second appel concurrent utiliserait un refresh token déjà
 * mis en liste noire par le premier et échouerait. */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function runRefresh(): Promise<string | null> {
  const doFetch = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        currentAccessToken = null;
        return null;
      }
      const data = await res.json();
      currentAccessToken = data.access as string;
      return currentAccessToken;
    } catch {
      currentAccessToken = null;
      return null;
    }
  };
  // navigator.locks : sérialise l'appel /api/auth/refresh entre TOUS les
  // onglets du même navigateur (ils partagent le cookie xp_refresh). Sans ce
  // verrou, deux onglets qui rafraîchissent en même temps déclenchent une
  // rotation Django (ROTATE_REFRESH_TOKENS) où le perdant reçoit un token
  // déjà mis en liste noire (401) — ce qui supprime le cookie côté proxy et
  // casse la session pour tous les onglets, même si l'autre a réussi.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("xaalispay-refresh-token", doFetch);
  }
  return doFetch();
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

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    // Panne réseau réelle (hors-ligne, serveur inatteignable, CORS) — fetch()
    // lève une exception ici, contrairement à un échec HTTP normal. On
    // synthétise une Response pour que tous les appelants existants
    // (if (!res.ok) {...}) fonctionnent sans modification. status: 503 et non
    // 0 — le constructeur Response interdit status: 0 (RangeError), même si
    // une vraie réponse réseau opaque peut légitimement l'avoir.
    return new Response(
      JSON.stringify({ error: "Connexion impossible. Vérifiez votre réseau et réessayez." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (response.status === 401 && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, init, true);
    }
  }

  return response;
}

/** DRF renvoie soit {error: "..."} (nos vues maison), soit {champ: ["..."]}
 * (erreurs de validation de serializer par défaut) — un seul point pour
 * extraire un message affichable, peu importe la forme. */
export function extractApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.detail === "string") return obj.detail;
  const firstField = Object.values(obj)[0];
  if (Array.isArray(firstField) && typeof firstField[0] === "string") return firstField[0];
  if (typeof firstField === "string") return firstField;
  return fallback;
}
