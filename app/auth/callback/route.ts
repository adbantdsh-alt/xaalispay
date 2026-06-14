import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markProfileEmailVerified } from "@/lib/profile-access";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const siteUrl = getSiteUrl();

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      markProfileEmailVerified(data.user.id);
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${siteUrl}${safeNext}?verified=1`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/auth?error=confirmation`);
}
