import { getDb, updateDb } from "./db";
import {
  computeDeliveryDeadlineAt,
  computeProtectionEndsAt,
  getProtectionDurationMinutes,
} from "./protection";
import type { DisputeMedia, Order, OrderStatus, Product, Profile } from "./types";
import {
  collectUsedPins,
  generateUniquePaymentSlug,
  collectUsedPaymentSlugs,
  generateUniquePin,
  getOrderTotal,
  isValidUsername,
} from "./utils";
import { calculateBuyerProtectionFee } from "./fees";
import { issueDeliveryCodeTimestamps } from "./delivery-code";
import type { WalletSequesteredItem } from "./wallet-breakdown";
import { computeWalletBreakdown } from "./wallet-breakdown";
import {
  creditEscrowForPaidOrder,
  holdDisputedEscrowForOrder,
  refundEscrowForOrder,
  releaseEscrowForOrder,
} from "./ledger";

export { getProtectionDurationMinutes } from "./protection";
export { computeWalletBreakdown } from "./wallet-breakdown";

const HELD_STATUSES: OrderStatus[] = ["paid", "protection", "dispute"];

export async function getProfileByUsername(
  username: string
): Promise<Profile | undefined> {
  const db = await getDb();
  return db.profiles.find(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
}

export async function getProfileById(id: string): Promise<Profile | undefined> {
  const db = await getDb();
  return db.profiles.find((p) => p.id === id);
}

export async function createProfile(
  data: Omit<Profile, "createdAt">
): Promise<Profile> {
  const existing = await getProfileById(data.id);
  if (existing) return existing;

  const profile: Profile = { ...data, createdAt: new Date().toISOString() };
  await updateDb((db) => {
    db.profiles.push(profile);
  });
  return profile;
}

export async function isUsernameTaken(
  username: string,
  excludeId?: string
): Promise<boolean> {
  const db = await getDb();
  return db.profiles.some(
    (p) =>
      p.username.toLowerCase() === username.toLowerCase() &&
      p.id !== excludeId
  );
}

const USERNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

export async function updateProfileUsername(
  userId: string,
  username: string
): Promise<{ profile: Profile } | { error: string }> {
  const clean = username.toLowerCase().trim();
  if (!isValidUsername(clean)) {
    return { error: "XaalisTag invalide (3-20 caractères, lettres/chiffres/_)" };
  }
  if (await isUsernameTaken(clean, userId)) {
    return { error: "Ce XaalisTag est déjà pris" };
  }

  const profile = await getProfileById(userId);
  if (!profile) return { error: "Profil introuvable" };

  if (profile.username === clean) {
    return { profile };
  }

  if (profile.usernameChangedAt) {
    const elapsed = Date.now() - new Date(profile.usernameChangedAt).getTime();
    if (elapsed < USERNAME_CHANGE_COOLDOWN_MS) {
      const daysLeft = Math.ceil(
        (USERNAME_CHANGE_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000)
      );
      return { error: `Modification possible dans ${daysLeft} jour(s)` };
    }
  }

  await updateDb((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (p) {
      p.username = clean;
      p.usernameChangedAt = new Date().toISOString();
    }
  });

  return { profile: (await getProfileById(userId))! };
}

export async function getProductsBySeller(
  sellerId: string,
  activeOnly = false
): Promise<Product[]> {
  const db = await getDb();
  return db.products
    .filter((p) => p.sellerId === sellerId && (!activeOnly || p.active !== false))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const db = await getDb();
  return db.products.find((p) => p.id === id);
}

export async function getProductByPaymentSlug(
  slug: string
): Promise<Product | undefined> {
  const db = await getDb();
  return db.products.find((p) => p.paymentSlug === slug);
}

export async function createProduct(
  sellerId: string,
  data: Omit<
    Product,
    "id" | "sellerId" | "paymentSlug" | "active" | "createdAt" | "updatedAt"
  >
): Promise<Product> {
  const now = new Date().toISOString();
  const used = collectUsedPaymentSlugs(await getDb());
  const product: Product = {
    id: crypto.randomUUID(),
    sellerId,
    paymentSlug: generateUniquePaymentSlug(used),
    active: true,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  await updateDb((db) => {
    db.products.push(product);
  });
  return product;
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  data: Partial<
    Pick<
      Product,
      | "name"
      | "description"
      | "price"
      | "deliveryCost"
      | "deliveryHours"
      | "note"
      | "image"
      | "active"
    >
  >
): Promise<Product | null> {
  let updated: Product | null = null;
  await updateDb((db) => {
    const product = db.products.find(
      (p) => p.id === productId && p.sellerId === sellerId
    );
    if (!product) return;
    Object.assign(product, data, { updatedAt: new Date().toISOString() });
    updated = product;
  });
  return updated;
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  const db = await getDb();
  return db.orders
    .filter((o) => o.sellerId === sellerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getOrderBySlug(slug: string): Promise<Order | undefined> {
  const db = await getDb();
  return db.orders.find((o) => o.slug === slug);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const db = await getDb();
  return db.orders.find((o) => o.id === id);
}

const DISPUTABLE_STATUSES: OrderStatus[] = ["protection", "dispute"];

export async function getDisputableOrderByPin(pin: string): Promise<Order | null> {
  const clean = pin.trim();
  if (!/^\d{4}$/.test(clean)) return null;

  const db = await getDb();
  const matches = db.orders
    .filter((o) => o.pin === clean && DISPUTABLE_STATUSES.includes(o.status))
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

  return matches[0] || null;
}

export interface CreateOrderClient {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  note?: string;
}

export async function createOrderFromProduct(
  product: Product,
  client: CreateOrderClient = {}
): Promise<Order> {
  const firstName = (client.firstName || "").trim();
  const lastName = (client.lastName || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const db = await getDb();
  const used = collectUsedPaymentSlugs(db);
  const usedPins = collectUsedPins(db);
  const now = new Date().toISOString();
  const order: Order = {
    id: crypto.randomUUID(),
    sellerId: product.sellerId,
    productId: product.id,
    slug: generateUniquePaymentSlug(used),
    pin: generateUniquePin(usedPins),
    clientName: fullName,
    clientFirstName: firstName,
    clientPhone: (client.phone || "").trim(),
    clientAddress: (client.address || "").trim(),
    clientNote: (client.note || "").trim(),
    productName: product.name,
    productPrice: product.price,
    deliveryCost: product.deliveryCost || 0,
    deliveryHours: product.deliveryHours,
    status: "pending_payment",
    paymentReference: `XP-${Date.now()}-${generateUniquePaymentSlug(used)}`,
    createdAt: now,
    updatedAt: now,
  };
  await updateDb((db) => {
    db.orders.push(order);
  });
  return order;
}

export async function processPayment(
  slug: string,
  paymentMethod: string
): Promise<Order | null> {
  let result: Order | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order || order.status !== "pending_payment") return;

    order.status = "paid";
    order.paymentMethod = paymentMethod;
    order.paymentProviderStatus = "success";
    order.paidAt = now;
    if (!order.buyerProtectionFee) {
      order.buyerProtectionFee = calculateBuyerProtectionFee(getOrderTotal(order));
    }
    Object.assign(order, issueDeliveryCodeTimestamps(new Date(now)));
    order.deliveryDeadlineAt = computeDeliveryDeadlineAt(
      order.deliveryHours,
      new Date(now)
    );
    order.updatedAt = now;
    for (const attempt of db.paymentAttempts.filter((item) => item.orderId === order.id)) {
      attempt.status = "success";
      attempt.updatedAt = now;
    }
    creditEscrowForPaidOrder(db, order);
    result = order;
  });

  return result;
}

export async function getOrderByPaymentReference(
  reference: string
): Promise<Order | undefined> {
  const db = await getDb();
  return db.orders.find(
    (o) =>
      o.paymentReference === reference ||
      o.slug === reference ||
      o.paymentProviderId === reference
  );
}

export async function markOrderRefundedByReference(
  reference: string
): Promise<Order | null> {
  let result: Order | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find(
      (o) =>
        o.paymentReference === reference ||
        o.slug === reference ||
        o.paymentProviderId === reference
    );
    if (!order || order.status === "refunded" || order.status === "released") return;
    order.status = "refunded";
    order.refundedAt = now;
    order.updatedAt = now;
    refundEscrowForOrder(db, order);
    result = order;
  });

  return result;
}

