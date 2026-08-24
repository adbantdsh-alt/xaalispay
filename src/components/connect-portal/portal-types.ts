/** Types portail Connect — forme directe des réponses Django
 * (api/v1/connect/*), snake_case, pas d'adaptateur : ces vues sont déjà
 * platform-scopées côté serializer (EscrowTransactionSerializer,
 * ConnectedAccountSerializer…), rien à ré-agréger côté client. */

export interface PortalAccount {
  id: string;
  kind: string;
  external_ref: string | null;
  display_name: string;
  payout_method: string;
  payout_phone: string;
  status: string;
  created_at: string;
}

export interface PortalAccountBalance {
  escrow_balance: number;
  available_balance: number;
  blocked_balance: number;
  paid_out_balance: number;
  updated_at: string;
}

export interface PortalTransaction {
  id: string;
  external_ref: string | null;
  amount: number;
  currency: string;
  country: string;
  status: string;
  release_policy: string;
  application_fee: number;
  xaalispay_fee: number;
  created_at: string;
  funded_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
}

export interface PortalAPIKey {
  id: string;
  label: string;
  key_prefix: string;
  mode: "live" | "test";
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface PortalWebhookEndpoint {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
  created_at: string;
}

export interface PortalWebhookDelivery {
  id: string;
  event_type: string;
  status: string;
  attempts: number;
  next_retry_at: string | null;
  last_error: string;
  delivered_at: string | null;
  created_at: string;
}

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  funded: "Financée",
  partially_released: "Partiellement libérée",
  released: "Libérée",
  refunded: "Remboursée",
  disputed: "En litige",
  cancelled: "Annulée",
};

export function transactionStatusLabel(status: string): string {
  return TRANSACTION_STATUS_LABELS[status] ?? status;
}

export function transactionStatusClass(status: string): string {
  if (status === "disputed" || status === "cancelled") return "bad";
  if (status === "released") return "good";
  if (status === "refunded") return "neutral";
  if (status === "pending_payment") return "warn";
  return "neutral";
}

export function formatPortalDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
