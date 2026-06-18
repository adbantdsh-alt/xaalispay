import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { isProtectedSellerPath } from "@/lib/demo-account";

/** Vérification "molle" : la présence du cookie refresh httpOnly suffit pour
 * laisser passer la navigation (pas de flash de contenu protégé pour un
 * visiteur évidemment déconnecté). La vraie autorisation se fait à chaque
 * appel API côté Django (IsAuthenticated) — ce middleware n'est qu'un confort
 * de navigation, jamais la frontière de sécurité réelle. */
export async function updateSession(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);

  if (!hasSession && isProtectedSellerPath(request.nextUrl.pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth";
    redirect.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
}
