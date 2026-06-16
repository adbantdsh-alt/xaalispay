import type { Order, OrderStatus } from "@/lib/types";

export type OrderFilterKey = "all" | "active" | "released" | "issue";

export const ORDER_FILTERS: {
  key: OrderFilterKey;
  label: string;
  match: (status: OrderStatus) => boolean;
}[] = [
  { key: "all", label: "Toutes", match: () => true },
  { key: "active", label: "En cours", match: (s) => s === "paid" || s === "protection" },
  { key: "released", label: "Libérées", match: (s) => s === "released" },
  { key: "issue", label: "Litiges", match: (s) => s === "dispute" || s === "refunded" },
];

export function filterOrders(orders: Order[], key: OrderFilterKey): Order[] {
  const def = ORDER_FILTERS.find((f) => f.key === key) ?? ORDER_FILTERS[0];
  return orders.filter((o) => def.match(o.status));
}

export function countOrdersForFilter(orders: Order[], key: OrderFilterKey): number {
  return filterOrders(orders, key).length;
}
