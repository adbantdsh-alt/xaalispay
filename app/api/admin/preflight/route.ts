import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getPilotPreflightReport } from "@/lib/pilot-preflight";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const report = await getPilotPreflightReport();
  return NextResponse.json(report);
}
