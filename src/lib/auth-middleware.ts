import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { isProtectedSellerPath } from "@/lib/demo-account";

/** Vérification "molle" : la présence du cookie refresh httpOnly suffit pour
 * laisser passer la navigation (pas de flash de contenu protégé pour un
 * visiteur évidemment déconnecté). La vraie autorisation se fait à chaque
 * appel API côté Django (IsAuthenticated) — ce middleware n'est qu'un confort
 * de navigation, jamais la frontière de sécurité réelle. */
export async function redirectIfLoggedOut(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);

  // Utilisateur déjà connecté sur la landing → dashboard
  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // /admin/login doit toujours rester accessible sans session, sinon
  // isProtectedSellerPath (qui matche tout /admin*) créerait une boucle de
  // redirection infinie pour un visiteur non connecté.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!hasSession && isProtectedSellerPath(pathname)) {
    const redirect = request.nextUrl.clone();
    // Page de connexion dédiée pour /admin (email + mot de passe, jamais
    // d'OTP) — distincte du flux vendeur /auth (téléphone + PIN + OTP).
    redirect.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/auth";
    redirect.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirect);
  }

  return NextResponse.next();
}
