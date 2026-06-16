import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminOverview } from "@/lib/admin-stats";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
