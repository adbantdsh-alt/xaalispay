import { getDb, updateDb, getDbStorageMode } from "./db";
import { tryConfirmPaymentFromBictorys } from "./orders";
import { getOrderTotal } from "./utils";
import type { Order, Profile } from "./types";
import { getProdConfigSummary } from "./prod-config";
import { logAdminAction } from "./admin-audit";

const STALE_PENDING_MS = 6 * 60 * 60 * 1000;

export interface AdminAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  count?: number;
  action?: "orders" | "payouts" | "disputes" | "pilote";
}

export interface AdminSearchHit {
  type: "order" | "vendor" | "payout";
  id: string;
  label: string;
  sublabel: string;
  status?: string;
  amount?: number;
}

function isSeller(profile: Profile) {
  return profile.role !== "super_admin";
}

export function getAdminAlerts(input: {
  pendingPayments: number;
  failedPayouts: number;
  openDisputes: number;
  storage: string;
  prodReady: boolean;
  missingCount: number;
  stalePendingCount: number;
}): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  if (input.storage !== "remote") {
    alerts.push({
      id: "storage-local",
      severity: "critical",
      title: "Stockage local — pas la prod",
      detail: "Configurez SUPABASE_SERVICE_ROLE_KEY sur Vercel pour utiliser Supabase.",
    });
  }

  if (input.missingCount > 0) {
    alerts.push({
      id: "env-missing",
      severity: "critical",
      title: `${input.missingCount} variable(s) prod manquante(s)`,
      detail: "AUTH_SECRET, CRON_SECRET et clés Bictorys requis avant go-live.",
    });
  }

  if (input.stalePendingCount > 0) {
    alerts.push({
      id: "stale-pending",
      severity: "warning",
      title: `${input.stalePendingCount} paiement(s) test bloqué(s)`,
      detail: "Commandes en attente depuis > 6 h — réconcilier ou expirer depuis Commandes.",
      count: input.stalePendingCount,
      action: "orders",
    });
  } else if (input.pendingPayments > 0) {
    alerts.push({
      id: "pending-payments",
      severity: "info",
      title: `${input.pendingPayments} paiement(s) en attente`,
      detail: "Réconcilier via Bictorys si le client a payé.",
      count: input.pendingPayments,
      action: "orders",
    });
  }

  if (input.failedPayouts > 0) {
    alerts.push({
      id: "failed-payouts",
      severity: "warning",
      title: `${input.failedPayouts} retrait(s) échoué(s)`,
      detail: "Relancer depuis Retraits ou vérifier Bictorys.",
      count: input.failedPayouts,
      action: "payouts",
    });
  }

  if (input.openDisputes > 0) {
    alerts.push({
      id: "open-disputes",
      severity: "warning",
      title: `${input.openDisputes} litige(s) ouvert(s)`,
      detail: "Arbitrer depuis l'onglet Litiges.",
      count: input.openDisputes,
      action: "disputes",
    });
  }

  if (!input.prodReady && input.storage === "remote") {
    alerts.push({
      id: "prod-config",
      severity: "info",
      title: "Checklist prod incomplète",
      detail: "Voir Paramètres techniques en bas de la vue d'ensemble.",
    });
  }

  return alerts;
}

export function countStalePendingOrders(orders: Order[]): number {
  const cutoff = Date.now() - STALE_PENDING_MS;
  return orders.filter((order) => {
    if (order.status !== "pending_payment") return false;
    const created = new Date(order.createdAt).getTime();
    return !Number.isNaN(created) && created < cutoff;
  }).length;
}

export async function buildAdminAlertsFromDb() {
  const db = await getDb();
  const prod = getProdConfigSummary();
  const pendingPayments = db.orders.filter((o) => o.status === "pending_payment").length;
  const stalePendingCount = countStalePendingOrders(db.orders);

  return getAdminAlerts({
    pendingPayments,
    failedPayouts: db.payouts.filter((p) => p.status === "failed").length,
    openDisputes: db.orders.filter((o) => o.status === "dispute").length,
    storage: getDbStorageMode(),
    prodReady: prod.ready,
    missingCount: prod.missingCount,
    stalePendingCount,
  });
}

