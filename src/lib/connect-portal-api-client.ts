import { getApiBaseUrl } from "./site-url";

/** Miroir de src/lib/api-client.ts, mais pour la session du portail Connect
 * — module SÉPARÉ avec sa propre variable de token en mémoire, jamais
 * partagée avec currentAccessToken (api-client.ts) : un même navigateur peut
 * avoir une session vendeur/admin ET une session portail ouvertes dans deux
 * onglets différents, sans que l'une n'écrase le token de l'autre. */
let currentPortalAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setPortalApiAccessToken(token: string | null) {
  currentPortalAccessToken = token;
}

export function getPortalApiAccessToken(): string | null {
  return currentPortalAccessToken;
}

export async function refreshPortalAccessToken(): Promise<string | null> {
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
      const res = await fetch("/api/connect-portal/auth/refresh", { method: "POST" });
      if (!res.ok) {
        currentPortalAccessToken = null;
        return null;
      }
      const data = await res.json();
      currentPortalAccessToken = data.access as string;
      return currentPortalAccessToken;
    } catch {
      currentPortalAccessToken = null;
      return null;
    }
  };
  // Même verrou inter-onglets que api-client.ts (voir son commentaire) — sous
  // un nom de verrou distinct pour ne jamais se sérialiser avec un refresh
  // vendeur/admin concurrent, qui n'a rien à voir.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("xaalispay-connect-portal-refresh-token", doFetch);
  }
  return doFetch();
}

/** Appelle directement l'API Django Connect portail. Rejoue UNE fois après
 * un refresh automatique sur 401 — même contrat que apiFetch. */
export async function portalApiFetch(
  path: string,
  init: RequestInit = {},
  _retried = false
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (currentPortalAccessToken) {
    headers.set("Authorization", `Bearer ${currentPortalAccessToken}`);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    return new Response(
      JSON.stringify({ error: "Connexion impossible. Vérifiez votre réseau et réessayez." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (response.status === 401 && !_retried) {
    const newToken = await refreshPortalAccessToken();
    if (newToken) {
      return portalApiFetch(path, init, true);
    }
  }

  return response;
}
