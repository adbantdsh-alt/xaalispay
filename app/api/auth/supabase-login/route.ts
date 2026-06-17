import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-local";
import { isSuperAdminEmail, SUPER_ADMIN_EMAIL } from "@/lib/auth-policy";
import { ensureSuperAdminProfile } from "@/lib/profile-access";
import {
  ensureSupabaseLoginAllowed,
  repairSuperAdminSupabaseAccount,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeLoginError(message: string, email: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid login credentials") || msg.includes("introuvable")) {
    return isSuperAdminEmail(email)
      ? `Compte super admin introuvable dans Supabase. Réessayez ou contactez le support. Email attendu : ${SUPER_ADMIN_EMAIL}`
      : "Email ou mot de passe incorrect";
  }
  return message;
}

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
      await repairSuperAdminSupabaseAccount(cleanEmail, password);
    }

    const supabase = await createClient();
    let { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("not verified")) {
        await ensureSupabaseLoginAllowed(cleanEmail);
        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        data = retry.data;
        error = retry.error;
      } else if (
        isSuperAdminEmail(cleanEmail) &&
        (msg.includes("invalid login credentials") || msg.includes("introuvable"))
      ) {
        await repairSuperAdminSupabaseAccount(cleanEmail, password);
        const retry = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        data = retry.data;
        error = retry.error;
      }
    }

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: normalizeLoginError(error?.message || "Connexion échouée", cleanEmail),
        },
        { status: 401 }
      );
    }

    if (data.user.email && isSuperAdminEmail(data.user.email)) {
      await ensureSupabaseLoginAllowed(data.user.email);
      const profile = await ensureSuperAdminProfile(data.user.id, data.user.email);
      await setSessionCookie(data.user.id, data.user.email);
      return NextResponse.json({
        user: { id: data.user.id, email: data.user.email },
        isSuperAdmin: true,
        profile: profile
          ? { username: profile.username, displayName: profile.displayName }
          : undefined,
      });
    }

    await setSessionCookie(data.user.id, data.user.email || "");

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      isSuperAdmin: false,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
