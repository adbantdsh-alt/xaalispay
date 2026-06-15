import { getDb, updateDb } from "./db";
import { debitAvailableForPayout } from "./ledger";
import { getWalletData } from "./orders";
import type { Payout, Profile } from "./types";

const DEFAULT_DAILY_LIMIT = 100_000;

function countCompletedOrders(profile: Profile, db: Awaited<ReturnType<typeof getDb>>) {
  return db.orders.filter(
    (order) => order.sellerId === profile.id && order.status === "released"
  ).length;
}

function hasActiveDispute(profile: Profile, db: Awaited<ReturnType<typeof getDb>>) {
  return db.orders.some(
    (order) => order.sellerId === profile.id && order.status === "dispute"
  );
}

function paidOutToday(profile: Profile, db: Awaited<ReturnType<typeof getDb>>) {
  const today = new Date().toISOString().slice(0, 10);
  return db.payouts
    .filter(
      (payout) =>
        payout.sellerId === profile.id &&
        payout.createdAt.slice(0, 10) === today &&
        payout.status !== "failed"
    )
    .reduce((sum, payout) => sum + payout.amount, 0);
}

function getAutomaticPayoutAmount(profile: Profile, available: number) {
  const minAmount = profile.autoPayoutMinAmount || 5000;
  if (available < minAmount) return 0;

  if (profile.autoPayoutMode === "fixed_amount") {
    const fixedAmount = profile.autoPayoutFixedAmount || minAmount;
    if (available < fixedAmount) return 0;
    return fixedAmount;
  }

  return available;
}

export async function createPayoutRequest({
  sellerId,
  amount,
  method,
  phone,
  automatic = false,
}: {
  sellerId: string;
  amount: number;
  method: "wave" | "orange";
  phone: string;
  automatic?: boolean;
}): Promise<{ ok: boolean; payout?: Payout; message: string }> {
  if (amount <= 0) return { ok: false, message: "Montant invalide" };

  const wallet = await getWalletData(sellerId);
  if (amount > wallet.available) {
    return { ok: false, message: "Solde disponible insuffisant" };
  }

  let created: Payout | undefined;
  const now = new Date().toISOString();
  await updateDb((db) => {
    const payout: Payout = {
      id: crypto.randomUUID(),
      sellerId,
      amount,
      method,
      phone,
      status: "pending",
      provider: "bictorys",
      createdAt: now,
      updatedAt: now,
    };
    db.payouts.push(payout);
    debitAvailableForPayout(db, payout);
    created = payout;
  });

  return {
    ok: true,
    payout: created,
    message: automatic
      ? "Retrait automatique enregistré."
      : "Demande de retrait enregistrée.",
  };
}

export async function processAutomaticPayouts() {
  const db = await getDb();
  const candidates = db.profiles.filter(
    (profile) =>
      profile.autoPayoutEnabled &&
      profile.payoutMethod &&
      profile.payoutPhone &&
      profile.emailVerifiedAt
  );
  const results: Array<{ sellerId: string; payoutId?: string; skipped?: string }> = [];

  for (const profile of candidates) {
    const wallet = await getWalletData(profile.id);
    const minOrders = profile.autoPayoutMinCompletedOrders || 3;
    const payoutAmount = getAutomaticPayoutAmount(profile, wallet.available);

    if (payoutAmount <= 0) {
      results.push({ sellerId: profile.id, skipped: "below_min_amount" });
      continue;
    }
    if (countCompletedOrders(profile, db) < minOrders) {
      results.push({ sellerId: profile.id, skipped: "below_min_orders" });
      continue;
    }
    if (hasActiveDispute(profile, db)) {
      results.push({ sellerId: profile.id, skipped: "active_dispute" });
      continue;
    }
    if (paidOutToday(profile, db) + payoutAmount > DEFAULT_DAILY_LIMIT) {
      results.push({ sellerId: profile.id, skipped: "daily_limit" });
      continue;
    }

    const result = await createPayoutRequest({
      sellerId: profile.id,
      amount: payoutAmount,
      method: profile.payoutMethod!,
      phone: profile.payoutPhone!,
      automatic: true,
    });
    results.push({
      sellerId: profile.id,
      payoutId: result.payout?.id,
      skipped: result.ok ? undefined : result.message,
    });
  }

  return results;
}
