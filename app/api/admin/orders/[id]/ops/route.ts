import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { adminExpireOrder, adminReconcileOrder } from "@/lib/admin-ops";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const adminEmail = auth.user.email;

  if (body.action === "expire") {
    const slug = await adminExpireOrder(id, adminEmail);
    if (!slug) {
      return NextResponse.json({ error: "Commande non éligible" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, slug });
  }

  const result = await adminReconcileOrder(id, adminEmail);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, order: result.order });
}
