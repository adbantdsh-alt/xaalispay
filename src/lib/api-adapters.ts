/** Django (DRF) renvoie du snake_case ; tout le code existant (composants,
 * fonctions utilitaires comme computeWalletBreakdown/computeSellerStats)
 * attend le camelCase de src/lib/types.ts. Ces fonctions isolent la
 * conversion en un seul endroit plutôt que de réécrire ces composants. */
import type { DeliveryZone, Dispute, DisputeMedia, Order, Product, Profile } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export function adaptDeliveryZone(z: Json): DeliveryZone {
  return { id: String(z.id), name: z.name, price: z.price };
}

function adaptDeliveryZones(zones: Json[] | undefined): DeliveryZone[] {
  if (!zones) return [];
  return zones.map(adaptDeliveryZone);
}

export function adaptProfile(p: Json): Profile {
  return {
    id: String(p.id),
    username: p.username,
    displayName: p.display_name,
    businessName: p.business_name,
    phone: p.phone,
    email: p.email || undefined,
    role: p.role,
    usernameChangedAt: p.username_changed_at || undefined,
    payoutMethod: p.payout_method || undefined,
    payoutPhone: p.payout_phone || undefined,
    autoPayoutEnabled: p.auto_payout_enabled,
    autoPayoutMode: p.auto_payout_mode || undefined,
    autoPayoutMinAmount: p.auto_payout_min_amount ?? undefined,
    autoPayoutFixedAmount: p.auto_payout_fixed_amount ?? undefined,
    autoPayoutMinCompletedOrders: p.auto_payout_min_completed_orders ?? undefined,
    createdAt: p.created_at,
  };
}

function adaptDisputeMedia(items: Json[] | undefined): DisputeMedia[] {
  if (!items) return [];
  return items.map((m) => ({ type: m.type, url: m.url, name: m.name || undefined }));
}

export function adaptDispute(d: Json | null | undefined): Dispute | undefined {
  if (!d) return undefined;
  return {
    disputeType: d.dispute_type,
    disputeTypeLabel: d.dispute_type_display,
    responsibleParty: d.responsible_party,
    reason: d.reason,
    openedAt: d.opened_at,
    sellerResponseDeadlineAt: d.seller_response_deadline_at,
    resolvedAt: d.resolved_at || undefined,
    resolutionAction: d.resolution_action || undefined,
    refundAmount: d.refund_amount ?? undefined,
    resolutionNote: d.resolution_note || undefined,
    autoResolved: !!d.auto_resolved,
    media: adaptDisputeMedia(d.media),
  };
}

/** Vue vendeur d'une commande (OrderSellerSerializer côté Django). Le PIN
 * n'est jamais renvoyé après la création — `pin` reste vide ici, rien dans
 * l'UI vendeur ne le lit (le vendeur saisit le code qu'on lui donne en main,
 * il ne le lit pas depuis l'API). */
export function adaptOrder(o: Json): Order {
  return {
    id: String(o.id),
    orderNumber: o.order_number,
    sellerId: "",
    productId: "",
    slug: o.slug,
    pin: "",
    clientName: o.client_name || "",
    clientFirstName: "",
    clientPhone: o.client_phone || "",
    clientAddress: o.client_address || "",
    clientNote: "",
    productName: o.product_name,
    productPrice: o.product_price,
    deliveryCost: o.delivery_cost || 0,
    deliveryHours: o.delivery_hours || 0,
    deliveryZoneLabel: o.delivery_zone_label || undefined,
    status: o.status,
    paymentMethod: o.payment_method || undefined,
    paidAt: o.paid_at || undefined,
    deliveryDeadlineAt: o.delivery_deadline_at || undefined,
    protectionEndsAt: o.protection_ends_at || undefined,
    dispute: adaptDispute(o.dispute),
    releasedAt: o.released_at || undefined,
    refundedAt: o.refunded_at || undefined,
    cancelledAt: o.cancelled_at || undefined,
    cancellationReason: o.cancellation_reason || undefined,
    buyerProtectionFee: o.buyer_protection_fee ?? undefined,
    sellerCommission: o.seller_commission ?? undefined,
    createdAt: o.created_at,
    updatedAt: o.created_at,
  };
}

export interface WalletOverviewResponse {
  escrow_balance: number;
  available_balance: number;
  blocked_balance: number;
  paid_out_balance: number;
  sequestered: Array<{
    order_id: number;
    slug: string;
    product_name: string;
    client_name: string;
    amount: number;
    status: string;
    protection_ends_at: string | null;
  }>;
  sequestered_total: number;
  protection_minutes: number;
}

export interface AdaptedWallet {
  available: number;
  blocked: number;
  sequestered: Array<{
    orderId: string;
    productName: string;
    amount: number;
    status: string;
    protectionEndsAt?: string;
  }>;
  sequesteredTotal: number;
}

export function adaptWallet(w: WalletOverviewResponse): AdaptedWallet {
  return {
    available: w.available_balance,
    blocked: w.blocked_balance,
    sequestered: w.sequestered.map((s) => ({
      orderId: String(s.order_id),
      productName: s.product_name,
      amount: s.amount,
      status: s.status,
      protectionEndsAt: s.protection_ends_at || undefined,
    })),
    sequesteredTotal: w.sequestered_total,
  };
}

export interface AdaptedTransaction {
  id: string;
  label: string;
  detail?: string;
  signedAmount: number;
  direction: "credit" | "debit";
  createdAt: string;
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  escrow_credit: "Paiement reçu",
  escrow_release: "Vente validée",
  dispute_hold: "Litige — fonds bloqués",
  refund_debit: "Remboursement",
  payout_debit: "Retrait",
  payout_reversal: "Retrait annulé",
};

