import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { reconcilePendingOrders, expireStalePendingOrders } from "@/lib/admin-ops";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const adminEmail = auth.user.email;

  if (body.action === "expire_stale") {
    const result = await expireStalePendingOrders(adminEmail);
    return NextResponse.json({ ok: true, ...result });
  }

  const result = await reconcilePendingOrders(adminEmail);
  return NextResponse.json({ ok: true, ...result });
}
