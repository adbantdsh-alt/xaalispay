import { getOrderTotal } from "./utils";
import type { Order } from "./types";

/** Grille tarifaire XaalisPay — transparente, sans frais cachés. */
export const FEE_POLICY = {
  buyer: {
    percent: 0.01,
    capFcfa: 500,
    label: "Protection séquestre",
    shortLabel: "1 % (max 500 F)",
    description:
      "Frais affichés avant paiement. Même logique que les 1 % Wave/Orange — pour la sécurité du séquestre.",
  },
  seller: {
    percent: 0.02,
    label: "Commission vente",
    shortLabel: "2 %",
    description: "Prélevée uniquement quand la vente est validée et libérée (après livraison + Séquestre Flash).",
  },
  payout: {
    percent: 0.015,
    fixedFcfa: 75,
    label: "Frais de retrait",
    shortLabel: "1,5 % + 75 F",
    description: "Appliqués au retrait vers Wave ou Orange Money. Affichés avant confirmation.",
  },
} as const;

export function roundFcfa(amount: number): number {
  return Math.round(amount);
}

export function calculateBuyerProtectionFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  const raw = subtotal * FEE_POLICY.buyer.percent;
  return roundFcfa(Math.min(raw, FEE_POLICY.buyer.capFcfa));
}

export function calculateSellerCommission(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return roundFcfa(subtotal * FEE_POLICY.seller.percent);
}

export function calculatePayoutFee(grossAmount: number): number {
  if (grossAmount <= 0) return 0;
  return roundFcfa(grossAmount * FEE_POLICY.payout.percent + FEE_POLICY.payout.fixedFcfa);
}

export function getPayoutNetAmount(grossAmount: number): number {
  return Math.max(0, grossAmount - calculatePayoutFee(grossAmount));
}

export function getCheckoutBreakdown(
  order: Pick<Order, "productPrice" | "deliveryCost" | "buyerProtectionFee">
) {
  const subtotal = getOrderTotal(order);
  const buyerProtectionFee =
    order.buyerProtectionFee ?? calculateBuyerProtectionFee(subtotal);
  const checkoutTotal = subtotal + buyerProtectionFee;
  return { subtotal, buyerProtectionFee, checkoutTotal };
}

export function getCheckoutChargeAmount(
  order: Pick<Order, "productPrice" | "deliveryCost" | "buyerProtectionFee">
): number {
  return getCheckoutBreakdown(order).checkoutTotal;
}

export type FeeSimulation = {
  subtotal: number;
  buyerFee: number;
  checkoutTotal: number;
  sellerCommission: number;
  sellerBalance: number;
  payoutFee: number;
  sellerReceives: number;
};

export function simulateTransaction(subtotal: number): FeeSimulation {
  const buyerFee = calculateBuyerProtectionFee(subtotal);
  const checkoutTotal = subtotal + buyerFee;
  const sellerCommission = calculateSellerCommission(subtotal);
  const sellerBalance = subtotal - sellerCommission;
  const payoutFee = calculatePayoutFee(sellerBalance);
  const sellerReceives = sellerBalance - payoutFee;
  return {
    subtotal,
    buyerFee,
    checkoutTotal,
    sellerCommission,
    sellerBalance,
    payoutFee,
    sellerReceives,
  };
}
