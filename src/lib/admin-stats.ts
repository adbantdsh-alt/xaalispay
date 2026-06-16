import { isBictorysPayoutConfigured, getWebhookSecret } from "./bictorys";
import { getDb, getDbStorageMode } from "./db";
import { checkRemoteStore } from "./data-store";
import type { DisputeMedia, Order, Payout, Profile } from "./types";
import { getOrderTotal } from "./utils";

function isSeller(profile: Profile) {
  return profile.role !== "super_admin";
}

function profileMap(profiles: Profile[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export async function getAdminOverview() {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const sellers = db.profiles.filter(isSeller);
  const orders = db.orders;
  const paidToday = orders.filter(
    (order) =>
      order.status !== "pending_payment" &&
      (order.paidAt?.startsWith(today) || order.createdAt.startsWith(today))
  );

  const remote = await checkRemoteStore();

  return {
    stats: {
      sellerCount: sellers.length,
      productCount: db.products.length,
      orderCount: orders.length,
      paidTodayCount: paidToday.length,
      gmvToday: paidToday.reduce((sum, order) => sum + getOrderTotal(order), 0),
      openDisputes: orders.filter((order) => order.status === "dispute").length,
      pendingPayouts: db.payouts.filter(
        (payout) => payout.status === "pending" || payout.status === "processing"
      ).length,
      failedPayouts: db.payouts.filter((payout) => payout.status === "failed").length,
      totalAvailable: db.sellerBalances.reduce(
        (sum, balance) => sum + balance.availableBalance,
        0
      ),
      totalEscrow: db.sellerBalances.reduce(
        (sum, balance) => sum + balance.escrowBalance,
        0
      ),
    },
    health: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
      payoutConfigured: isBictorysPayoutConfigured(),
      storage: getDbStorageMode(),
      remoteOk: remote.ok,
      bictorysBaseUrl: process.env.BICTORYS_BASE_URL || "https://api.bictorys.com (défaut)",
      bictorysPayinKeySet: !!(process.env.BICTORYS_PUBLIC_KEY || process.env.bictorys_xaalispay_encaissement),
      bictorysRefundKeyName: (
        process.env.BICTORYS_REFUND_API_KEY ? "BICTORYS_REFUND_API_KEY" :
        process.env.bictorys_refund_key ? "bictorys_refund_key" :
        process.env.BICTORYS_API_KEY ? "BICTORYS_API_KEY" :
        process.env.BICTORYS_SECRET_KEY ? "BICTORYS_SECRET_KEY" :
        process.env.BICTORYS_PAYOUT_API_KEY ? "BICTORYS_PAYOUT_API_KEY (fallback)" :
        process.env.bictorys_payout_key ? "bictorys_payout_key (fallback)" :
        "❌ AUCUNE"
      ),
      bictorysRefundKeySet: !!(
        process.env.BICTORYS_REFUND_API_KEY ||
        process.env.bictorys_refund_key ||
        process.env.BICTORYS_API_KEY ||
        process.env.BICTORYS_SECRET_KEY ||
        process.env.BICTORYS_PAYOUT_API_KEY ||
        process.env.bictorys_payout_key
      ),
      webhookSecretSet: !!(getWebhookSecret()),
    },
  };
}

export async function getAdminVendors() {
  const db = await getDb();
  return db.profiles
    .filter(isSeller)
    .map((profile) => {
      const balance = db.sellerBalances.find((item) => item.sellerId === profile.id);
      const orders = db.orders.filter((order) => order.sellerId === profile.id);
      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        businessName: profile.businessName,
        emailVerified: !!profile.emailVerifiedAt,
        available: balance?.availableBalance ?? 0,
        escrow: balance?.escrowBalance ?? 0,
        orderCount: orders.length,
        productCount: db.products.filter((product) => product.sellerId === profile.id).length,
        disputeCount: orders.filter((order) => order.status === "dispute").length,
        createdAt: profile.createdAt,
      };
    })
    .sort((a, b) => b.orderCount - a.orderCount);
}

export async function getAdminOrders(limit = 100) {
  const db = await getDb();
  const profiles = profileMap(db.profiles);

  return [...db.orders]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
    .map((order) => serializeOrder(order, profiles.get(order.sellerId)));
}

export async function getAdminPayouts(limit = 100) {
  const db = await getDb();
  const profiles = profileMap(db.profiles);

  return [...db.payouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((payout) => serializePayout(payout, profiles.get(payout.sellerId)));
}

function serializeOrder(order: Order, seller?: Profile) {
  return {
    id: order.id,
    slug: order.slug,
    sellerId: order.sellerId,
    sellerUsername: seller?.username || "—",
    sellerName: seller?.displayName || "—",
    productName: order.productName,
    clientName: order.clientName || order.clientFirstName || "Client",
    clientPhone: order.clientPhone,
    status: order.status,
    total: getOrderTotal(order),
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    disputeReason: order.disputeReason,
  };
}

export async function getAdminDisputes() {
  const db = await getDb();
  const profiles = profileMap(db.profiles);
  return [...db.orders]
    .filter((o) => o.status === "dispute")
    .sort((a, b) => (b.disputeOpenedAt || b.updatedAt).localeCompare(a.disputeOpenedAt || a.updatedAt))
    .map((order) => {
      const seller = profiles.get(order.sellerId);
      return {
        id: order.id,
        slug: order.slug,
        sellerId: order.sellerId,
        sellerUsername: seller?.username || "—",
        sellerName: seller?.displayName || "—",
        sellerPhone: seller?.phone || null,
        productName: order.productName,
        clientName: order.clientName || order.clientFirstName || "Client",
        clientPhone: order.clientPhone,
        clientAddress: order.clientAddress || null,
        status: order.status,
        total: getOrderTotal(order),
        buyerProtectionFee: order.buyerProtectionFee ?? 0,
        sellerCommission: order.sellerCommission ?? 0,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,
        clientDeliveryConfirmedAt: order.clientDeliveryConfirmedAt,
        disputeOpenedAt: order.disputeOpenedAt,
        disputeReason: order.disputeReason || "",
        disputeMedia: (order.disputeMedia || []) as DisputeMedia[],
        disputePhotos: order.disputePhotos || [],
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });
}

function serializePayout(payout: Payout, seller?: Profile) {
  return {
    id: payout.id,
    sellerId: payout.sellerId,
    sellerUsername: seller?.username || "—",
    sellerName: seller?.displayName || "—",
    amount: payout.amount,
    method: payout.method,
    phone: payout.phone,
    status: payout.status,
    providerId: payout.providerId,
    failureReason: payout.failureReason,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt,
  };
}
