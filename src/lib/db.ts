import fs from "fs";
import path from "path";
import type { Database } from "./types";
import { ensureProductPaymentSlugs, getOrderTotal } from "./utils";
import { computeDeliveryCodeExpiresAt } from "./delivery-code";
import {
  isRemoteStoreEnabled,
  loadRemoteDatabase,
  saveRemoteDatabase,
} from "./data-store";
import {
  loadRelationalDatabase,
  syncDatabaseToRelational,
} from "./relational-store";
import {
  isRelationalDualWriteEnabled,
  isRelationalReadEnabled,
} from "./runtime-env";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "xaalispay-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

let memoryDb: Database | null = null;
let loadPromise: Promise<Database> | null = null;
let inflightDb: Promise<Database> | null = null;

const defaultDb: Database = {
  authUsers: [],
  profiles: [],
  products: [],
  orders: [],
  ledgerEntries: [],
  sellerBalances: [],
  paymentAttempts: [],
  webhookEvents: [],
  payouts: [],
  adminAuditLog: [],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const BACKUP_PATH = `${DB_PATH}.bak`;

function ensureLedgerEntry(
  db: Database,
  data: {
    sellerId: string;
    orderId?: string;
    type: Database["ledgerEntries"][number]["type"];
    pocket: Database["ledgerEntries"][number]["pocket"];
    amount: number;
    direction: Database["ledgerEntries"][number]["direction"];
    reference: string;
    createdAt: string;
    description?: string;
  }
) {
  if (db.ledgerEntries.some((entry) => entry.reference === data.reference)) return;
  db.ledgerEntries.push({
    id: crypto.randomUUID(),
    ...data,
  });
}

function rebuildSellerBalances(db: Database) {
  db.sellerBalances = [];
  for (const entry of db.ledgerEntries) {
    let balance = db.sellerBalances.find((item) => item.sellerId === entry.sellerId);
    if (!balance) {
      balance = {
        sellerId: entry.sellerId,
        escrowBalance: 0,
        availableBalance: 0,
        blockedBalance: 0,
        paidOutBalance: 0,
        updatedAt: entry.createdAt,
      };
      db.sellerBalances.push(balance);
    }
    const key = {
      escrow: "escrowBalance",
      available: "availableBalance",
      blocked: "blockedBalance",
      paid_out: "paidOutBalance",
    }[entry.pocket] as "escrowBalance" | "availableBalance" | "blockedBalance" | "paidOutBalance";
    balance[key] += entry.direction === "credit" ? entry.amount : -entry.amount;
    balance.updatedAt = entry.createdAt;
  }
}

function backfillLedgerFromOrders(db: Database) {
  if (db.ledgerEntries.length > 0) return;
  for (const order of db.orders) {
    const amount = getOrderTotal(order);
    if (["paid", "protection", "dispute", "released", "refunded"].includes(order.status)) {
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "escrow_credit",
        pocket: "escrow",
        direction: "credit",
        amount,
        reference: `order:${order.id}:escrow_credit`,
        createdAt: order.paidAt || order.updatedAt || order.createdAt,
        description: "Migration paiement client confirmé",
      });
    }
    if (order.status === "released") {
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "escrow_release",
        pocket: "escrow",
        direction: "debit",
        amount,
        reference: `order:${order.id}:escrow_release:debit`,
        createdAt: order.releasedAt || order.updatedAt,
        description: "Migration sortie du séquestre",
      });
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "escrow_release",
        pocket: "available",
        direction: "credit",
        amount,
        reference: `order:${order.id}:escrow_release:credit`,
        createdAt: order.releasedAt || order.updatedAt,
        description: "Migration solde disponible",
      });
    }
    if (order.status === "dispute") {
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "dispute_hold",
        pocket: "escrow",
        direction: "debit",
        amount,
        reference: `order:${order.id}:dispute_hold:debit`,
        createdAt: order.disputeOpenedAt || order.updatedAt,
        description: "Migration blocage litige",
      });
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "dispute_hold",
        pocket: "blocked",
        direction: "credit",
        amount,
        reference: `order:${order.id}:dispute_hold:credit`,
        createdAt: order.disputeOpenedAt || order.updatedAt,
        description: "Migration montant bloqué",
      });
    }
    if (order.status === "refunded") {
      ensureLedgerEntry(db, {
        sellerId: order.sellerId,
        orderId: order.id,
        type: "refund_debit",
        pocket: "escrow",
        direction: "debit",
        amount,
        reference: `order:${order.id}:refund_debit`,
        createdAt: order.refundedAt || order.updatedAt,
        description: "Migration remboursement client",
      });
    }
  }
  rebuildSellerBalances(db);
}

