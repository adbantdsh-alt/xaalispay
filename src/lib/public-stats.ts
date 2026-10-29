import { getApiBaseUrl } from "@/lib/site-url";

export type PublicStats = {
  /** Vendeurs actifs arrondis au palier de 50 inférieur côté backend
   * (312 -> 300) ; null sous le premier palier. */
  sellers: number | null;
};

/** Compteurs publics de la landing — revalidés toutes les 10 min (le backend
 * met aussi en cache). Jamais bloquant : backend injoignable -> rien affiché. */
export async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/public/stats/`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { sellers: null };
    const data = await res.json();
    return { sellers: typeof data.sellers === "number" ? data.sellers : null };
  } catch {
    return { sellers: null };
  }
}
