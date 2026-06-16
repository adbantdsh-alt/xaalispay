import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/wallet",
    "/wallet/:path*",
    "/create",
    "/create/:path*",
    "/profile",
    "/profile/:path*",
    "/history",
    "/history/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
