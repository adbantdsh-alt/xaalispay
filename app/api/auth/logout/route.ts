import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth-local";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ success: true });
}
