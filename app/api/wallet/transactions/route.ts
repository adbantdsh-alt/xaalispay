import { NextResponse } from "next/server";
import { getSellerTransactions } from "@/lib/seller-ledger";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const transactions = await getSellerTransactions(user.id);
  return NextResponse.json({ transactions });
}
