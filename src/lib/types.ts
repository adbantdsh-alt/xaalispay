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
  phone?: string;
  role?: "super_admin" | "seller";
  emailVerifiedAt?: string;
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

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  paymentSlug: string;
  name: string;
  description: string;
  price: number;
  deliveryCost: number;
  deliveryHours: number;
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

export interface Order {
  id: string;
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
  disputeReason?: string;
  disputePhotos?: string[];
  disputeMedia?: DisputeMedia[];
  disputeOpenedAt?: string;
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

export interface Database {
  authUsers: AuthUser[];
  profiles: Profile[];
  products: Product[];
  orders: Order[];
  ledgerEntries: LedgerEntry[];
  sellerBalances: SellerBalance[];
  paymentAttempts: PaymentAttempt[];
  webhookEvents: WebhookEvent[];
  payouts: Payout[];
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