export async function adminGlobalSearch(query: string, limit = 20): Promise<AdminSearchHit[]> {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q || q.length < 2) return [];

  const db = await getDb();
  const profileById = new Map(db.profiles.map((p) => [p.id, p]));
  const hits: AdminSearchHit[] = [];

  for (const order of db.orders) {
    const seller = profileById.get(order.sellerId);
    const phone = (order.clientPhone || "").replace(/\D/g, "");
    const hay = [
      order.slug,
      order.id,
      order.productName,
      order.clientName,
      order.clientFirstName,
      order.paymentReference,
      seller?.username,
      phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (hay.includes(q)) {
      hits.push({
        type: "order",
        id: order.id,
        label: `${order.slug} — ${order.productName}`,
        sublabel: `@${seller?.username || "?"} · ${order.clientName || "Client"}`,
        status: order.status,
        amount: getOrderTotal(order),
      });
    }
  }

  for (const profile of db.profiles.filter(isSeller)) {
    const hay = `${profile.username} ${profile.displayName} ${profile.businessName} ${profile.phone || ""}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        type: "vendor",
        id: profile.id,
        label: `@${profile.username}`,
        sublabel: profile.displayName,
      });
    }
  }

  for (const payout of db.payouts) {
    const seller = profileById.get(payout.sellerId);
    const hay = `${payout.id} ${payout.phone} ${seller?.username || ""}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        type: "payout",
        id: payout.id,
        label: `Retrait ${seller?.username || payout.sellerId}`,
        sublabel: payout.phone,
        status: payout.status,
        amount: payout.amount,
      });
    }
  }

  return hits.slice(0, limit);
}

export async function reconcilePendingOrders(adminEmail?: string) {
  const db = await getDb();
  const pending = db.orders.filter((o) => o.status === "pending_payment");
  let confirmed = 0;
  let unchanged = 0;
  const errors: string[] = [];

  for (const order of pending) {
    try {
      const updated = await tryConfirmPaymentFromBictorys(order.slug);
      if (updated) confirmed++;
      else unchanged++;
    } catch (err) {
      errors.push(`${order.slug}: ${err instanceof Error ? err.message : "erreur"}`);
      unchanged++;
    }
  }

  if (confirmed > 0 || pending.length > 0) {
    await logAdminAction({
      action: "reconcile_pending",
      targetType: "system",
      targetId: "batch",
      detail: `${confirmed} confirmé(s), ${unchanged} inchangé(s) sur ${pending.length}`,
      adminEmail,
    });
  }

  return { total: pending.length, confirmed, unchanged, errors };
}

export async function expireStalePendingOrders(adminEmail?: string) {
  const cutoff = Date.now() - STALE_PENDING_MS;
  const now = new Date().toISOString();
  let expired = 0;

  await updateDb((db) => {
    for (const order of db.orders) {
      if (order.status !== "pending_payment") continue;
      const created = new Date(order.createdAt).getTime();
      if (Number.isNaN(created) || created >= cutoff) continue;
      order.status = "cancelled";
      order.cancelledAt = now;
      order.cancellationReason = "Expiré — paiement non finalisé (test ou abandon)";
      order.updatedAt = now;
      expired++;
    }
  });

  if (expired > 0) {
    await logAdminAction({
      action: "expire_stale_pending",
      targetType: "system",
      targetId: "batch",
      detail: `${expired} commande(s) expirée(s)`,
      adminEmail,
    });
  }

  return { expired };
}

export async function adminExpireOrder(orderId: string, adminEmail?: string) {
  const now = new Date().toISOString();
  let slug = "";

  await updateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order || order.status !== "pending_payment") return;
    slug = order.slug;
    order.status = "cancelled";
    order.cancelledAt = now;
    order.cancellationReason = "Expiré par admin — paiement non finalisé";
    order.updatedAt = now;
  });

  if (!slug) return null;

  await logAdminAction({
    action: "expire_order",
    targetType: "order",
    targetId: orderId,
    detail: slug,
    adminEmail,
  });

  return slug;
}

export async function adminReconcileOrder(orderId: string, adminEmail?: string) {
  const db = await getDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || order.status !== "pending_payment") return { ok: false as const, error: "Commande non éligible" };

  try {
    const updated = await tryConfirmPaymentFromBictorys(order.slug);
    if (updated) {
      await logAdminAction({
        action: "reconcile_order",
        targetType: "order",
        targetId: orderId,
        detail: order.slug,
        adminEmail,
      });
      return { ok: true as const, order: updated };
    }
    return { ok: false as const, error: "Toujours en attente chez Bictorys" };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Erreur Bictorys",
    };
  }
}
