import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminDisputes } from "@/lib/admin-stats";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const disputes = await getAdminDisputes();
  return NextResponse.json({ disputes });
}
