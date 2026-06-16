import { NextResponse } from "next/server";
import { getSellerPayouts } from "@/lib/payouts";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const payouts = await getSellerPayouts(user.id);
  return NextResponse.json({ payouts });
}
