/**
 * Migration unique : envoie data/db.json vers Supabase app_state.
 *
 * Prérequis :
 * 1. Exécuter supabase/app_state.sql dans Supabase SQL Editor
 * 2. Variables dans .env.local :
 *    NEXT_PUBLIC_SUPABASE_URL=...
 *    SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Usage : npx tsx scripts/migrate-local-db-to-supabase.ts
 */
import fs from "fs";
import path from "path";
import { saveRemoteDatabase } from "../src/lib/data-store";
import type { Database } from "../src/lib/types";

async function main() {
  const dbPath = path.join(process.cwd(), "data", "db.json");
  if (!fs.existsSync(dbPath)) {
    console.error("Fichier introuvable :", dbPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(raw) as Database;

  const ok = await saveRemoteDatabase(db);
  if (!ok) {
    console.error(
      "Échec de l'upload. Vérifiez SUPABASE_SERVICE_ROLE_KEY et la table app_state."
    );
    process.exit(1);
  }

  console.log("Migration réussie !");
  console.log(`- Profils : ${db.profiles?.length ?? 0}`);
  console.log(`- Produits : ${db.products?.length ?? 0}`);
  console.log(`- Commandes : ${db.orders?.length ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
