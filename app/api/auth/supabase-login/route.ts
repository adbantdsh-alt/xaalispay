import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/auth-policy";
import { ensureSupabaseLoginAllowed } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not verified")) {
        await ensureSupabaseLoginAllowed(email);
        const retry = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Connexion échouée" },
        { status: 401 }
      );
    }

    if (data.user.email && isSuperAdminEmail(data.user.email)) {
      await ensureSupabaseLoginAllowed(data.user.email);
    }

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      isSuperAdmin: isSuperAdminEmail(data.user.email),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
