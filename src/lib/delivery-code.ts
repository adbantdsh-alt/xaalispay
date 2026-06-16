/** Durée d'affichage actif du code livraison (preuve de vie). */
export const DELIVERY_CODE_TTL_MINUTES = 15;

export function getDeliveryCodeTtlMs(): number {
  return DELIVERY_CODE_TTL_MINUTES * 60 * 1000;
}

export function computeDeliveryCodeExpiresAt(from: Date = new Date()): string {
  return new Date(from.getTime() + getDeliveryCodeTtlMs()).toISOString();
}

export function issueDeliveryCodeTimestamps(from: Date = new Date()) {
  const issuedAt = from.toISOString();
  return {
    deliveryCodeIssuedAt: issuedAt,
    deliveryCodeExpiresAt: computeDeliveryCodeExpiresAt(from),
  };
}

export type DeliverySession = {
  orderId: string;
  slug: string;
  status: string;
  productName: string;
  pin: string;
  deliveryCodeIssuedAt?: string;
  deliveryCodeExpiresAt?: string;
  protectionEndsAt?: string;
  deliveryValidatedAt?: string;
  clientDeliveryConfirmedAt?: string;
};

export function toDeliverySession(order: {
  id: string;
  slug: string;
  status: string;
  productName: string;
  pin: string;
  paidAt?: string;
  deliveryCodeIssuedAt?: string;
  deliveryCodeExpiresAt?: string;
  protectionEndsAt?: string;
  deliveryValidatedAt?: string;
  clientDeliveryConfirmedAt?: string;
}): DeliverySession {
  return {
    orderId: order.id,
    slug: order.slug,
    status: order.status,
    productName: order.productName,
    pin: order.pin,
    deliveryCodeIssuedAt: order.deliveryCodeIssuedAt ?? order.paidAt,
    deliveryCodeExpiresAt:
      order.deliveryCodeExpiresAt ??
      (order.paidAt ? computeDeliveryCodeExpiresAt(new Date(order.paidAt)) : undefined),
    protectionEndsAt: order.protectionEndsAt,
    deliveryValidatedAt: order.deliveryValidatedAt,
    clientDeliveryConfirmedAt: order.clientDeliveryConfirmedAt,
  };
}
