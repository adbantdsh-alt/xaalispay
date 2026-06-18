import { NextResponse } from "next/server";
import { getSellerTransactions } from "@/lib/seller-ledger";
import { getSellerPayouts } from "@/lib/payouts";
import { getSessionUser } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = await getDb();
  const [transactions, payouts] = await Promise.all([
    getSellerTransactions(user.id, 50, db),
    getSellerPayouts(user.id, 30, db),
  ]);

  return NextResponse.json({ transactions, payouts });
}
