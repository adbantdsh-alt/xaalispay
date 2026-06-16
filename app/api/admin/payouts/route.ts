import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminPayouts } from "@/lib/admin-stats";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const payouts = await getAdminPayouts();
  return NextResponse.json({ payouts });
}
