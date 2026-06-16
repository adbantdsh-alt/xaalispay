import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getPilotDashboard } from "@/lib/pilot-metrics";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const pilot = await getPilotDashboard();
  return NextResponse.json({ pilot });
}
