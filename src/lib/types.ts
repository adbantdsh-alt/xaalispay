export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "protection"
  | "released"
  | "dispute"
  | "refunded"
  | "cancelled";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  businessName: string;
  // Identifiant de connexion (E.164, +221XXXXXXXXX) — toujours présent,
  // immuable après l'inscription (vérifié par OTP, voir apps.accounts).
  phone: string;
  email?: string | null;
  role?: "super_admin" | "seller";
  usernameChangedAt?: string;
  payoutMethod?: "wave" | "orange";
  payoutPhone?: string;
  autoPayoutEnabled?: boolean;
  autoPayoutMode?: "full_balance" | "fixed_amount";
  autoPayoutMinAmount?: number;
  autoPayoutFixedAmount?: number;
  autoPayoutMinCompletedOrders?: number;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  sellerId: string;
  paymentSlug: string;
  name: string;
  description: string;
  price: number;
  deliveryZones: DeliveryZone[];
  note: string;
  image: string;
  hasImage?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeMedia {
  type: "image" | "video";
  url: string;
  name?: string;
}

export type DisputeType =
  | "non_conforme"
  | "non_fonctionnel"
  | "erreur_taille_couleur"
  | "annulation_caprice"
  | "colis_endommage"
  | "article_manquant"
  | "autre";

export type DisputeResponsibleParty = "vendeur" | "client" | "admin";

export type DisputeResolutionAction = "release_full" | "refund_full" | "split";

export interface Dispute {
  disputeType: DisputeType;
  disputeTypeLabel: string;
  responsibleParty: DisputeResponsibleParty;
  reason: string;
  openedAt: string;
  sellerResponseDeadlineAt: string;
  resolvedAt?: string;
  resolutionAction?: DisputeResolutionAction;
  refundAmount?: number;
  resolutionNote?: string;
  autoResolved: boolean;
  media: DisputeMedia[];
}

export interface Order {
  id: string;
  /** Référence lisible et permanente (ex. "XP-000128") — contrairement au
   * slug (opaque) et au pin (4 chiffres, non unique, masqué hors paid/
   * protection), c'est la seule référence stable à donner au support. */
  orderNumber: string;
  sellerId: string;
  productId: string;
  slug: string;
  pin: string;
  clientName: string;
  clientFirstName: string;
  clientPhone: string;
  clientAddress: string;
  clientNote: string;
  productName: string;
  productPrice: number;
  deliveryCost: number;
  deliveryHours: number;
  /** Libellé dénormalisé de la zone choisie par l'acheteur (ex. "Pikine (Dakar)"). */
  deliveryZoneLabel?: string;
  status: OrderStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProvider?: "bictorys";
  paymentProviderId?: string;
  paymentProviderStatus?: string;
  paymentProviderMessage?: string;
  paidAt?: string;
  deliveryDeadlineAt?: string;
  deliveryValidatedAt?: string;
  /** Horodatage émission code livraison (preuve de vie 15 min). */
  deliveryCodeIssuedAt?: string;
  deliveryCodeExpiresAt?: string;
  /** Confirmation réception par l'acheteur sur la page sécurisée. */
  clientDeliveryConfirmedAt?: string;
  protectionEndsAt?: string;
  dispute?: Dispute;
  releasedAt?: string;
  refundedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  /** Frais protection séquestre côté acheteur (1 %, plafond 500 F). */
  buyerProtectionFee?: number;
  /** Commission vendeur prélevée à la libération (2 %). */
  sellerCommission?: number;
  /** URL image produit (enrichie côté API dashboard). */
  productImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType =
  | "escrow_credit"
  | "escrow_release"
  | "dispute_hold"
  | "refund_debit"
  | "payout_debit"
  | "payout_reversal"
  | "seller_commission";

export type LedgerPocket = "escrow" | "available" | "blocked" | "paid_out";

export interface LedgerEntry {
  id: string;
  sellerId: string;
  orderId?: string;
  payoutId?: string;
  webhookEventId?: string;
  type: LedgerEntryType;
  pocket: LedgerPocket;
  amount: number;
  direction: "credit" | "debit";
  reference: string;
  description?: string;
  createdAt: string;
}

export interface SellerBalance {
  sellerId: string;
  escrowBalance: number;
  availableBalance: number;
  blockedBalance: number;
  paidOutBalance: number;
  updatedAt: string;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  orderSlug: string;
  sellerId: string;
  paymentReference: string;
  paymentMethod: string;
  provider: "bictorys";
  providerId?: string;
  paymentUrl?: string;
  qrCode?: string;
  status: "initiated" | "pending" | "success" | "failed";
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  provider: "bictorys";
  eventKey: string;
  reference?: string;
  status: "processed" | "ignored" | "failed";
  payload: unknown;
  createdAt: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  amount: number;
  /** Montant envoyé sur Wave/Orange après frais de retrait. */
  netAmount?: number;
  /** Frais de retrait XaalisPay (1,5 % + 75 F). */
  fee?: number;
  method: "wave" | "orange";
  phone: string;
  status: "pending" | "processing" | "success" | "failed";
  provider?: "bictorys";
  providerId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payée — en séquestre",
  protection: "Séquestre Flash (30 min)",
  released: "Libérée",
  dispute: "Litige",
  refunded: "Remboursée",
  cancelled: "Annulée",
};
