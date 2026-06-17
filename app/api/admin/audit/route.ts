import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminAuditLog } from "@/lib/admin-audit";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const log = await getAdminAuditLog(80);
  return NextResponse.json({ log });
}
