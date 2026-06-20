import { NextResponse } from "next/server";
import { REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Étape 2/2 de la connexion : consomme le ticket OTP, reçoit les tokens.
 * Seule cette route (avec signup) voit le refresh token en clair, qui repart
 * immédiatement en cookie httpOnly. */
export async function POST(request: Request) {
  const body = await request.text();
  const apiBaseUrl = getApiBaseUrl();

  const tokenRes = await fetch(`${apiBaseUrl}/api/auth/login/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const tokenData = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: tokenRes.status });
  }

  const meRes = await fetch(`${apiBaseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenData.access}` },
  });
  const profile = meRes.ok ? await meRes.json() : null;

  const response = NextResponse.json({ access: tokenData.access, profile });
  response.cookies.set(REFRESH_COOKIE_NAME, tokenData.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return response;
}
