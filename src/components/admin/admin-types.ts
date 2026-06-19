import type { OrderStatus } from "@/lib/types";

export type AdminTab = "overview" | "disputes" | "payouts";

/** Forme directe de la réponse Django GET /api/admin/overview (snake_case,
 * pas d'adaptateur ici — vue admin propre à ces composants, sans homologue
 * dans src/lib/types.ts à respecter). */
export interface OverviewData {
  sellers_count: number;
  products_count: number;
  orders_count: number;
  orders_by_status: Record<string, number>;
  payouts_by_status: Record<string, number>;
  balances: {
    escrow_total: number;
    available_total: number;
    blocked_total: number;
    paid_out_total: number;
  };
  open_disputes_count: number;
  revenue: {
    buyer_protection_fees_total: number;
    seller_commissions_total: number;
  };
  paid_today_count: number;
  gmv_today: number;
}

export interface PayoutRow {
  id: string;
  sellerUsername: string;
  sellerName: string;
  amount: number;
  method: string;
  phone: string;
  status: string;
  failureReason?: string;
  createdAt: string;
}

export interface DisputeMedia {
  type: "image" | "video";
  url: string;
  name?: string;
}

export interface DisputeRow {
  id: string;
  slug: string;
  sellerId: string;
  sellerUsername: string;
  sellerName: string;
  sellerPhone: string | null;
  productName: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string | null;
  status: OrderStatus;
  total: number;
  buyerProtectionFee: number;
  paymentMethod?: string;
  paidAt?: string;
  clientDeliveryConfirmedAt?: string;
  disputeOpenedAt?: string;
  disputeReason: string;
  disputeMedia: DisputeMedia[];
  disputePhotos: string[];
  createdAt: string;
  updatedAt: string;
}

export function formatAdminDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function adminStatusClass(status: string) {
  if (status === "failed" || status === "dispute" || status === "refunded") return "bad";
  if (status === "success" || status === "released") return "good";
  if (status === "pending" || status === "processing" || status === "paid") return "warn";
  return "neutral";
}
