import { NextResponse } from "next/server";
import { getWalletData } from "@/lib/orders";
import { isMobileMoneyMethod } from "@/lib/payment-methods";
import { toBictorysPayoutPhone } from "@/lib/bictorys";
import { getSessionUser } from "@/lib/session";
import { createPayoutRequest } from "@/lib/payouts";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { amount, method, phone } = await request.json();
    const parsedAmount = Number(amount);
    const cleanPhone = toBictorysPayoutPhone(String(phone || ""));

    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    if (!method || !isMobileMoneyMethod(method)) {
      return NextResponse.json(
        { error: "Choisissez Wave ou Orange Money" },
        { status: 400 }
      );
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });
    }

    const wallet = await getWalletData(user.id);
    if (parsedAmount > wallet.available) {
      return NextResponse.json(
        { error: "Solde insuffisant" },
        { status: 400 }
      );
    }

    const result = await createPayoutRequest({
      sellerId: user.id,
      amount: parsedAmount,
      method,
      phone: cleanPhone,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      status: result.payout?.status || "pending",
      message: result.message,
      reference: result.payout?.id,
      fee: result.fee,
      netAmount: result.netAmount,
      apiConnected: result.payout?.providerId ? true : result.payout?.status !== "failed",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