export async function markPaymentInitiated(
  slug: string,
  data: {
    method: string;
    providerId?: string;
    providerStatus?: string;
    providerMessage?: string;
  }
): Promise<Order | null> {
  let result: Order | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order || order.status !== "pending_payment") return;
    order.paymentMethod = data.method;
    order.paymentProvider = "bictorys";
    order.paymentProviderId = data.providerId;
    order.paymentProviderStatus = data.providerStatus || "initiated";
    order.paymentProviderMessage = data.providerMessage;
    order.buyerProtectionFee = calculateBuyerProtectionFee(getOrderTotal(order));
    order.updatedAt = now;
    result = order;
  });

  return result;
}

export async function validateDelivery(
  orderId: string,
  sellerId: string,
  pin: string
): Promise<Order | null> {
  let result: Order | null = null;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find(
      (o) => o.id === orderId && o.sellerId === sellerId
    );
    if (!order || order.status !== "paid" || order.pin !== pin) return;

    order.status = "protection";
    order.deliveryValidatedAt = now;
    order.protectionEndsAt = computeProtectionEndsAt(new Date(now));
    order.updatedAt = now;
    result = order;
  });

  return result;
}

export async function openDispute(
  slug: string,
  data: { reason?: string; photos?: string[]; media?: DisputeMedia[] } = {}
): Promise<boolean> {
  let ok = false;
  const now = new Date().toISOString();

  await updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order || order.status !== "protection") return;
    order.status = "dispute";
    order.disputeReason = (data.reason || "").trim();
    order.disputeMedia = data.media || (data.photos || []).map((url) => ({ type: "image", url }));
    order.disputePhotos =
      data.photos || order.disputeMedia.filter((item) => item.type === "image").map((item) => item.url);
    order.disputeOpenedAt = now;
    order.updatedAt = now;
    holdDisputedEscrowForOrder(db, order);
    ok = true;
  });

  return ok;
}

