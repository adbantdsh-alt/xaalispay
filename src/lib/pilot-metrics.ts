import { getDb } from "./db";
import type { Order, Payout, Profile } from "./types";

export const PILOT_TARGET_MIN = 5;
export const PILOT_TARGET_MAX = 10;

export type PilotFunnelStage =
  | "registered"
  | "email_verified"
  | "product"
  | "paid_order"
  | "delivery"
  | "payout";

export const PILOT_FUNNEL_STAGES: { id: PilotFunnelStage; label: string }[] = [
  { id: "registered", label: "Inscrit" },
  { id: "email_verified", label: "Email vérifié" },
  { id: "product", label: "Produit créé" },
  { id: "paid_order", label: "1ère commande payée" },
  { id: "delivery", label: "1ère livraison validée" },
  { id: "payout", label: "1er retrait réussi" },
];

function isSeller(profile: Profile) {
  return profile.role !== "super_admin";
}

function hasPaidOrder(orders: Order[]) {
  return orders.some((order) => order.status !== "pending_payment");
}

function hasValidatedDelivery(orders: Order[]) {
  return orders.some(
    (order) => order.status === "protection" || order.status === "released"
  );
}

function hasSuccessfulPayout(payouts: Payout[], sellerId: string) {
  return payouts.some((p) => p.sellerId === sellerId && p.status === "success");
}

export function computeVendorFunnelStage(input: {
  emailVerified: boolean;
  productCount: number;
  orders: Order[];
  payouts: Payout[];
  sellerId: string;
}): PilotFunnelStage {
  if (hasSuccessfulPayout(input.payouts, input.sellerId)) return "payout";
  if (hasValidatedDelivery(input.orders)) return "delivery";
  if (hasPaidOrder(input.orders)) return "paid_order";
  if (input.productCount > 0) return "product";
  if (input.emailVerified) return "email_verified";
  return "registered";
}

export function funnelStageIndex(stage: PilotFunnelStage): number {
  return PILOT_FUNNEL_STAGES.findIndex((s) => s.id === stage);
}

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

export interface PilotFunnelSummary {
  stage: PilotFunnelStage;
  label: string;
  count: number;
  rateFromPrevious: number | null;
}

export interface PilotDashboardData {
  target: { min: number; max: number };
  sellerCount: number;
  completeCount: number;
  supportWhatsAppConfigured: boolean;
  funnel: PilotFunnelSummary[];
  vendors: PilotVendorRow[];
}

export async function getPilotDashboard(): Promise<PilotDashboardData> {
  const db = await getDb();
  const sellers = db.profiles.filter(isSeller);

  const vendors: PilotVendorRow[] = sellers.map((profile) => {
    const orders = db.orders.filter((order) => order.sellerId === profile.id);
    const productCount = db.products.filter((p) => p.sellerId === profile.id).length;
    const emailVerified = !!profile.emailVerifiedAt;
    const payouts = db.payouts.filter((p) => p.sellerId === profile.id);
    const stage = computeVendorFunnelStage({
      emailVerified,
      productCount,
      orders,
      payouts: db.payouts,
      sellerId: profile.id,
    });
    const stageIndex = funnelStageIndex(stage);
    const createdMs = new Date(profile.createdAt).getTime();
    const daysSinceSignup = Number.isNaN(createdMs)
      ? 0
      : Math.floor((Date.now() - createdMs) / (24 * 60 * 60 * 1000));

    return {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      phone: profile.phone || profile.payoutPhone || null,
      emailVerified,
      productCount,
      orderCount: orders.length,
      paidOrderCount: orders.filter((o) => o.status !== "pending_payment").length,
      releasedCount: orders.filter((o) => o.status === "released").length,
      payoutSuccessCount: payouts.filter((p) => p.status === "success").length,
      stage,
      stageIndex,
      stageLabel: PILOT_FUNNEL_STAGES[stageIndex]?.label || stage,
      createdAt: profile.createdAt,
      daysSinceSignup,
    };
  });

  vendors.sort((a, b) => {
    if (a.stageIndex !== b.stageIndex) return b.stageIndex - a.stageIndex;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const stageCounts = PILOT_FUNNEL_STAGES.map((def, index) => {
    const count = vendors.filter((v) => v.stageIndex >= index).length;
    const prevCount =
      index === 0 ? vendors.length : vendors.filter((v) => v.stageIndex >= index - 1).length;
    const rateFromPrevious =
      index === 0 || prevCount === 0 ? null : Math.round((count / prevCount) * 100);
    return {
      stage: def.id,
      label: def.label,
      count,
      rateFromPrevious,
    };
  });

  const completeCount = vendors.filter((v) => v.stage === "payout").length;

  return {
    target: { min: PILOT_TARGET_MIN, max: PILOT_TARGET_MAX },
    sellerCount: vendors.length,
    completeCount,
    supportWhatsAppConfigured: !!process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim(),
    funnel: stageCounts,
    vendors,
  };
}
