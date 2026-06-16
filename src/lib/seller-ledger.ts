import { getDb } from "./db";
import type { LedgerEntry, LedgerEntryType } from "./types";

export interface SellerTransaction {
  id: string;
  type: LedgerEntryType;
  label: string;
  detail?: string;
  amount: number;
  signedAmount: number;
  direction: "credit" | "debit";
  createdAt: string;
  orderId?: string;
}

const TYPE_LABELS: Record<LedgerEntryType, string> = {
  escrow_credit: "Paiement client",
  escrow_release: "Argent libéré",
  dispute_hold: "Litige — fonds bloqués",
  refund_debit: "Remboursement client",
  payout_debit: "Retrait mobile money",
  payout_reversal: "Retrait échoué — recrédité",
  seller_commission: "Commission XaalisPay",
};

function buildDetail(entry: LedgerEntry, productName?: string): string | undefined {
  if (entry.description && !entry.description.startsWith("Migration")) {
    return entry.description;
  }
  if (productName) return productName;
  if (entry.payoutId) return `Réf. ${entry.payoutId.slice(0, 8).toUpperCase()}`;
  return undefined;
}

export async function getSellerTransactions(
  sellerId: string,
  limit = 50
): Promise<SellerTransaction[]> {
  const db = await getDb();
  const orderNames = new Map(db.orders.map((o) => [o.id, o.productName]));

  return db.ledgerEntries
    .filter((entry) => entry.sellerId === sellerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((entry) => {
      const productName = entry.orderId ? orderNames.get(entry.orderId) : undefined;
      return {
        id: entry.id,
        type: entry.type,
        label: TYPE_LABELS[entry.type] || entry.type,
        detail: buildDetail(entry, productName),
        amount: entry.amount,
        signedAmount: entry.direction === "credit" ? entry.amount : -entry.amount,
        direction: entry.direction,
        createdAt: entry.createdAt,
        orderId: entry.orderId,
      };
    });
}
