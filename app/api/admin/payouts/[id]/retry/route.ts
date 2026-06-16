import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { retryFailedPayout } from "@/lib/payouts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await retryFailedPayout(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    payout: result.payout,
  });
}
