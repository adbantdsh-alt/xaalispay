import { customAlphabet } from "nanoid";
import type { Order, Product } from "./types";

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

export function generatePin(): string {
  return pinAlphabet();
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

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}
