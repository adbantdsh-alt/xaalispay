import { NextResponse } from "next/server";
import { isMaintenanceAuthorized } from "@/lib/maintenance-auth";
import { processOrderMaintenance } from "@/lib/orders";
import { processAutomaticPayouts } from "@/lib/payouts";

async function runMaintenance() {
  await processOrderMaintenance();
  const payouts = await processAutomaticPayouts();
  return NextResponse.json({ success: true, payouts });
}

export async function GET(request: Request) {
  if (!isMaintenanceAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return runMaintenance();
}

export async function POST(request: Request) {
  if (!isMaintenanceAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return runMaintenance();
}