function normalizeDb(db: Database): Database {
  if (!db.authUsers) db.authUsers = [];
  if (!db.products) db.products = [];
  if (!db.profiles) db.profiles = [];
  if (!db.orders) db.orders = [];
  if (!db.ledgerEntries) db.ledgerEntries = [];
  if (!db.sellerBalances) db.sellerBalances = [];
  if (!db.paymentAttempts) db.paymentAttempts = [];
  if (!db.webhookEvents) db.webhookEvents = [];
  if (!db.payouts) db.payouts = [];
  if (!db.adminAuditLog) db.adminAuditLog = [];
  for (const p of db.products) {
    if (p.active === undefined) p.active = true;
    if (p.deliveryCost === undefined) p.deliveryCost = 0;
    if (p.note === undefined) p.note = "";
    if (p.image === undefined) p.image = "";
    if (p.paymentSlug === undefined) p.paymentSlug = "";
  }
  for (const p of db.profiles) {
    if (p.role === undefined) p.role = "seller";
    if (p.autoPayoutEnabled === undefined) p.autoPayoutEnabled = false;
    if (p.autoPayoutMode === undefined) p.autoPayoutMode = "full_balance";
    if (p.autoPayoutMinAmount === undefined) p.autoPayoutMinAmount = 5000;
    if (p.autoPayoutFixedAmount === undefined) p.autoPayoutFixedAmount = 10000;
    if (p.autoPayoutMinCompletedOrders === undefined) p.autoPayoutMinCompletedOrders = 3;
  }
  for (const o of db.orders) {
    if (o.deliveryCost === undefined) o.deliveryCost = 0;
    if (o.clientFirstName === undefined) o.clientFirstName = "";
    if (o.clientAddress === undefined) o.clientAddress = "";
    if (o.clientNote === undefined) o.clientNote = "";
    if (o.paymentReference === undefined) o.paymentReference = o.slug;
    if (o.disputePhotos === undefined) o.disputePhotos = [];
    if (o.disputeMedia === undefined) {
      o.disputeMedia = o.disputePhotos.map((url) => ({ type: "image", url }));
    }
    if (!o.deliveryCodeIssuedAt && o.paidAt) {
      o.deliveryCodeIssuedAt = o.paidAt;
    }
    if (!o.deliveryCodeExpiresAt && o.deliveryCodeIssuedAt) {
      o.deliveryCodeExpiresAt = computeDeliveryCodeExpiresAt(new Date(o.deliveryCodeIssuedAt));
    }
  }
  backfillLedgerFromOrders(db);
  return db;
}

function finalizeDb(db: Database): Database {
  const normalized = normalizeDb(db);
  ensureProductPaymentSlugs(normalized);
  return normalized;
}

function loadDefaultDb(): Database {
  return structuredClone(defaultDb);
}

function loadLocalDatabase(): Database {
  try {
    ensureDataDir();
  } catch (err) {
    console.error("data dir inaccessible:", err);
    return loadDefaultDb();
  }

  if (!fs.existsSync(DB_PATH)) {
    if (fs.existsSync(BACKUP_PATH)) {
      try {
        return finalizeDb(JSON.parse(fs.readFileSync(BACKUP_PATH, "utf-8")) as Database);
      } catch {
        /* ignore */
      }
    }
    return loadDefaultDb();
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8").trim();
    if (!raw) return loadDefaultDb();
    return finalizeDb(JSON.parse(raw) as Database);
  } catch (err) {
    console.error("db.json illisible:", err);
    return loadDefaultDb();
  }
}