export async function openDisputeByPin(
  pin: string,
  data: { reason: string; photos?: string[]; media?: DisputeMedia[] }
): Promise<Order | null> {
  const order = await getDisputableOrderByPin(pin);
  if (!order) return null;
  if (order.status === "dispute") return order;

  const ok = await openDispute(order.slug, data);
  return ok ? (await getOrderBySlug(order.slug)) || null : null;
}

export async function processOrderMaintenance(): Promise<boolean> {
  const db = await getDb();
  let changed = false;
  const now = Date.now();
  const nowIso = new Date().toISOString();

  for (const order of db.orders) {
    if (
      order.status === "paid" &&
      order.deliveryDeadlineAt &&
      new Date(order.deliveryDeadlineAt).getTime() <= now
    ) {
      order.status = "refunded";
      order.refundedAt = nowIso;
      order.updatedAt = order.refundedAt;
      refundEscrowForOrder(db, order);
      changed = true;
    }
  }
  for (const order of db.orders) {
    if (
      order.status === "protection" &&
      order.protectionEndsAt &&
      new Date(order.protectionEndsAt).getTime() <= now
    ) {
      order.status = "released";
      order.releasedAt = nowIso;
      order.updatedAt = order.releasedAt;
      releaseEscrowForOrder(db, order);
      changed = true;
    }
  }

  if (changed) await updateDb((d) => Object.assign(d, db));
  return changed;
}

export async function getWalletData(
  sellerId: string,
  options?: { skipMaintenance?: boolean; orders?: Order[] }
) {
  if (!options?.skipMaintenance) {
    await processOrderMaintenance();
  }
  const orders = options?.orders ?? (await getOrdersBySeller(sellerId));

  let available = 0;
  const sequestered: WalletSequesteredItem[] = [];

  for (const order of orders) {
    const total = getOrderTotal(order);
    if (order.status === "released") {
      available += total;
    } else if (HELD_STATUSES.includes(order.status)) {
      sequestered.push({
        orderId: order.id,
        productName: order.productName,
        clientName: order.clientName,
        amount: total,
        status: order.status,
        protectionEndsAt: order.protectionEndsAt,
      });
    }
  }

  return {
    available,
    sequestered,
    sequesteredTotal: sequestered.reduce((s, i) => s + i.amount, 0),
    orders,
    breakdown: computeWalletBreakdown({ available, sequestered }),
  };
}
