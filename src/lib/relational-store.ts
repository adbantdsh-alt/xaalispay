import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthUser,
  Database,
  LedgerEntry,
  Order,
  PaymentAttempt,
  Payout,
  Product,
  Profile,
  SellerBalance,
  WebhookEvent,
} from "./types";
import { createAdminClient } from "./supabase/admin";
import { isRemoteStoreEnabled } from "./data-store";

const META_ID = "main";
const CHUNK = 200;

export interface RelationalMigrationStatus {
  enabled: boolean;
  schemaReady: boolean;
  lastMigratedAt: string | null;
  counts: Record<string, number>;
}

export interface RelationalMigrationResult {
  ok: boolean;
  migratedAt: string;
  counts: Record<string, number>;
  errors: string[];
}

function toIso(value?: string) {
  return value || null;
}

function mapProfile(p: Profile) {
  return {
    id: p.id,
    username: p.username,
    display_name: p.displayName,
    business_name: p.businessName,
    phone: p.phone ?? null,
    role: p.role ?? "seller",
    email_verified_at: toIso(p.emailVerifiedAt),
    username_changed_at: toIso(p.usernameChangedAt),
    payout_method: p.payoutMethod ?? null,
    payout_phone: p.payoutPhone ?? null,
    auto_payout_enabled: p.autoPayoutEnabled ?? false,
    auto_payout_mode: p.autoPayoutMode ?? null,
    auto_payout_min_amount: p.autoPayoutMinAmount ?? null,
    auto_payout_fixed_amount: p.autoPayoutFixedAmount ?? null,
    auto_payout_min_completed_orders: p.autoPayoutMinCompletedOrders ?? null,
    created_at: p.createdAt,
  };
}

function mapAuthUser(u: AuthUser) {
  return {
    id: u.id,
    email: u.email,
    password_hash: u.passwordHash,
    created_at: u.createdAt,
  };
}