export function adaptTransaction(t: Json): AdaptedTransaction {
  return {
    id: String(t.id),
    label: ENTRY_TYPE_LABELS[t.entry_type] || t.entry_type,
    detail: t.description || undefined,
    signedAmount: t.signed_amount,
    direction: t.direction,
    createdAt: t.created_at,
  };
}

export interface AdaptedPayout {
  id: string;
  amount: number;
  netAmount?: number;
  fee?: number;
  method: "wave" | "orange";
  phone: string;
  status: "pending" | "processing" | "success" | "failed";
  failureReason?: string;
  createdAt: string;
}

const PAYOUT_STATUS_MAP: Record<string, AdaptedPayout["status"]> = {
  pending: "pending",
  processing: "processing",
  succeeded: "success",
  failed: "failed",
};

export function adaptPayout(p: Json): AdaptedPayout {
  return {
    id: String(p.id),
    amount: p.amount,
    netAmount: p.net_amount ?? undefined,
    fee: p.fee ?? undefined,
    method: p.method,
    phone: p.phone,
    status: PAYOUT_STATUS_MAP[p.status] || "pending",
    failureReason: p.failure_reason || undefined,
    createdAt: p.created_at,
  };
}

export function adaptProduct(p: Json): Product {
  return {
    id: String(p.id),
    sellerId: "",
    paymentSlug: p.payment_slug,
    name: p.name,
    description: p.description || "",
    price: p.price,
    deliveryZones: adaptDeliveryZones(p.delivery_zones),
    note: p.note || "",
    image: p.image || "",
    active: p.active,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/** Inverse d'adaptProduct : champs camelCase du formulaire -> payload Django.
 * `image` est volontairement omis si vide pour ne jamais écraser une image
 * existante par erreur — l'appelant l'ajoute explicitement pour la supprimer. */
export function toProductPayload(fields: {
  name: string;
  description?: string;
  price: number;
  deliveryZoneIds?: number[];
  note?: string;
  image?: string;
}): Json {
  return {
    name: fields.name,
    description: fields.description || "",
    price: fields.price,
    delivery_zone_ids: fields.deliveryZoneIds || [],
    note: fields.note || "",
    image: fields.image ?? "",
  };
}

export interface AdaptedDeliverySession {
  slug: string;
  status: Order["status"];
  productName: string;
  pin: string;
  deliveryCodeIssuedAt?: string;
  deliveryCodeExpiresAt?: string;
  protectionEndsAt?: string;
}

/** Forme acheteur (OrderPublicSerializer) — distincte d'adaptOrder (vue
 * vendeur, OrderSellerSerializer, qui n'expose jamais "pin"). */
export function adaptDeliverySession(o: Json): AdaptedDeliverySession {
  return {
    slug: o.slug,
    status: o.status,
    productName: o.product_name,
    pin: o.pin || "",
    deliveryCodeIssuedAt: o.delivery_code_issued_at || undefined,
    deliveryCodeExpiresAt: o.delivery_code_expires_at || undefined,
    protectionEndsAt: o.protection_ends_at || undefined,
  };
}

export interface AdaptedPayOrder {
  productName: string;
  productPrice: number;
  deliveryCost: number;
  productImage?: string;
  productDescription?: string;
  productNote?: string;
  deliveryHours?: number;
  deliveryZoneLabel?: string;
  /** Zones configurées par le vendeur — seulement présent avant la création
   * de la commande (le buyer doit en choisir une pour fixer le prix). */
  deliveryZones?: DeliveryZone[];
  status: string;
  slug: string;
  isProductLink?: boolean;
  pin?: string;
  protectionEndsAt?: string;
  protectionMinutes?: number;
  seller: { displayName: string; username: string; phone?: string };
  fees?: { subtotal: number; buyerProtectionFee: number; checkoutTotal: number };
}

/** Avant la création de la commande : la page de paiement n'a qu'un produit
 * (PublicProductSerializer), pas encore de commande — le prix de livraison
 * n'est pas encore connu, il dépend de la zone que l'acheteur va choisir. */
export function adaptPublicProductToPayOrder(p: Json): AdaptedPayOrder {
  return {
    productName: p.name,
    productPrice: p.price,
    deliveryCost: 0,
    productImage: p.image || undefined,
    productDescription: p.description || undefined,
    productNote: p.note || undefined,
    deliveryZones: adaptDeliveryZones(p.delivery_zones),
    status: "pending_payment",
    slug: p.payment_slug,
    isProductLink: true,
    seller: { displayName: p.seller_display_name, username: p.seller_username },
  };
}

/** Après création de la commande (OrderPublicSerializer) — suivi du statut. */
export function adaptOrderToPayOrder(o: Json): AdaptedPayOrder {
  return {
    productName: o.product_name,
    productPrice: o.product_price,
    deliveryCost: o.delivery_cost || 0,
    productImage: o.product_image || undefined,
    productDescription: o.product_description || undefined,
    deliveryHours: o.delivery_hours,
    deliveryZoneLabel: o.delivery_zone_label || undefined,
    status: o.status,
    slug: o.slug,
    isProductLink: false,
    pin: o.pin || undefined,
    protectionEndsAt: o.protection_ends_at || undefined,
    protectionMinutes: o.protection_minutes,
    seller: { displayName: o.seller_business_name || "", username: o.seller_username || "" },
    fees: {
      subtotal: o.total_amount,
      buyerProtectionFee: o.buyer_protection_fee,
      checkoutTotal: o.checkout_total,
    },
  };
}
