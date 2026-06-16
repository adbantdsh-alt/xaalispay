import type { Order } from "./types";

export interface ChargebackStats {
  /** Commandes payées qui comptent comme base de calcul. */
  totalPaid: number;
  /** Litiges perdus + annulations sur commandes déjà payées. */
  chargebacks: number;
  /** Ratio en % (0–100). */
  rate: number;
  /** Niveau de risque. */
  level: "ok" | "warning" | "danger";
  /** Vrai si le vendeur est sous hold (taux > 10 %). */
  onHold: boolean;
}

const DANGER_THRESHOLD = 10; // %
const WARNING_THRESHOLD = 5; // %

/**
 * Calcule le taux de chargebacks d'un vendeur.
 * Chargeback = remboursement après litige perdu OU annulation sur commande payée.
 */
export function computeChargebackStats(orders: Order[]): ChargebackStats {
  const relevant = orders.filter((o) =>
    ["paid", "protection", "released", "dispute", "refunded", "cancelled"].includes(o.status)
  );
  const totalPaid = relevant.length;

  const chargebacks = orders.filter(
    (o) =>
      o.status === "refunded" || // litige perdu (remboursé par admin)
      (o.status === "cancelled" && o.cancelledAt && o.paidAt) // annulé après paiement
  ).length;

  const rate = totalPaid > 0 ? Math.round((chargebacks / totalPaid) * 100) : 0;

  const level =
    rate >= DANGER_THRESHOLD ? "danger" : rate >= WARNING_THRESHOLD ? "warning" : "ok";

  return {
    totalPaid,
    chargebacks,
    rate,
    level,
    onHold: rate >= DANGER_THRESHOLD,
  };
}

export function chargebackLevelLabel(level: ChargebackStats["level"]): string {
  if (level === "danger") return "⚠️ Taux élevé — hold 48h actif";
  if (level === "warning") return "Taux à surveiller";
  return "Bon";
}
