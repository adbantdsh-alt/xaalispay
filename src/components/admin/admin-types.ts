import type { DisputeMedia, DisputeResponsibleParty, DisputeType, OrderStatus } from "@/lib/types";

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
    affiliate_commissions_total: number;
    bictorys_fees_estimated_total: number;
    net_profit: number;
  };
  paid_today_count: number;
  gmv_today: number;
  gmv_total: number;
  payout_volume_total: number;
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

export interface DisputeRow {
  id: string;
  orderNumber: string;
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
  disputeType: DisputeType;
  disputeTypeLabel: string;
  responsibleParty: DisputeResponsibleParty;
  disputeOpenedAt?: string;
  sellerResponseDeadlineAt?: string;
  disputeReason: string;
  disputeMedia: DisputeMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsDayPoint {
  date: string; // YYYY-MM-DD
  orders_count: number;
  gmv: number;
  buyer_protection_fees: number;
  seller_commissions: number;
  affiliate_commissions: number;
  bictorys_fees_estimated: number;
  net_profit: number;
  payout_volume: number;
  new_sellers: number;
}

export interface AnalyticsTimeseriesData {
  days: AnalyticsDayPoint[];
}

export interface AnalyticsWindowMetrics {
  orders_count: number;
  gmv: number;
  buyer_protection_fees: number;
  seller_commissions: number;
  affiliate_commissions: number;
  bictorys_fees_estimated: number;
  net_profit: number;
  payout_volume: number;
  new_sellers: number;
}

export interface AnalyticsSummaryData {
  today: AnalyticsWindowMetrics;
  last_7_days: AnalyticsWindowMetrics;
  last_30_days: AnalyticsWindowMetrics;
  all_time: AnalyticsWindowMetrics;
}

export interface SellerBalanceSummary {
  escrowBalance: number;
  availableBalance: number;
  blockedBalance: number;
  paidOutBalance: number;
}

export interface SellerRow {
  id: number;
  username: string;
  businessName: string;
  displayName: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  lifetimeGmv: number;
  balance: SellerBalanceSummary;
}

/** Forme allégée d'une commande dans la fiche détail vendeur — contrairement
 * à DisputeRow, le litige (dispute*) est optionnel : la plupart des
 * commandes récentes n'en ont pas. */
export interface OrderSummaryRow {
  id: string;
  orderNumber: string;
  slug: string;
  productName: string;
  clientName: string;
  clientPhone: string;
  status: OrderStatus;
  total: number;
  paymentMethod?: string;
  paidAt?: string;
  disputeTypeLabel?: string;
  disputeReason?: string;
  createdAt: string;
}

export interface ReferredBy {
  username: string;
  businessName: string;
  createdAt: string;
}

export interface ReferralRow {
  id: string;
  username: string;
  businessName: string;
  displayName: string;
  createdAt: string;
  boostExpiresAt: string;
  isBoosted: boolean;
  lifetimeGmv: number;
  commissionEarnedTotal: number;
}

/** Page Affiliation admin — une ligne par parrain avec agrégats de tous ses
 * filleuls (GET /api/admin/affiliates/referrers). */
export interface ReferrerGroupRow {
  referrerId: number;
  referrerUsername: string;
  referrerBusinessName: string;
  referralCount: number;
  boostedCount: number;
  totalCommission: number;
  totalLifetimeGmv: number;
  latestBoostExpiresAt: string;
}

/** Détail filleul par filleul dans le modal — même forme que ReferralRow +
 * identité du parrain (GET /api/admin/affiliates?referrer_id=X). */
export interface AffiliateRow {
  id: string;
  referrerUsername: string;
  referrerBusinessName: string;
  username: string;
  businessName: string;
  displayName: string;
  createdAt: string;
  boostExpiresAt: string;
  isBoosted: boolean;
  lifetimeGmv: number;
  commissionEarnedTotal: number;
}

export interface AffiliateProgramSummary {
  totalReferrals: number;
  boostedCount: number;
  lifetimeCount: number;
  commissionsPaidTotal: number;
}

export interface SellerDetail {
  profile: SellerRow & {
    role: string;
    payoutMethod?: string;
    payoutPhone?: string;
    autoPayoutEnabled: boolean;
    autoPayoutMode?: string;
  };
  lifetime: { ordersCount: number; lifetimeGmv: number };
  recentOrders: OrderSummaryRow[];
  recentPayouts: PayoutRow[];
  disputes: OrderSummaryRow[];
  referredBy: ReferredBy | null;
  referralsMade: ReferralRow[];
}

export interface ProductRow {
  id: number;
  name: string;
  price: number;
  active: boolean;
  sellerUsername: string;
  sellerBusinessName: string;
  ordersCount: number;
  createdAt: string;
}

export type StaffRole = "super_admin" | "dispute_manager";

export const TEAM_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Admin",
  dispute_manager: "Gestionnaire de litiges",
};

export interface TeamMemberRow {
  id: number;
  email: string | null;
  displayName: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

export interface TeamMemberDetail extends TeamMemberRow {
  mustChangePassword: boolean;
  tempPassword: string | null;
}

export function activeStatusClass(isActive: boolean) {
  return isActive ? "good" : "neutral";
}

export function isDisputeOverdue(row: DisputeRow): boolean {
  if (!row.sellerResponseDeadlineAt || row.responsibleParty !== "vendeur") return false;
  return new Date(row.sellerResponseDeadlineAt).getTime() < Date.now();
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
  if (status === "succeeded" || status === "released") return "good";
  if (status === "pending" || status === "paid") return "warn";
  if (status === "processing") return "neutral";
  return "neutral";
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En traitement",
  succeeded: "Réussi",
  failed: "Échoué",
};

/** Labels FR pour les statuts de retrait (vocabulaire distinct des statuts
 * de commande — voir ORDER_STATUS_LABELS dans @/lib/types pour ceux-là). */
export function payoutStatusLabel(status: string): string {
  return PAYOUT_STATUS_LABELS[status] ?? status;
}
