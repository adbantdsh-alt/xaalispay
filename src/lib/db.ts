import fs from "fs";
import path from "path";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

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

export function readDb(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8").trim();
    if (!raw) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      return structuredClone(defaultDb);
    }
    const db = JSON.parse(raw) as Database;
    if (!db.authUsers) db.authUsers = [];
    if (!db.products) db.products = [];
    if (!db.profiles) db.profiles = [];
    if (!db.orders) db.orders = [];
    for (const p of db.products) {
      if (p.deliveryCost === undefined) p.deliveryCost = 0;
      if (p.note === undefined) p.note = "";
      if (p.image === undefined) p.image = "";
    }
    for (const o of db.orders) {
      if (o.deliveryCost === undefined) o.deliveryCost = 0;
      if (o.clientFirstName === undefined) o.clientFirstName = "";
      if (o.clientNote === undefined) o.clientNote = "";
    }
    return db;
  } catch {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }
}

export function writeDb(db: Database) {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function updateDb(mutator: (db: Database) => void) {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}
