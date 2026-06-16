/** Fenêtres de livraison vendeur (stockées en heures en base). */
export const DELIVERY_HOURS_TODAY = 24;
export const DELIVERY_HOURS_TOMORROW = 48;

export type DeliveryWindow = "today" | "tomorrow";

export function deliveryWindowToHours(window: DeliveryWindow): number {
  return window === "today" ? DELIVERY_HOURS_TODAY : DELIVERY_HOURS_TOMORROW;
}

export function hoursToDeliveryWindow(hours: number): DeliveryWindow {
  return hours <= DELIVERY_HOURS_TODAY ? "today" : "tomorrow";
}

export function formatDeliveryWindow(hours: number): string {
  if (hours <= DELIVERY_HOURS_TODAY) return "Aujourd'hui";
  if (hours <= DELIVERY_HOURS_TOMORROW) return "Demain";
  const days = Math.ceil(hours / 24);
  return `${days} jours`;
}

export const DELIVERY_DEADLINE_HOURS = 48;

export const CHARGEBACK_DANGER_RATE = 10;
