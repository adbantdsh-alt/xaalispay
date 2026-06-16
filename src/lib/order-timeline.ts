import type { OrderStatus } from "./types";

export interface TimelineStep {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}

const BUYER_STEPS = [
  { id: "pay", label: "Paiement" },
  { id: "hold", label: "Séquestre" },
  { id: "delivery", label: "Livraison" },
  { id: "done", label: "Terminé" },
] as const;

const SELLER_STEPS = [
  { id: "order", label: "Commande reçue" },
  { id: "ship", label: "Livraison" },
  { id: "pin", label: "Code validé" },
  { id: "paid", label: "Argent libéré" },
] as const;

function mapSteps(
  templates: readonly { id: string; label: string }[],
  activeIndex: number
): TimelineStep[] {
  return templates.map((step, i) => ({
    ...step,
    done: i < activeIndex,
    active: i === activeIndex,
  }));
}

export function getBuyerTimeline(status: OrderStatus): TimelineStep[] {
  const index: Record<OrderStatus, number> = {
    pending_payment: 0,
    paid: 1,
    protection: 2,
    released: 3,
    dispute: 2,
    refunded: 3,
    cancelled: 0,
  };
  if (status === "dispute") {
    return BUYER_STEPS.map((step, i) => ({
      ...step,
      label: i === 2 ? "Litige ouvert" : step.label,
      done: i < 2,
      active: i === 2,
    }));
  }
  if (status === "refunded") {
    return BUYER_STEPS.map((step, i) => ({
      ...step,
      label: i === 3 ? "Remboursé" : step.label,
      done: i <= 3,
      active: i === 3,
    }));
  }
  return mapSteps(BUYER_STEPS, index[status]);
}

export function getSellerTimeline(status: OrderStatus): TimelineStep[] {
  const index: Record<OrderStatus, number> = {
    pending_payment: 0,
    paid: 1,
    protection: 2,
    released: 3,
    dispute: 2,
    refunded: 3,
    cancelled: 0,
  };
  if (status === "dispute") {
    return SELLER_STEPS.map((step, i) => ({
      ...step,
      label: i === 2 ? "Litige" : step.label,
      done: i < 2,
      active: i === 2,
    }));
  }
  return mapSteps(SELLER_STEPS, index[status]);
}

export function getSellerHumanStatus(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_payment: "En attente de paiement",
    paid: "En attente de livraison",
    protection: "Libération en cours",
    released: "Disponible sur votre compte",
    dispute: "Bloqué — litige",
    refunded: "Remboursée au client",
    cancelled: "Annulée par le vendeur",
  };
  return labels[status];
}

export function getBuyerHumanStatus(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_payment: "À payer",
    paid: "Argent protégé — en attente du colis",
    protection: "Colis reçu — délai de vérification",
    released: "Transaction terminée",
    dispute: "Litige en cours",
    refunded: "Remboursé",
    cancelled: "Commande annulée — remboursement en cours",
  };
  return labels[status];
}
