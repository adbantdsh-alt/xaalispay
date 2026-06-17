import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { resetPlatformData } from "@/lib/admin-ops";
import { invalidateDbCache } from "@/lib/db";

const CONFIRM_PHRASE = "XAALISPAY-RESET";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        error: `Confirmation requise. Envoyez { "confirm": "${CONFIRM_PHRASE}" }`,
      },
      { status: 400 }
    );
  }

  const summary = await resetPlatformData(auth.user.email);
  invalidateDbCache();

  return NextResponse.json({
    ok: true,
    message: "Plateforme remise à zéro. Comptes conservés, données transactionnelles effacées.",
    summary,
  });
}