function mapProduct(p: Product) {
  return {
    id: p.id,
    seller_id: p.sellerId,
    payment_slug: p.paymentSlug ?? "",
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    delivery_cost: p.deliveryCost ?? 0,
    delivery_hours: p.deliveryHours,
    note: p.note ?? "",
    image: p.image ?? "",
    active: p.active !== false,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function mapOrder(o: Order) {
  return {
    id: o.id,
    seller_id: o.sellerId,
    product_id: o.productId ?? null,
    slug: o.slug,
    pin: o.pin,
    client_name: o.clientName,
    client_first_name: o.clientFirstName ?? "",
    client_phone: o.clientPhone,
    client_address: o.clientAddress ?? "",
    client_note: o.clientNote ?? "",
    product_name: o.productName,
    product_price: o.productPrice,
    delivery_cost: o.deliveryCost ?? 0,
    delivery_hours: o.deliveryHours,
    status: o.status,
    payment_method: o.paymentMethod ?? null,
    payment_reference: o.paymentReference ?? null,
    payment_provider: o.paymentProvider ?? null,
    payment_provider_id: o.paymentProviderId ?? null,
    payment_provider_status: o.paymentProviderStatus ?? null,
    payment_provider_message: o.paymentProviderMessage ?? null,
    paid_at: toIso(o.paidAt),
    delivery_deadline_at: toIso(o.deliveryDeadlineAt),
    delivery_validated_at: toIso(o.deliveryValidatedAt),
    delivery_code_issued_at: toIso(o.deliveryCodeIssuedAt),
    delivery_code_expires_at: toIso(o.deliveryCodeExpiresAt),
    client_delivery_confirmed_at: toIso(o.clientDeliveryConfirmedAt),
    protection_ends_at: toIso(o.protectionEndsAt),
    dispute_reason: o.disputeReason ?? null,
    dispute_photos: o.disputePhotos ?? [],
    dispute_media: o.disputeMedia ?? [],
    dispute_opened_at: toIso(o.disputeOpenedAt),
    released_at: toIso(o.releasedAt),
    refunded_at: toIso(o.refundedAt),
    cancelled_at: toIso(o.cancelledAt),
    cancellation_reason: o.cancellationReason ?? null,
    buyer_protection_fee: o.buyerProtectionFee ?? null,
    seller_commission: o.sellerCommission ?? null,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
}

function mapLedgerEntry(e: LedgerEntry) {
  return {
    id: e.id,
    seller_id: e.sellerId,
    order_id: e.orderId ?? null,
    payout_id: e.payoutId ?? null,
    webhook_event_id: e.webhookEventId ?? null,
    type: e.type,
    pocket: e.pocket,
    amount: e.amount,
    direction: e.direction,
    reference: e.reference,
    description: e.description ?? null,
    created_at: e.createdAt,
  };
}

function mapSellerBalance(b: SellerBalance) {
  return {
    seller_id: b.sellerId,
    escrow_balance: b.escrowBalance,
    available_balance: b.availableBalance,
    blocked_balance: b.blockedBalance,
    paid_out_balance: b.paidOutBalance,
    updated_at: b.updatedAt,
  };
}

function mapPaymentAttempt(a: PaymentAttempt) {
  return {
    id: a.id,
    order_id: a.orderId,
    order_slug: a.orderSlug,
    seller_id: a.sellerId,
    payment_reference: a.paymentReference,
    payment_method: a.paymentMethod,
    provider: a.provider,
    provider_id: a.providerId ?? null,
    payment_url: a.paymentUrl ?? null,
    qr_code: a.qrCode ?? null,
    status: a.status,
    message: a.message ?? null,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

function mapWebhookEvent(e: WebhookEvent) {
  return {
    id: e.id,
    provider: e.provider,
    event_key: e.eventKey,
    reference: e.reference ?? null,
    status: e.status,
    payload: e.payload ?? null,
    created_at: e.createdAt,
  };
}

function mapPayout(p: Payout) {
  return {
    id: p.id,
    seller_id: p.sellerId,
    amount: p.amount,
    net_amount: p.netAmount ?? null,
    fee: p.fee ?? null,
    method: p.method,
    phone: p.phone,
    status: p.status,
    provider: p.provider ?? null,
    provider_id: p.providerId ?? null,
    failure_reason: p.failureReason ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

async function upsertChunks(
  admin: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  errors: string[]
): Promise<number> {
  if (rows.length === 0) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await admin.from(table).upsert(slice, { onConflict: "id" });
    if (error) {
      errors.push(`${table}: ${error.message}`);
      break;
    }
    written += slice.length;
  }
  return written;
}

async function upsertBalances(
  admin: SupabaseClient,
  rows: ReturnType<typeof mapSellerBalance>[],
  errors: string[]
): Promise<number> {
  if (rows.length === 0) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("xp_seller_balances").upsert(slice, {
      onConflict: "seller_id",
    });
    if (error) {
      errors.push(`xp_seller_balances: ${error.message}`);
      break;
    }
    written += slice.length;
  }
  return written;
}

export async function getRelationalMigrationStatus(): Promise<RelationalMigrationStatus> {
  if (!isRemoteStoreEnabled()) {
    return {
      enabled: false,
      schemaReady: false,
      lastMigratedAt: null,
      counts: {},
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      enabled: true,
      schemaReady: false,
      lastMigratedAt: null,
      counts: {},
    };
  }

  const { error: probeError } = await admin.from("xp_profiles").select("id").limit(1);
  if (probeError) {
    return {
      enabled: true,
      schemaReady: false,
      lastMigratedAt: null,
      counts: {},
    };
  }

  const { data: meta } = await admin
    .from("xp_migration_meta")
    .select("migrated_at, counts")
    .eq("id", META_ID)
    .maybeSingle();

  return {
    enabled: true,
    schemaReady: true,
    lastMigratedAt: meta?.migrated_at ?? null,
    counts: (meta?.counts as Record<string, number>) ?? {},
  };
}

export async function migrateAppStateToRelational(db: Database): Promise<RelationalMigrationResult> {
  const admin = createAdminClient();
  const errors: string[] = [];
  const migratedAt = new Date().toISOString();

  if (!admin) {
    return {
      ok: false,
      migratedAt,
      counts: {},
      errors: ["Client Supabase admin indisponible"],
    };
  }

  const counts: Record<string, number> = {};

  counts.profiles = await upsertChunks(
    admin,
    "xp_profiles",
    db.profiles.map(mapProfile),
    errors
  );
  counts.auth_users = await upsertChunks(
    admin,
    "xp_auth_users",
    db.authUsers.map(mapAuthUser),
    errors
  );
  counts.products = await upsertChunks(
    admin,
    "xp_products",
    db.products.map(mapProduct),
    errors
  );
  counts.orders = await upsertChunks(
    admin,
    "xp_orders",
    db.orders.map(mapOrder),
    errors
  );
  counts.ledger_entries = await upsertChunks(
    admin,
    "xp_ledger_entries",
    db.ledgerEntries.map(mapLedgerEntry),
    errors
  );
  counts.seller_balances = await upsertBalances(
    admin,
    db.sellerBalances.map(mapSellerBalance),
    errors
  );
  counts.payment_attempts = await upsertChunks(
    admin,
    "xp_payment_attempts",
    db.paymentAttempts.map(mapPaymentAttempt),
    errors
  );
  counts.webhook_events = await upsertChunks(
    admin,
    "xp_webhook_events",
    db.webhookEvents.map(mapWebhookEvent),
    errors
  );
  counts.payouts = await upsertChunks(
    admin,
    "xp_payouts",
    db.payouts.map(mapPayout),
    errors
  );

  if (errors.length === 0) {
    await admin.from("xp_migration_meta").upsert({
      id: META_ID,
      migrated_at: migratedAt,
      counts,
    });
  }

  return {
    ok: errors.length === 0,
    migratedAt,
    counts,
    errors,
  };
}
