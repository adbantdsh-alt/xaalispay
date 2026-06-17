import { getLocalSessionUser, setSessionCookie } from "./auth-local";
import { createClient } from "./supabase/server";

export function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSessionUser() {
  const local = await getLocalSessionUser();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        // Cookie local 30 j — filet de sécurité si le JWT Supabase expire (~1 h)
        if (!local || local.id !== user.id) {
          await setSessionCookie(user.id, user.email || "");
        }
        return { id: user.id, email: user.email || "" };
      }
    } catch {
      // fallback cookie local ci-dessous
    }
  }

  return local;
}
