import type { OrderStatus } from "@/lib/types";

export type AdminTab = "overview" | "disputes" | "payouts";

export interface OverviewData {
  stats: {
    sellerCount: number;
    productCount: number;
    orderCount: number;
    paidTodayCount: number;
    gmvToday: number;
    openDisputes: number;
    pendingPayouts: number;
    failedPayouts: number;
    totalAvailable: number;
    totalEscrow: number;
  };
  health: {
    commit: string | null;
    payoutConfigured: boolean;
    storage: string;
    remoteOk?: boolean;
    bictorysBaseUrl?: string;
    bictorysPayinKeySet?: boolean;
    bictorysRefundKeySet?: boolean;
    bictorysRefundKeyName?: string;
    webhookSecretSet?: boolean;
  };
  prodConfig?: {
    production: boolean;
    ready: boolean;
    missingCount: number;
    missingLabels: string[];
    checks: Array<{
      id: string;
      label: string;
      ok: boolean;
      required: boolean;
      hint?: string;
    }>;
  };
  relational?: {
    enabled: boolean;
    schemaReady: boolean;
    lastMigratedAt: string | null;
    counts: Record<string, number>;
  };
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
