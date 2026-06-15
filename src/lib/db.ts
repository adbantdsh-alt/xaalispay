import fs from "fs";
import path from "path";
import type { Database } from "./types";
import { ensureProductPaymentSlugs } from "./utils";
import {
  isRemoteStoreEnabled,
  loadRemoteDatabase,
  saveRemoteDatabase,
} from "./data-store";

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "xaalispay-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

let memoryDb: Database | null = null;
let loadPromise: Promise<Database> | null = null;

const defaultDb: Database = {
  authUsers: [],
  profiles: [],
  products: [],
  orders: [],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const BACKUP_PATH = `${DB_PATH}.bak`;

function normalizeDb(db: Database): Database {
  if (!db.authUsers) db.authUsers = [];
  if (!db.products) db.products = [];
  if (!db.profiles) db.profiles = [];
  if (!db.orders) db.orders = [];
  for (const p of db.products) {
    if (p.active === undefined) p.active = true;
    if (p.deliveryCost === undefined) p.deliveryCost = 0;
    if (p.note === undefined) p.note = "";
    if (p.image === undefined) p.image = "";
    if (p.paymentSlug === undefined) p.paymentSlug = "";
  }
  for (const p of db.profiles) {
    if (p.role === undefined) p.role = "seller";
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
  }
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

/** En prod serverless, recharger Supabase à chaque appel pour éviter les données fantômes. */
async function fetchDatabase(): Promise<Database> {
  if (isRemoteStoreEnabled()) {
    return loadRemoteOrDefault();
  }
  if (memoryDb) return memoryDb;
  return hydrateDatabase();
}

export async function getDb(): Promise<Database> {
  if (isRemoteStoreEnabled() && process.env.VERCEL) {
    memoryDb = await fetchDatabase();
    return memoryDb;
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
  const db = structuredClone(await fetchDatabase());
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
