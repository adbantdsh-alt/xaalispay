import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/seller/admin" || pathname === "/seller/admin/") {
    return NextResponse.redirect(new URL("/admin", request.url));
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
    "/api/dashboard",
    "/api/dashboard/:path*",
    "/api/wallet/:path*",
    "/api/products",
    "/api/products/:path*",
    "/api/auth/profile",
    "/api/auth/profile/:path*",
    "/api/admin/:path*",
    "/api/delivery/:path*",
  ],
};
