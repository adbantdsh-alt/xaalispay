import { NextResponse } from "next/server";
import { processOrderMaintenance } from "@/lib/orders";
import { processAutomaticPayouts } from "@/lib/payouts";

async function runMaintenance() {
  await processOrderMaintenance();
  const payouts = await processAutomaticPayouts();
  return NextResponse.json({ success: true, payouts });
}

export async function GET() {
  return runMaintenance();
}

export async function POST() {
  return runMaintenance();
}
