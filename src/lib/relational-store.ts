import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthUser,
  Database,
  DisputeMedia,
  LedgerEntry,
  Order,
  OrderStatus,
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
const PAGE = 1000;

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

function fromIso(value: string | null | undefined): string | undefined {
  return value ?? undefined;
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

function unmapProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    businessName: String(row.business_name),
    phone: row.phone ? String(row.phone) : undefined,
    role: (row.role as Profile["role"]) ?? "seller",
    emailVerifiedAt: fromIso(row.email_verified_at as string | null),
    usernameChangedAt: fromIso(row.username_changed_at as string | null),
    payoutMethod: row.payout_method as Profile["payoutMethod"],
    payoutPhone: row.payout_phone ? String(row.payout_phone) : undefined,
    autoPayoutEnabled: Boolean(row.auto_payout_enabled),
    autoPayoutMode: row.auto_payout_mode as Profile["autoPayoutMode"],
    autoPayoutMinAmount: row.auto_payout_min_amount as number | undefined,
    autoPayoutFixedAmount: row.auto_payout_fixed_amount as number | undefined,
    autoPayoutMinCompletedOrders: row.auto_payout_min_completed_orders as number | undefined,
    createdAt: String(row.created_at),
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

function unmapAuthUser(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    createdAt: String(row.created_at),
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

function unmapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    paymentSlug: String(row.payment_slug ?? ""),
    name: String(row.name),
    description: String(row.description ?? ""),
    price: Number(row.price),
    deliveryCost: Number(row.delivery_cost ?? 0),
    deliveryHours: Number(row.delivery_hours),
    note: String(row.note ?? ""),
    image: String(row.image ?? ""),
    active: row.active !== false,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
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

function unmapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    productId: String(row.product_id ?? ""),
    slug: String(row.slug),
    pin: String(row.pin),
    clientName: String(row.client_name),
    clientFirstName: String(row.client_first_name ?? ""),
    clientPhone: String(row.client_phone),
    clientAddress: String(row.client_address ?? ""),
    clientNote: String(row.client_note ?? ""),
    productName: String(row.product_name),
    productPrice: Number(row.product_price),
    deliveryCost: Number(row.delivery_cost ?? 0),
    deliveryHours: Number(row.delivery_hours),
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
    paymentReference: row.payment_reference ? String(row.payment_reference) : undefined,
    paymentProvider: row.payment_provider as Order["paymentProvider"],
    paymentProviderId: row.payment_provider_id ? String(row.payment_provider_id) : undefined,
    paymentProviderStatus: row.payment_provider_status ? String(row.payment_provider_status) : undefined,
    paymentProviderMessage: row.payment_provider_message ? String(row.payment_provider_message) : undefined,
    paidAt: fromIso(row.paid_at as string | null),
    deliveryDeadlineAt: fromIso(row.delivery_deadline_at as string | null),
    deliveryValidatedAt: fromIso(row.delivery_validated_at as string | null),
    deliveryCodeIssuedAt: fromIso(row.delivery_code_issued_at as string | null),
    deliveryCodeExpiresAt: fromIso(row.delivery_code_expires_at as string | null),
    clientDeliveryConfirmedAt: fromIso(row.client_delivery_confirmed_at as string | null),
    protectionEndsAt: fromIso(row.protection_ends_at as string | null),
    disputeReason: row.dispute_reason ? String(row.dispute_reason) : undefined,
    disputePhotos: (row.dispute_photos as string[]) ?? [],
    disputeMedia: (row.dispute_media as DisputeMedia[]) ?? [],
    disputeOpenedAt: fromIso(row.dispute_opened_at as string | null),
    releasedAt: fromIso(row.released_at as string | null),
    refundedAt: fromIso(row.refunded_at as string | null),
    cancelledAt: fromIso(row.cancelled_at as string | null),
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
    buyerProtectionFee: row.buyer_protection_fee as number | undefined,
    sellerCommission: row.seller_commission as number | undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
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

function unmapLedgerEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    orderId: row.order_id ? String(row.order_id) : undefined,
    payoutId: row.payout_id ? String(row.payout_id) : undefined,
    webhookEventId: row.webhook_event_id ? String(row.webhook_event_id) : undefined,
    type: row.type as LedgerEntry["type"],
    pocket: row.pocket as LedgerEntry["pocket"],
    amount: Number(row.amount),
    direction: row.direction as LedgerEntry["direction"],
    reference: String(row.reference),
    description: row.description ? String(row.description) : undefined,
    createdAt: String(row.created_at),
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

function unmapSellerBalance(row: Record<string, unknown>): SellerBalance {
  return {
    sellerId: String(row.seller_id),
    escrowBalance: Number(row.escrow_balance ?? 0),
    availableBalance: Number(row.available_balance ?? 0),
    blockedBalance: Number(row.blocked_balance ?? 0),
    paidOutBalance: Number(row.paid_out_balance ?? 0),
    updatedAt: String(row.updated_at),
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

function unmapPaymentAttempt(row: Record<string, unknown>): PaymentAttempt {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    orderSlug: String(row.order_slug),
    sellerId: String(row.seller_id),
    paymentReference: String(row.payment_reference),
    paymentMethod: String(row.payment_method),
    provider: row.provider as PaymentAttempt["provider"],
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    paymentUrl: row.payment_url ? String(row.payment_url) : undefined,
    qrCode: row.qr_code ? String(row.qr_code) : undefined,
    status: row.status as PaymentAttempt["status"],
    message: row.message ? String(row.message) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
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

function unmapWebhookEvent(row: Record<string, unknown>): WebhookEvent {
  return {
    id: String(row.id),
    provider: row.provider as WebhookEvent["provider"],
    eventKey: String(row.event_key),
    reference: row.reference ? String(row.reference) : undefined,
    status: row.status as WebhookEvent["status"],
    payload: row.payload,
    createdAt: String(row.created_at),
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

function unmapPayout(row: Record<string, unknown>): Payout {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    amount: Number(row.amount),
    netAmount: row.net_amount as number | undefined,
    fee: row.fee as number | undefined,
    method: row.method as Payout["method"],
    phone: String(row.phone),
    status: row.status as Payout["status"],
    provider: row.provider as Payout["provider"],
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

async function fetchAllRows(
  admin: SupabaseClient,
  table: string
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await admin.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return rows;
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

/** Charge la base depuis les tables xp_* (Phase 5B). Retourne null si schéma absent ou vide. */
export async function loadRelationalDatabase(): Promise<Database | null> {
  if (!isRemoteStoreEnabled()) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const status = await getRelationalMigrationStatus();
  if (!status.schemaReady) return null;

  try {
    const [
      profiles,
      authUsers,
      products,
      orders,
      ledgerEntries,
      sellerBalances,
      paymentAttempts,
      webhookEvents,
      payouts,
    ] = await Promise.all([
      fetchAllRows(admin, "xp_profiles"),
      fetchAllRows(admin, "xp_auth_users"),
      fetchAllRows(admin, "xp_products"),
      fetchAllRows(admin, "xp_orders"),
      fetchAllRows(admin, "xp_ledger_entries"),
      fetchAllRows(admin, "xp_seller_balances"),
      fetchAllRows(admin, "xp_payment_attempts"),
      fetchAllRows(admin, "xp_webhook_events"),
      fetchAllRows(admin, "xp_payouts"),
    ]);

    if (
      profiles.length === 0 &&
      orders.length === 0 &&
      products.length === 0 &&
      !status.lastMigratedAt
    ) {
      return null;
    }

    return {
      profiles: profiles.map(unmapProfile),
      authUsers: authUsers.map(unmapAuthUser),
      products: products.map(unmapProduct),
      orders: orders.map(unmapOrder),
      ledgerEntries: ledgerEntries.map(unmapLedgerEntry),
      sellerBalances: sellerBalances.map(unmapSellerBalance),
      paymentAttempts: paymentAttempts.map(unmapPaymentAttempt),
      webhookEvents: webhookEvents.map(unmapWebhookEvent),
      payouts: payouts.map(unmapPayout),
    };
  } catch (err) {
    console.error("[relational] load failed", err);
    return null;
  }
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

/** Alias Phase 5B — sync auto après chaque écriture. */
export const syncDatabaseToRelational = migrateAppStateToRelational;
