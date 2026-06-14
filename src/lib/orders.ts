import { readDb, updateDb } from "./db";
import {
  computeDeliveryDeadlineAt,
  computeProtectionEndsAt,
  getProtectionDurationMinutes,
} from "./protection";
import type { Order, OrderStatus, Product, Profile } from "./types";
import {
  generatePaymentSlug,
  generatePin,
  getOrderTotal,
} from "./utils";
import type { WalletSequesteredItem } from "./wallet-breakdown";
import { computeWalletBreakdown } from "./wallet-breakdown";

export { getProtectionDurationMinutes } from "./protection";
export { computeWalletBreakdown } from "./wallet-breakdown";

const HELD_STATUSES: OrderStatus[] = ["paid", "protection", "dispute"];

export function getProfileByUsername(username: string): Profile | undefined {
  const db = readDb();
  return db.profiles.find(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );
}

export function getProfileById(id: string): Profile | undefined {
  return readDb().profiles.find((p) => p.id === id);
}

export function createProfile(data: Omit<Profile, "createdAt">): Profile {
  const profile: Profile = { ...data, createdAt: new Date().toISOString() };
  updateDb((db) => {
    db.profiles.push(profile);
  });
  return profile;
}

export function isUsernameTaken(username: string, excludeId?: string): boolean {
  const db = readDb();
  return db.profiles.some(
    (p) =>
      p.username.toLowerCase() === username.toLowerCase() &&
      p.id !== excludeId
  );
}

export function getProductsBySeller(sellerId: string, activeOnly = false): Product[] {
  const db = readDb();
  return db.products
    .filter((p) => p.sellerId === sellerId && (!activeOnly || p.active))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getProductById(id: string): Product | undefined {
  return readDb().products.find((p) => p.id === id);
}

export function createProduct(
  sellerId: string,
  data: Omit<Product, "id" | "sellerId" | "active" | "createdAt" | "updatedAt">
): Product {
  const now = new Date().toISOString();
  const product: Product = {
    id: crypto.randomUUID(),
    sellerId,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  updateDb((db) => {
    db.products.push(product);
  });
  return product;
}

export function updateProduct(
  productId: string,
  sellerId: string,
  data: Partial<Pick<Product, "name" | "description" | "price" | "deliveryHours" | "image" | "active">>
): Product | null {
  let updated: Product | null = null;
  updateDb((db) => {
    const product = db.products.find(
      (p) => p.id === productId && p.sellerId === sellerId
    );
    if (!product) return;
    Object.assign(product, data, { updatedAt: new Date().toISOString() });
    updated = product;
  });
  return updated;
}

export function getOrdersBySeller(sellerId: string): Order[] {
  return readDb()
    .orders.filter((o) => o.sellerId === sellerId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getOrderBySlug(slug: string): Order | undefined {
  return readDb().orders.find((o) => o.slug === slug);
}

export function getOrderById(id: string): Order | undefined {
  return readDb().orders.find((o) => o.id === id);
}

export function createOrderFromProduct(
  product: Product,
  clientName: string,
  clientPhone: string
): Order {
  const now = new Date().toISOString();
  const order: Order = {
    id: crypto.randomUUID(),
    sellerId: product.sellerId,
    productId: product.id,
    slug: generatePaymentSlug(),
    pin: generatePin(),
    clientName,
    clientPhone,
    productName: product.name,
    productPrice: product.price,
    deliveryHours: product.deliveryHours,
    status: "pending_payment",
    createdAt: now,
    updatedAt: now,
  };
  updateDb((db) => {
    db.orders.push(order);
  });
  return order;
}

export function processPayment(
  slug: string,
  paymentMethod: string
): Order | null {
  let result: Order | null = null;
  const now = new Date().toISOString();

  updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order || order.status !== "pending_payment") return;

    order.status = "paid";
    order.paymentMethod = paymentMethod;
    order.paidAt = now;
    order.deliveryDeadlineAt = computeDeliveryDeadlineAt(
      order.deliveryHours,
      new Date(now)
    );
    order.updatedAt = now;
    result = order;
  });

  return result;
}

export function validateDelivery(orderId: string, sellerId: string, pin: string): Order | null {
  let result: Order | null = null;
  const now = new Date().toISOString();

  updateDb((db) => {
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

export function openDispute(slug: string): boolean {
  let ok = false;
  const now = new Date().toISOString();

  updateDb((db) => {
    const order = db.orders.find((o) => o.slug === slug);
    if (!order || order.status !== "protection") return;
    order.status = "dispute";
    order.updatedAt = now;
    ok = true;
  });

  return ok;
}

export function releaseExpiredOrders(): string[] {
  const released: string[] = [];
  const now = Date.now();

  updateDb((db) => {
    for (const order of db.orders) {
      if (
        order.status === "protection" &&
        order.protectionEndsAt &&
        new Date(order.protectionEndsAt).getTime() <= now
      ) {
        order.status = "released";
        order.releasedAt = new Date().toISOString();
        order.updatedAt = order.releasedAt;
        released.push(order.id);
      }
    }
  });

  return released;
}

export function refundExpiredDeliveries(): string[] {
  const refunded: string[] = [];
  const now = Date.now();

  updateDb((db) => {
    for (const order of db.orders) {
      if (
        order.status === "paid" &&
        order.deliveryDeadlineAt &&
        new Date(order.deliveryDeadlineAt).getTime() <= now
      ) {
        order.status = "refunded";
        order.refundedAt = new Date().toISOString();
        order.updatedAt = order.refundedAt;
        refunded.push(order.id);
      }
    }
  });

  return refunded;
}

export function processOrderMaintenance() {
  refundExpiredDeliveries();
  releaseExpiredOrders();
}

export function getWalletData(sellerId: string) {
  processOrderMaintenance();
  const orders = getOrdersBySeller(sellerId);

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
