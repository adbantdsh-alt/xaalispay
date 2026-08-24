import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CONNECT_PORTAL_REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { getApiBaseUrl } from "@/lib/site-url";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(CONNECT_PORTAL_REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/connect/portal/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // best effort — la suppression du cookie local suffit côté UX
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CONNECT_PORTAL_REFRESH_COOKIE_NAME);
  return response;
}
