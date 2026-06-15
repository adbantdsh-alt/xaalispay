export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "protection"
  | "released"
  | "dispute"
  | "refunded";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  businessName: string;
  phone?: string;
  role?: "super_admin" | "seller";
  emailVerifiedAt?: string;
  usernameChangedAt?: string;
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
  protectionEndsAt?: string;
  disputeReason?: string;
  disputePhotos?: string[];
  disputeMedia?: DisputeMedia[];
  disputeOpenedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  authUsers: AuthUser[];
  profiles: Profile[];
  products: Product[];
  orders: Order[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payée — en séquestre",
  protection: "Séquestre Flash (30 min)",
  released: "Libérée",
  dispute: "Litige",
  refunded: "Remboursée",
};
