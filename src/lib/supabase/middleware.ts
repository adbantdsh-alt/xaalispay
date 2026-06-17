import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_NAME,
  createSessionToken,
  SESSION_MAX_AGE_SEC,
  verifySessionToken,
} from "@/lib/auth-local";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isDevAutoLoginEnabled, isProtectedSellerPath } from "@/lib/demo-account";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let userId: string | null = null;
  let userEmail: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id || session?.user?.id || null;
    userEmail = user?.email || session?.user?.email || null;

    if (userId && userEmail && !request.cookies.get(COOKIE_NAME)?.value) {
      const token = await createSessionToken(userId, userEmail);
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SEC,
      });
    }
  }

  if (!userId) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const local = await verifySessionToken(token);
      userId = local?.id || null;
    }
  }

  if (!userId && isProtectedSellerPath(request.nextUrl.pathname)) {
    if (isDevAutoLoginEnabled()) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/api/dev/auto-login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth";
    redirect.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  // En dev : /auth → dashboard auto-connecté
  if (
    isDevAutoLoginEnabled() &&
    !userId &&
    (request.nextUrl.pathname === "/auth" || request.nextUrl.pathname === "/auth/")
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/api/dev/auto-login";
    loginUrl.searchParams.set(
      "redirect",
      request.nextUrl.searchParams.get("redirect") || "/dashboard"
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
