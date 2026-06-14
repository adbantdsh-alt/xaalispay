export function isWithdrawApiConnected(): boolean {
  return !!(
    process.env.PAYMENT_WITHDRAW_API_URL?.trim() ||
    process.env.PAYMENTS_API_ENABLED === "true"
  );
}

export interface WithdrawRequest {
  sellerId: string;
  amount: number;
  method: "wave" | "orange";
  phone: string;
}

export interface WithdrawResult {
  ok: boolean;
  status: "completed" | "queued" | "failed";
  message: string;
  reference?: string;
}

export async function processWithdrawal(
  request: WithdrawRequest
): Promise<WithdrawResult> {
  if (!isWithdrawApiConnected()) {
    return {
      ok: true,
      status: "queued",
      message:
        "Demande enregistrée. Branchez l'API de paiement (PAYMENT_WITHDRAW_API_URL) pour activer les virements automatiques.",
      reference: `XP-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  // Point d'intégration API Wave / Orange Money
  const apiUrl = process.env.PAYMENT_WITHDRAW_API_URL!.trim();
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId: request.sellerId,
        amount: request.amount,
        method: request.method,
        phone: request.phone,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: "failed",
        message: (data as { error?: string }).error || "Retrait impossible",
      };
    }
    return {
      ok: true,
      status: "completed",
      message: "Retrait envoyé vers votre compte mobile money.",
      reference: (data as { reference?: string }).reference,
    };
  } catch {
    return {
      ok: false,
      status: "failed",
      message: "Erreur de connexion à l'API de paiement",
    };
  }
}
