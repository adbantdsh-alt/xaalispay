import { getDb, updateDb } from "./db";
import { createBictorysPayout } from "./bictorys";
import { calculatePayoutFee, getPayoutNetAmount } from "./fees";
import { debitAvailableForPayout, reverseFailedPayout } from "./ledger";
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

function normalizePayoutStatus(status?: string): Payout["status"] {
  const clean = (status || "").toLowerCase();
  if (clean.includes("success") || clean.includes("complete") || clean === "paid") return "success";
  if (clean.includes("fail") || clean.includes("error") || clean.includes("cancel")) return "failed";
  return "processing";
}

export async function updatePayoutFromProvider({
  reference,
  providerId,
  status,
  message,
}: {
  reference?: string | null;
  providerId?: string;
  status?: string;
  message?: string;
}): Promise<Payout | null> {
  let updated: Payout | null = null;
  const nextStatus = normalizePayoutStatus(status);
  const now = new Date().toISOString();

  await updateDb((db) => {
    const payout = db.payouts.find(
      (item) =>
        item.id === reference ||
        item.providerId === reference ||
        (providerId && item.providerId === providerId)
    );
    if (!payout) return;

    const wasFailed = payout.status === "failed";
    payout.status = nextStatus;
    payout.providerId = providerId || payout.providerId;
    payout.failureReason = nextStatus === "failed" ? message : undefined;
    payout.updatedAt = now;
    if (nextStatus === "failed" && !wasFailed) {
      reverseFailedPayout(db, payout);
    }
    updated = payout;
  });

  return updated;
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
}): Promise<{ ok: boolean; payout?: Payout; message: string; fee?: number; netAmount?: number }> {
  if (amount <= 0) return { ok: false, message: "Montant invalide" };

  const fee = calculatePayoutFee(amount);
  const netAmount = getPayoutNetAmount(amount);
  if (netAmount <= 0) {
    return { ok: false, message: "Montant trop faible après frais de retrait" };
  }

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
      fee,
      netAmount,
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

  if (created) {
    try {
      const provider = await createBictorysPayout(created);
      const updated = await updatePayoutFromProvider({
        reference: created.id,
        providerId: provider.id,
        status: provider.status,
        message: provider.message,
      });
      if (updated) created = updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retrait Bictorys impossible";
      await updatePayoutFromProvider({
        reference: created.id,
        status: "failed",
        message,
      });
      return { ok: false, payout: created, message };
    }
  }

  return {
    ok: true,
    payout: created,
    message: automatic
      ? "Retrait automatique enregistré."
      : `Retrait enregistré. ${netAmount.toLocaleString("fr-FR")} FCFA seront envoyés sur votre ${method === "wave" ? "Wave" : "Orange Money"}.`,
    fee,
    netAmount,
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

export async function retryFailedPayout(
  payoutId: string
): Promise<{ ok: boolean; payout?: Payout; message: string }> {
  const db = await getDb();
  const failed = db.payouts.find(
    (payout) => payout.id === payoutId && payout.status === "failed"
  );
  if (!failed) {
    return { ok: false, message: "Retrait introuvable ou déjà traité" };
  }

  return createPayoutRequest({
    sellerId: failed.sellerId,
    amount: failed.amount,
    method: failed.method,
    phone: failed.phone,
  });
}

export async function getSellerPayouts(sellerId: string, limit = 30) {
  const db = await getDb();
  return [...db.payouts]
    .filter((payout) => payout.sellerId === sellerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      netAmount: payout.netAmount,
      fee: payout.fee,
      method: payout.method,
      phone: payout.phone,
      status: payout.status,
      failureReason: payout.failureReason,
      createdAt: payout.createdAt,
    }));
}
