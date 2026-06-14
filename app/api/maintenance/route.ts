import { NextResponse } from "next/server";
import { processOrderMaintenance } from "@/lib/orders";

export async function POST() {
  processOrderMaintenance();
  return NextResponse.json({ success: true });
}
