import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { resetPlatformData } from "@/lib/admin-ops";
import { invalidateDbCache } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth-local";

const CONFIRM_SOFT = "XAALISPAY-RESET";
const CONFIRM_WIPE_ALL = "XAALISPAY-WIPE-ALL";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    confirm?: string;
    wipeAccounts?: boolean;
  };

  const wipeAccounts =
    body.confirm === CONFIRM_WIPE_ALL || body.wipeAccounts === true;

  if (body.confirm !== CONFIRM_WIPE_ALL && body.confirm !== CONFIRM_SOFT) {
    return NextResponse.json(
      {
        error: `Confirmation requise. Wipe complet : "${CONFIRM_WIPE_ALL}" · Données seules : "${CONFIRM_SOFT}"`,
      },
      { status: 400 }
    );
  }

  const summary = await resetPlatformData(auth.user.email, { wipeAccounts });
  invalidateDbCache();

  const response = NextResponse.json({
    ok: true,
    message: wipeAccounts
      ? "Wipe complet : plateforme vide. Recréez un compte sur /auth."
      : "Données effacées. Comptes conservés.",
    summary,
    loggedOut: wipeAccounts,
  });

  if (wipeAccounts) {
    await clearSessionCookie();
  }

  return response;
}