function saveLocalDatabase(db: Database) {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_PATH)) {
      try {
        fs.copyFileSync(DB_PATH, BACKUP_PATH);
      } catch {
        /* ignore */
      }
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("saveLocalDatabase échoué:", err);
  }
}

async function loadRemoteOrDefault(): Promise<Database> {
  if (isRelationalReadEnabled()) {
    const relational = await loadRelationalDatabase();
    if (relational) return finalizeDb(relational);
    console.warn("[db] XP_RELATIONAL_READ actif mais tables vides — fallback app_state");
  }

  const remote = await loadRemoteDatabase();
  if (remote) return finalizeDb(remote);

  const fresh = loadDefaultDb();
  const saved = await saveRemoteDatabase(fresh);
  if (!saved) {
    throw new Error(
      "Base Supabase inaccessible. Exécutez supabase/app_state.sql et configurez SUPABASE_SERVICE_ROLE_KEY sur Vercel."
    );
  }
  return fresh;
}

async function hydrateDatabase(): Promise<Database> {
  if (isRemoteStoreEnabled()) {
    return loadRemoteOrDefault();
  }
  const local = loadLocalDatabase();
  memoryDb = local;
  return local;
}

/** Recharge Supabase ; réutilise le cache mémoire dans la même invocation serverless. */
async function fetchDatabase(force = false): Promise<Database> {
  if (!force && memoryDb) return memoryDb;
  if (!force && inflightDb) return inflightDb;

  const load = async (): Promise<Database> => {
    if (isRemoteStoreEnabled()) {
      return loadRemoteOrDefault();
    }
    if (memoryDb) return memoryDb;
    return hydrateDatabase();
  };

  inflightDb = load()
    .then((db) => {
      memoryDb = db;
      inflightDb = null;
      return db;
    })
    .catch((error) => {
      inflightDb = null;
      throw error;
    });

  return inflightDb;
}

export function invalidateDbCache() {
  memoryDb = null;
  inflightDb = null;
  loadPromise = null;
}

export async function getDb(): Promise<Database> {
  if (isRemoteStoreEnabled() && process.env.VERCEL) {
    return fetchDatabase();
  }

  if (memoryDb) return memoryDb;
  if (!loadPromise) {
    loadPromise = hydrateDatabase()
      .then((db) => {
        memoryDb = db;
        return db;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export async function updateDb(mutator: (db: Database) => void): Promise<Database> {
  invalidateDbCache();
  const db = structuredClone(await fetchDatabase(true));
  mutator(db);
  memoryDb = finalizeDb(db);

  if (isRemoteStoreEnabled()) {
    const saved = await saveRemoteDatabase(memoryDb);
    if (!saved) {
      memoryDb = null;
      throw new Error(
        "Sauvegarde impossible. Vérifiez la table app_state dans Supabase et SUPABASE_SERVICE_ROLE_KEY."
      );
    }
  } else {
    saveLocalDatabase(memoryDb);
  }

  if (isRemoteStoreEnabled() && isRelationalDualWriteEnabled()) {
    void syncDatabaseToRelational(memoryDb)
      .then((sync) => {
        if (!sync.ok) {
          console.error("[relational] dual-write errors:", sync.errors.join("; "));
        }
      })
      .catch((err) => {
        console.error("[relational] dual-write failed", err);
      });
  }

  return memoryDb;
}

export function getDbStorageMode(): "remote" | "local" | "memory" {
  if (isRemoteStoreEnabled()) return "remote";
  if (process.env.VERCEL) return "memory";
  return "local";
}

/** @deprecated Utiliser getDb() — conservé pour scripts locaux */
export function readDb(): Database {
  if (memoryDb) return memoryDb;
  return loadLocalDatabase();
}

/** @deprecated Utiliser updateDb() */
export function writeDb(db: Database) {
  memoryDb = normalizeDb(structuredClone(db));
  saveLocalDatabase(memoryDb);
}
