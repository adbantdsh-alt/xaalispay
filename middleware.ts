import { type NextRequest, NextResponse } from "next/server";
import { redirectIfLoggedOut } from "@/lib/auth-middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/seller/admin" || pathname === "/seller/admin/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return redirectIfLoggedOut(request);
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
