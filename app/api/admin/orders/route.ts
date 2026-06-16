import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getAdminOrders } from "@/lib/admin-stats";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const orders = await getAdminOrders();
  return NextResponse.json({ orders });
}
