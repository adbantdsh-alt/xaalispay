import { customAlphabet } from "nanoid";
import type { Database, Order } from "./types";

const slugAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const pinAlphabet = customAlphabet("0123456789", 4);

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("XOF", "FCFA");
}

export function generatePaymentSlug(): string {
  return slugAlphabet();
}

export function collectUsedPaymentSlugs(db: Database): Set<string> {
  const used = new Set<string>();
  for (const order of db.orders) used.add(order.slug);
  for (const product of db.products) {
    if (product.paymentSlug) used.add(product.paymentSlug);
  }
  return used;
}

export function generateUniquePaymentSlug(used: Set<string>): string {
  for (let i = 0; i < 30; i++) {
    const slug = generatePaymentSlug();
    if (!used.has(slug)) return slug;
  }
  return `${generatePaymentSlug()}${generatePaymentSlug().slice(0, 2)}`;
}

export function ensureProductPaymentSlugs(db: Database): boolean {
  const used = collectUsedPaymentSlugs(db);
  let changed = false;
  for (const product of db.products) {
    if (!product.paymentSlug) {
      product.paymentSlug = generateUniquePaymentSlug(used);
      used.add(product.paymentSlug);
      changed = true;
    }
  }
  return changed;
}

export function generatePin(): string {
  return pinAlphabet();
}

export function collectUsedPins(db: Database): Set<string> {
  return new Set(db.orders.map((order) => order.pin).filter(Boolean));
}

export function generateUniquePin(used: Set<string>): string {
  for (let i = 0; i < 40; i++) {
    const pin = generatePin();
    if (!used.has(pin)) return pin;
  }
  return generatePin();
}

export function getOrderTotal(
  order: Pick<Order, "productPrice" | "deliveryCost">
): number {
  return order.productPrice + (order.deliveryCost || 0);
}

export function formatDeliveryHours(hours: number): string {
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  if (rest === 0) return `${days} j`;
  return `${days} j ${rest} h`;
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

/** Numéro local Sénégal sans indicatif (+221). */
export function normalizeSenegalPhoneLocal(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  while (digits.startsWith("221") && digits.length > 9) {
    digits = digits.slice(3);
  }
  return digits.replace(/^0+/, "");
}

/** Mobile Sénégal : 9 chiffres commençant par 7 (Wave / Orange Money). */
export function isValidSenegalMobilePhone(phone: string): boolean {
  const local = normalizeSenegalPhoneLocal(phone);
  return /^7\d{8}$/.test(local);
}

export function formatSenegalPhoneDisplay(phone: string): string {
  const local = normalizeSenegalPhoneLocal(phone);
  if (local.length !== 9) return phone;
  return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}
