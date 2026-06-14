import { getLocalSessionUser } from "./auth-local";
import { createClient } from "./supabase/server";

export function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getSessionUser() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return { id: user.id, email: user.email || "" };
    } catch {
      // fallback local ci-dessous
    }
  }

  return getLocalSessionUser();
}
