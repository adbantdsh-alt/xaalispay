/** Pour les quelques routes Next.js qui doivent rester des proxys internes
 * (ex. upload d'image — encore sur Supabase Storage, voir le plan) plutôt que
 * des appels directs navigateur → Django. Valide le Bearer token en
 * interrogeant Django lui-même : pas de duplication de la vérification JWT
 * (qui demanderait de partager le DJANGO_SECRET_KEY avec ce projet). */
import { getApiBaseUrl } from "./site-url";

export interface DjangoUser {
  id: string | number;
  email: string;
}

export async function getDjangoUserFromRequest(request: Request): Promise<DjangoUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { id: data.id, email: data.email };
  } catch {
    return null;
  }
}
