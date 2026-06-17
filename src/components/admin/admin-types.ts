import type { OrderStatus } from "@/lib/types";

export type AdminTab = "overview" | "orders" | "vendors" | "pilote" | "disputes" | "payouts";

export interface AdminAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  count?: number;
  action?: AdminTab;
}

export interface AdminSearchHit {
  type: "order" | "vendor" | "payout";
  id: string;
  label: string;
  sublabel: string;
  status?: string;
  amount?: number;
}

export interface AdminOrderRow {
  id: string;
  slug: string;
  sellerUsername: string;
  sellerName: string;
  productName: string;
  clientName: string;
  clientPhone: string;
  status: string;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVendorRow {
  id: string;
  username: string;
  displayName: string;
  businessName: string;
  phone: string | null;
  emailVerified: boolean;
  available: number;
  escrow: number;
  orderCount: number;
  productCount: number;
  disputeCount: number;
  createdAt: string;
}

export type PilotFunnelStage =
  | "registered"
  | "email_verified"
  | "product"
  | "paid_order"
  | "delivery"
  | "payout";

export interface PilotVendorRow {
  id: string;
  username: string;
  displayName: string;
  phone: string | null;
  emailVerified: boolean;
  productCount: number;
  orderCount: number;
  paidOrderCount: number;
  releasedCount: number;
  payoutSuccessCount: number;
  stage: PilotFunnelStage;
  stageIndex: number;
  stageLabel: string;
  createdAt: string;
  daysSinceSignup: number;
}

export interface PilotDashboardData {
  target: { min: number; max: number };
  sellerCount: number;
  completeCount: number;
  supportWhatsAppConfigured: boolean;
  funnel: Array<{
    stage: PilotFunnelStage;
    label: string;
    count: number;
    rateFromPrevious: number | null;
  }>;
  vendors: PilotVendorRow[];
}

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
    relationalDualWrite?: boolean;
    relationalRead?: boolean;
    emailConfigured?: boolean;
  };
  alerts?: AdminAlert[];
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
  bictorys?: {
    webhooks24h: number;
    webhooksFailed24h: number;
    pendingPayments: number;
    recentWebhooks: Array<{
      id: string;
      eventKey: string;
      status: string;
      reference: string;
      createdAt: string;
    }>;
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
  if (status === "failed" || status === "dispute" || status === "refunded" || status === "cancelled") return "bad";
  if (status === "success" || status === "released") return "good";
  if (status === "pending" || status === "processing" || status === "paid" || status === "pending_payment") return "warn";
  return "neutral";
}
