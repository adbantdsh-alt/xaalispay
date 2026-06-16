import type { Order } from "./types";
import { getOrderTotal } from "./utils";
import { computeChargebackStats } from "./chargeback";

export interface SellerStats {
  totalOrders: number;
  completedSales: number;
  activeDisputes: number;
  inProgress: number;
  totalRevenue: number;
  avgOrderValue: number;
  chargebackRate: number;
}

export function computeSellerStats(orders: Order[]): SellerStats {
  const totalOrders = orders.length;
  const completedSales = orders.filter((o) => o.status === "released").length;
  const activeDisputes = orders.filter((o) => o.status === "dispute").length;
  const inProgress = orders.filter((o) => o.status === "paid" || o.status === "protection").length;

  const revenueOrders = orders.filter((o) =>
    ["released", "protection", "paid"].includes(o.status)
  );
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const avgOrderValue =
    revenueOrders.length > 0 ? Math.round(totalRevenue / revenueOrders.length) : 0;

  const chargebackRate = computeChargebackStats(orders).rate;

  return {
    totalOrders,
    completedSales,
    activeDisputes,
    inProgress,
    totalRevenue,
    avgOrderValue,
    chargebackRate,
  };
}
