import { NextResponse } from "next/server";
import { isSuperAdminEmail } from "@/lib/auth-policy";
import { ensureSuperAdminProfile } from "@/lib/profile-access";
import { confirmSupabaseUser, repairSuperAdminSupabaseAccount } from "@/lib/supabase/admin";
import { buildAuthCallbackUrl } from "@/lib/site-url";
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

    const cleanEmail = email.trim().toLowerCase();

    if (isSuperAdminEmail(cleanEmail)) {
      const userId = await repairSuperAdminSupabaseAccount(cleanEmail, password);
      if (userId) {
        await ensureSuperAdminProfile(userId, cleanEmail);
        const supabase = await createClient();
        const login = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (login.data.user) {
          return NextResponse.json({
            user: { id: login.data.user.id, email: login.data.user.email },
            isSuperAdmin: true,
            needsEmailVerification: false,
          });
        }
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl("/dashboard"),
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Inscription échouée" },
        { status: 400 }
      );
    }

    await confirmSupabaseUser(data.user.id);
    await ensureSuperAdminProfile(data.user.id, data.user.email);

    let session = data.session;
    if (!session) {
      const login = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      session = login.data.session;
      if (login.error && !session) {
        return NextResponse.json(
          { error: login.error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      isSuperAdmin: isSuperAdminEmail(data.user.email),
      needsEmailVerification: !isSuperAdminEmail(data.user.email),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
