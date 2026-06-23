import type { Order, OrderStatus } from "@/lib/types";

export type OrderFilterKey = "all" | "to_validate" | "escrow" | "dispute";

export const ORDER_FILTERS: {
  key: OrderFilterKey;
  label: string;
  match: (status: OrderStatus) => boolean;
}[] = [
  { key: "all", label: "Toutes", match: () => true },
  { key: "to_validate", label: "À valider", match: (s) => s === "paid" },
  { key: "escrow", label: "En séquestre", match: (s) => s === "protection" },
  { key: "dispute", label: "Litige", match: (s) => s === "dispute" },
];

export function filterOrders(orders: Order[], key: OrderFilterKey): Order[] {
  const def = ORDER_FILTERS.find((f) => f.key === key) ?? ORDER_FILTERS[0];
  return orders.filter((o) => def.match(o.status));
}
