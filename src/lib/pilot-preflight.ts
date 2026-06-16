import { isBictorysPayoutConfigured } from "./bictorys";
import { checkRemoteStore } from "./data-store";
import { getDb } from "./db";
import { getProdConfigSummary } from "./prod-config";
import { getRelationalMigrationStatus } from "./relational-store";
import { isProductionRuntime } from "./runtime-env";

export type PilotCheckGroup = "env" | "infra" | "bictorys" | "data";

export interface PilotAutoCheck {
  id: string;
  group: PilotCheckGroup;
  label: string;
  ok: boolean;
  required: boolean;
  hint?: string;
}

export interface PilotPreflightReport {
  generatedAt: string;
  siteUrl: string;
  production: boolean;
  autoReady: boolean;
  autoChecks: PilotAutoCheck[];
  missingRequired: string[];
  urls: {
    webhook: string;
    maintenance: string;
    authCallback: string;
    admin: string;
  };
  pilot: {
    sellerCount: number;
    targetMin: number;
    targetMax: number;
  };
  relational: {
    schemaReady: boolean;
    lastMigratedAt: string | null;
  };
}

function checkGroup(id: string): PilotCheckGroup {
  if (id.startsWith("bictorys") || id === "payout_key" || id === "refund_key" || id === "webhook_secret") {
    return "bictorys";
  }
  if (id.startsWith("supabase") || id === "relational_schema" || id === "relational_synced") {
    return id.startsWith("supabase") ? "infra" : "data";
  }
  return "env";
}

export async function getPilotPreflightReport(): Promise<PilotPreflightReport> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://xaalispay.com").replace(
    /\/$/,
    ""
  );
  const prod = isProductionRuntime();
  const prodConfig = getProdConfigSummary();
  const remote = await checkRemoteStore();
  const relational = await getRelationalMigrationStatus();
  const db = await getDb();
  const sellerCount = db.profiles.filter((p) => p.role !== "super_admin").length;

  const autoChecks: PilotAutoCheck[] = [
    ...prodConfig.checks.map((check) => ({
      id: check.id,
      group: checkGroup(check.id),
      label: check.label,
      ok: check.ok,
      required: check.required,
      hint: check.hint,
    })),
    {
      id: "supabase_remote",
      group: "infra" as const,
      label: "Connexion Supabase (app_state)",
      ok: remote.ok,
      required: prod,
      hint: remote.error || "Vérifier SUPABASE_SERVICE_ROLE_KEY",
    },
    {
      id: "relational_schema",
      group: "data" as const,
      label: "Schéma xp_* installé",
      ok: relational.schemaReady,
      required: false,
      hint: "SQL Editor → supabase/schema_v1.sql",
    },
    {
      id: "relational_synced",
      group: "data" as const,
      label: "Sync app_state → tables effectuée",
      ok: !!relational.lastMigratedAt,
      required: false,
      hint: "Admin → Synchroniser app_state → tables",
    },
    {
      id: "payout_api",
      group: "bictorys" as const,
      label: "Retraits Wave/Orange (BICTORYS_PAYOUT_API_KEY)",
      ok: isBictorysPayoutConfigured(),
      required: false,
      hint: "Requis pour les vrais retraits vendeurs",
    },
  ];

  const missingRequired = autoChecks.filter((c) => c.required && !c.ok).map((c) => c.label);

  return {
    generatedAt: new Date().toISOString(),
    siteUrl,
    production: prod,
    autoReady: missingRequired.length === 0,
    autoChecks,
    missingRequired,
    urls: {
      webhook: `${siteUrl}/api/webhook`,
      maintenance: `${siteUrl}/api/maintenance`,
      authCallback: `${siteUrl}/auth/callback`,
      admin: `${siteUrl}/admin`,
    },
    pilot: {
      sellerCount,
      targetMin: 5,
      targetMax: 10,
    },
    relational: {
      schemaReady: relational.schemaReady,
      lastMigratedAt: relational.lastMigratedAt,
    },
  };
}
