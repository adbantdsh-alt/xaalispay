import { NextResponse } from "next/server";
import { isMaintenanceAuthorized } from "@/lib/maintenance-auth";
import { processOrderMaintenance } from "@/lib/orders";
import { processAutomaticPayouts } from "@/lib/payouts";
import { getDb } from "@/lib/db";
import { syncDatabaseToRelational } from "@/lib/relational-store";
import { reconcilePendingOrders } from "@/lib/admin-ops";
import { isRelationalDualWriteEnabled } from "@/lib/runtime-env";

async function runMaintenance() {
  await processOrderMaintenance();
  const payouts = await processAutomaticPayouts();
  const reconcile = await reconcilePendingOrders();

  let relational: { ok: boolean; errors?: string[] } | null = null;
  if (isRelationalDualWriteEnabled()) {
    const db = await getDb();
    const sync = await syncDatabaseToRelational(db);
    relational = { ok: sync.ok, errors: sync.errors.length ? sync.errors : undefined };
  }

  return NextResponse.json({ success: true, payouts, reconcile, relational });
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
