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
 * deux appels concurrents. Avec ROTATE_REFRESH_TOKENS côté Django, un second
 * appel concurrent utiliserait un refresh token déjà mis en liste noire par
 * le premier et échouerait. */
export async function refreshAccessToken(): Promise<string | null> {
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

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    // Panne réseau réelle (hors-ligne, serveur inatteignable) — fetch() lève
    // une exception ici, contrairement à un échec HTTP normal. On synthétise
    // une Response pour que tous les appelants existants (if (!res.ok) {...})
    // fonctionnent sans modification.
    return new Response(
      JSON.stringify({ error: "Connexion impossible. Vérifiez votre réseau et réessayez." }),
      { status: 0, headers: { "Content-Type": "application/json" } }
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
