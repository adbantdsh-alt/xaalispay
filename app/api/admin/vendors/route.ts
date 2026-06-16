import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminVendors } from "@/lib/admin-stats";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const vendors = await getAdminVendors();
  return NextResponse.json({ vendors });
}
