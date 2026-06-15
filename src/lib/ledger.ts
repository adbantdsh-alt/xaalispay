import { getDb, updateDb } from "./db";
import type {
  Database,
  LedgerEntry,
  LedgerEntryType,
  LedgerPocket,
  Order,
  PaymentAttempt,
  Payout,
  WebhookEvent,
} from "./types";
import { getOrderTotal } from "./utils";

type SellerBalanceKey =
  | "escrowBalance"
  | "availableBalance"
  | "blockedBalance"
  | "paidOutBalance";

function balanceKeyForPocket(pocket: LedgerPocket) {
  const keys: Record<LedgerPocket, SellerBalanceKey> = {
    escrow: "escrowBalance",
    available: "availableBalance",
    blocked: "blockedBalance",
    paid_out: "paidOutBalance",
  };
  return keys[pocket];
}

function applyEntryToBalances(db: Database, entry: LedgerEntry) {
  const now = new Date().toISOString();
  let balance = db.sellerBalances.find((item) => item.sellerId === entry.sellerId);
  if (!balance) {
    balance = {
      sellerId: entry.sellerId,
      escrowBalance: 0,
      availableBalance: 0,
      blockedBalance: 0,
      paidOutBalance: 0,
      updatedAt: now,
    };
    db.sellerBalances.push(balance);
  }

  const key = balanceKeyForPocket(entry.pocket);
  const signedAmount = entry.direction === "credit" ? entry.amount : -entry.amount;
  balance[key] += signedAmount;
  balance.updatedAt = now;
}

function appendLedgerEntry(
  db: Database,
  data: Omit<LedgerEntry, "id" | "createdAt">
): LedgerEntry | null {
  const existing = db.ledgerEntries.find((entry) => entry.reference === data.reference);
  if (existing) return null;

  const entry: LedgerEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  db.ledgerEntries.push(entry);
  applyEntryToBalances(db, entry);
  return entry;
}

function createOrderEntry(
  db: Database,
  order: Order,
  type: LedgerEntryType,
  pocket: LedgerPocket,
  direction: "credit" | "debit",
  reference: string,
  description?: string
) {
  return appendLedgerEntry(db, {
    sellerId: order.sellerId,
    orderId: order.id,
    type,
    pocket,
    direction,
    amount: getOrderTotal(order),
    reference,
    description,
  });
}

function normalizeAttemptStatus(status?: string): PaymentAttempt["status"] {
  const clean = (status || "").toLowerCase();
  if (clean.includes("success") || clean === "paid") return "success";
  if (clean.includes("fail") || clean.includes("error") || clean.includes("cancel")) return "failed";
  if (clean.includes("pending")) return "pending";
  return "initiated";
}

export function creditEscrowForPaidOrder(db: Database, order: Order) {
  return createOrderEntry(
    db,
    order,
    "escrow_credit",
    "escrow",
    "credit",
    `order:${order.id}:escrow_credit`,
    "Paiement client confirmé en séquestre"
  );
}

export function releaseEscrowForOrder(db: Database, order: Order) {
  createOrderEntry(
    db,
    order,
    "escrow_release",
    "escrow",
    "debit",
    `order:${order.id}:escrow_release:debit`,
    "Sortie du séquestre après protection"
  );
  createOrderEntry(
    db,
    order,
    "escrow_release",
    "available",
    "credit",
    `order:${order.id}:escrow_release:credit`,
    "Solde vendeur disponible après protection"
  );
}

export function holdDisputedEscrowForOrder(db: Database, order: Order) {
  createOrderEntry(
    db,
    order,
    "dispute_hold",
    "escrow",
    "debit",
    `order:${order.id}:dispute_hold:debit`,
    "Séquestre bloqué après litige"
  );
  createOrderEntry(
    db,
    order,
    "dispute_hold",
    "blocked",
    "credit",
    `order:${order.id}:dispute_hold:credit`,
    "Montant bloqué pour litige"
  );
}

export function refundEscrowForOrder(db: Database, order: Order) {
  return createOrderEntry(
    db,
    order,
    "refund_debit",
    "escrow",
    "debit",
    `order:${order.id}:refund_debit`,
    "Remboursement client avant livraison"
  );
}

export function debitAvailableForPayout(db: Database, payout: Payout) {
  return appendLedgerEntry(db, {
    sellerId: payout.sellerId,
    payoutId: payout.id,
    type: "payout_debit",
    pocket: "available",
    direction: "debit",
    amount: payout.amount,
    reference: `payout:${payout.id}:available_debit`,
    description: "Retrait vendeur",
  });
}

export function reverseFailedPayout(db: Database, payout: Payout) {
  return appendLedgerEntry(db, {
    sellerId: payout.sellerId,
    payoutId: payout.id,
    type: "payout_reversal",
    pocket: "available",
    direction: "credit",
    amount: payout.amount,
    reference: `payout:${payout.id}:available_reversal`,
    description: "Annulation retrait vendeur échoué",
  });
}

export async function recordPaymentAttempt(
  order: Order,
  data: {
    method: string;
    providerId?: string;
    providerStatus?: string;
    providerMessage?: string;
    paymentUrl?: string;
    qrCode?: string;
  }
): Promise<PaymentAttempt | null> {
  let attempt: PaymentAttempt | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const existing = db.paymentAttempts.find(
      (item) => item.orderId === order.id && item.paymentReference === order.paymentReference
    );

    if (existing) {
      existing.providerId = data.providerId || existing.providerId;
      existing.paymentUrl = data.paymentUrl || existing.paymentUrl;
      existing.qrCode = data.qrCode || existing.qrCode;
      existing.status = normalizeAttemptStatus(data.providerStatus);
      existing.message = data.providerMessage || existing.message;
      existing.updatedAt = now;
      attempt = existing;
      return;
    }

    attempt = {
      id: crypto.randomUUID(),
      orderId: order.id,
      orderSlug: order.slug,
      sellerId: order.sellerId,
      paymentReference: order.paymentReference || order.slug,
      paymentMethod: data.method,
      provider: "bictorys",
      providerId: data.providerId,
      paymentUrl: data.paymentUrl,
      qrCode: data.qrCode,
      status: normalizeAttemptStatus(data.providerStatus),
      message: data.providerMessage,
      createdAt: now,
      updatedAt: now,
    };
    db.paymentAttempts.push(attempt);
  });

  return attempt;
}

export async function getReusablePaymentAttempt(
  orderId: string,
  paymentMethod: string,
  withinMs = 60_000
): Promise<PaymentAttempt | null> {
  const db = await getDb();
  const cutoff = Date.now() - withinMs;
  return (
    db.paymentAttempts
      .filter(
        (item) =>
          item.orderId === orderId &&
          item.paymentMethod === paymentMethod &&
          item.status !== "failed" &&
          new Date(item.createdAt).getTime() >= cutoff
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ||
    null
  );
}

export async function recordWebhookEvent(
  data: Omit<WebhookEvent, "id" | "createdAt">
): Promise<{ duplicate: boolean; event: WebhookEvent }> {
  let result: { duplicate: boolean; event: WebhookEvent } | null = null;
  await updateDb((db) => {
    const existing = db.webhookEvents.find(
      (event) => event.provider === data.provider && event.eventKey === data.eventKey
    );
    if (existing) {
      result = { duplicate: true, event: existing };
      return;
    }

    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...data,
    };
    db.webhookEvents.push(event);
    result = { duplicate: false, event };
  });

  return result!;
}
