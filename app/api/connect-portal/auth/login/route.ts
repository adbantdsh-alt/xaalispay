import { NextResponse } from "next/server";
import { CONNECT_PORTAL_REFRESH_COOKIE_NAME, REFRESH_COOKIE_MAX_AGE } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Connexion portail Connect (email + mot de passe) — seule cette route voit
 * le refresh token portail en clair, qui repart immédiatement en cookie
 * httpOnly DISTINCT de celui de l'app native (voir auth-cookies.ts). */
export async function POST(request: Request) {
  const body = await request.text();
  const apiBaseUrl = getApiBaseUrl();

  const tokenRes = await fetch(`${apiBaseUrl}/api/v1/connect/portal/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const tokenData = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok) {
    return NextResponse.json(tokenData, { status: tokenRes.status });
  }

  const response = NextResponse.json({ access: tokenData.access, user: tokenData.user });
  response.cookies.set(CONNECT_PORTAL_REFRESH_COOKIE_NAME, tokenData.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return response;
}
