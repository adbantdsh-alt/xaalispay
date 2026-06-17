import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { buildAdminAlertsFromDb } from "@/lib/admin-ops";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const alerts = await buildAdminAlertsFromDb();
  return NextResponse.json({ alerts });
}
