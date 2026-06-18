import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REFRESH_COOKIE_MAX_AGE, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

/** Lit le refresh token dans le cookie httpOnly (jamais exposé au JS client),
 * échange contre un nouveau couple Django, repose le nouveau refresh en
 * cookie (rotation activée côté Django : ROTATE_REFRESH_TOKENS=True). */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const response = NextResponse.json({ error: "Session expirée" }, { status: 401 });
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.json({ access: data.access });
  if (data.refresh) {
    response.cookies.set(REFRESH_COOKIE_NAME, data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  }
  return response;
}
