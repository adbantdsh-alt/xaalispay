import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { adminGlobalSearch } from "@/lib/admin-ops";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const q = request.nextUrl.searchParams.get("q") || "";
  const hits = await adminGlobalSearch(q);
  return NextResponse.json({ hits });
}
