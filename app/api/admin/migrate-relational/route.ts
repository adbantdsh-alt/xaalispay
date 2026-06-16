import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";
import {
  getRelationalMigrationStatus,
  migrateAppStateToRelational,
} from "@/lib/relational-store";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const status = await getRelationalMigrationStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const status = await getRelationalMigrationStatus();
  if (!status.schemaReady) {
    return NextResponse.json(
      {
        error:
          "Schéma relationnel absent. Exécutez supabase/schema_v1.sql dans Supabase SQL Editor.",
      },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await migrateAppStateToRelational(db);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.errors.join(" · ") || "Migration échouée", ...result },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
