import { getOrderTotal } from "./utils";
import type { Order } from "./types";

/** Grille tarifaire XaalisPay — transparente, sans frais cachés. */
export const FEE_POLICY = {
  buyer: {
    percent: 0.01,
    label: "Protection séquestre",
    shortLabel: "1 %",
    description:
      "Frais affichés avant paiement. Même logique que les 1 % Wave/Orange — pour la sécurité du séquestre.",
  },
  seller: {
    percent: 0.05,
    label: "Commission vente",
    shortLabel: "5 %",
    description:
      "Prélevée uniquement quand la vente est validée et libérée (après livraison + Séquestre Flash). Couvre la commission XaalisPay et le retrait, qui est gratuit.",
  },
} as const;

export function roundFcfa(amount: number): number {
  return Math.round(amount);
}

export function calculateBuyerProtectionFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return roundFcfa(subtotal * FEE_POLICY.buyer.percent);
}

export function calculateSellerCommission(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return roundFcfa(subtotal * FEE_POLICY.seller.percent);
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
  sellerReceives: number;
};

export function simulateTransaction(subtotal: number): FeeSimulation {
  const buyerFee = calculateBuyerProtectionFee(subtotal);
  const checkoutTotal = subtotal + buyerFee;
  const sellerCommission = calculateSellerCommission(subtotal);
  const sellerBalance = subtotal - sellerCommission;
  const sellerReceives = sellerBalance; // retrait gratuit : aucun frais déduit
  return {
    subtotal,
    buyerFee,
    checkoutTotal,
    sellerCommission,
    sellerBalance,
    sellerReceives,
  };
}
