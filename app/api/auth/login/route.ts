import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/site-url";

/** Étape 1/2 de la connexion : phone+PIN. Ne pose jamais de cookie ici — sur
 * succès, Django répond {otp_sent: true} sans aucun token (voir
 * apps.accounts.views.LoginView côté backend) ; le cookie n'est posé qu'à
 * /api/auth/login/confirm une fois l'OTP vérifié. */
export async function POST(request: Request) {
  const body = await request.text();
  const apiBaseUrl = getApiBaseUrl();

  const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
