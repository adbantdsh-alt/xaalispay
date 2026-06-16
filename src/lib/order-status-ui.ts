import type { OrderStatus } from "./types";

export interface OrderStatusVisual {
  icon: "pending" | "hold" | "timer" | "done" | "warn" | "refund";
  tone: "teal" | "blue" | "amber" | "muted" | "danger";
}

export function getOrderStatusVisual(status: OrderStatus): OrderStatusVisual {
  const map: Record<OrderStatus, OrderStatusVisual> = {
    pending_payment: { icon: "pending", tone: "muted" },
    paid: { icon: "hold", tone: "teal" },
    protection: { icon: "timer", tone: "amber" },
    released: { icon: "done", tone: "teal" },
    dispute: { icon: "warn", tone: "danger" },
    refunded: { icon: "refund", tone: "muted" },
    cancelled: { icon: "refund", tone: "muted" },
  };
  return map[status];
}
