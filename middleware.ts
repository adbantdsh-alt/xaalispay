import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/seller/admin" || pathname === "/seller/admin/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Dev : accueil → dashboard démo auto-connecté
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTO_LOGIN !== "false" &&
    (pathname === "/" || pathname === "")
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/api/dev/auto-login";
    loginUrl.searchParams.set("redirect", "/dashboard");
    return NextResponse.redirect(loginUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/seller/admin",
    "/seller/admin/",
    "/dashboard",
    "/dashboard/:path*",
    "/wallet",
    "/wallet/:path*",
    "/create",
    "/create/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/history",
    "/history/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
