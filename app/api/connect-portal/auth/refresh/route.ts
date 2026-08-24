import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CONNECT_PORTAL_REFRESH_COOKIE_NAME, REFRESH_COOKIE_MAX_AGE } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Lit le refresh token portail dans son cookie httpOnly dédié, échange
 * contre un nouveau couple Django (rotation active, voir SIMPLE_JWT), repose
 * le nouveau refresh en cookie. Miroir de app/api/auth/refresh/route.ts,
 * jamais le même cookie. */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(CONNECT_PORTAL_REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(`${getApiBaseUrl()}/api/v1/connect/portal/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const response = NextResponse.json({ error: "Session expirée" }, { status: 401 });
    response.cookies.delete(CONNECT_PORTAL_REFRESH_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.json({ access: data.access });
  if (data.refresh) {
    response.cookies.set(CONNECT_PORTAL_REFRESH_COOKIE_NAME, data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
  return response;
}
