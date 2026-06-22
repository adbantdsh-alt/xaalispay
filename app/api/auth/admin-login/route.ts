import { NextResponse } from "next/server";
import { REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Connexion admin (email + mot de passe, jamais d'OTP) — seule cette route
 * (avec login/confirm et signup) voit le refresh token en clair, qui repart
 * immédiatement en cookie httpOnly. Distincte de login/confirm : flux admin
 * à une seule étape, pas de ticket OTP intermédiaire. */
export async function POST(request: Request) {
  const body = await request.text();
  const apiBaseUrl = getApiBaseUrl();

  const tokenRes = await fetch(`${apiBaseUrl}/api/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const tokenData = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: tokenRes.status });
  }

  const response = NextResponse.json({ access: tokenData.access, profile: tokenData.profile });
  response.cookies.set(REFRESH_COOKIE_NAME, tokenData.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return response;
}
