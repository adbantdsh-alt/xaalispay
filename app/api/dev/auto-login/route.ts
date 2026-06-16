import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-local";
import { DEMO_ACCOUNT, isDevAutoLoginEnabled } from "@/lib/demo-account";
import { getDb } from "@/lib/db";

/**
 * GET /api/dev/auto-login?redirect=/dashboard
 * Dev uniquement : connecte automatiquement le compte démo.
 */
export async function GET(request: Request) {
  if (!isDevAutoLoginEnabled()) {
    return NextResponse.json({ error: "Non disponible" }, { status: 403 });
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect") || "/dashboard";

  // Si la base est vide, inviter à seed (évite un dashboard vide)
  const db = await getDb();
  const hasDemo = db.profiles.some((p) => p.id === DEMO_ACCOUNT.id);
  if (!hasDemo) {
    try {
      await fetch(new URL("/api/seed", url.origin), { method: "POST" });
    } catch {
      /* seed best-effort */
    }
  }

  await setSessionCookie(DEMO_ACCOUNT.id, DEMO_ACCOUNT.email);

  return NextResponse.redirect(new URL(redirectTo, url.origin));
}
