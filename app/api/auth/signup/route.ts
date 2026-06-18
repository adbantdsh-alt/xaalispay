import { NextResponse } from "next/server";
import { REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Proxy vers Django : seule cette route voit le refresh token en clair, qui
 * repart immédiatement en cookie httpOnly — jamais dans le corps JSON renvoyé
 * au client (voir la décision d'architecture hybride dans le plan). */
export async function POST(request: Request) {
  const body = await request.text();

  const djangoRes = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await djangoRes.json().catch(() => ({}));

  if (!djangoRes.ok) {
    return NextResponse.json(data, { status: djangoRes.status });
  }

  const response = NextResponse.json(
    { access: data.access, profile: data.profile },
    { status: 201 }
  );
  response.cookies.set(REFRESH_COOKIE_NAME, data.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return response;
}
