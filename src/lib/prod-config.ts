import { getWebhookSecret } from "./bictorys";
import { isProductionRuntime } from "./runtime-env";

export interface ProdConfigCheck {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  hint?: string;
}

export function getProdConfigChecks(): ProdConfigCheck[] {
  const prod = isProductionRuntime();

  const checks: ProdConfigCheck[] = [
    {
      id: "site_url",
      label: "NEXT_PUBLIC_SITE_URL",
      ok: !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"),
      required: prod,
      hint: "https://xaalispay.com — liens email et paiement",
    },
    {
      id: "supabase_url",
      label: "NEXT_PUBLIC_SUPABASE_URL",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: prod,
    },
    {
      id: "supabase_anon",
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: prod,
    },
    {
      id: "supabase_service",
      label: "SUPABASE_SERVICE_ROLE_KEY",
      ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      required: prod,
      hint: "Persistance app_state + upload images",
    },
    {
      id: "auth_secret",
      label: "AUTH_SECRET",
      ok: !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
      required: prod,
      hint: "Min. 32 caractères aléatoires",
    },
    {
      id: "cron_secret",
      label: "CRON_SECRET",
      ok: !!process.env.CRON_SECRET,
      required: prod,
      hint: "Protège /api/maintenance (Vercel Cron)",
    },
    {
      id: "webhook_secret",
      label: "BICTORYS_WEBHOOK_SECRET",
      ok: !!getWebhookSecret(),
      required: prod,
    },
    {
      id: "bictorys_payin",
      label: "BICTORYS_PUBLIC_KEY + BICTORYS_API_KEY",
      ok: !!(process.env.BICTORYS_PUBLIC_KEY && process.env.BICTORYS_API_KEY),
      required: prod,
      hint: "Clés prod Bictorys (pas test)",
    },
    {
      id: "bictorys_prod_url",
      label: "BICTORYS_BASE_URL (prod)",
      ok: !process.env.BICTORYS_BASE_URL?.includes("test.bictorys"),
      required: prod,
      hint: "https://api.bictorys.com en production",
    },
    {
      id: "payout_key",
      label: "BICTORYS_PAYOUT_API_KEY",
      ok: !!(
        process.env.BICTORYS_PAYOUT_API_KEY ||
        process.env.bictorys_payout_key
      ),
      required: false,
      hint: "Retraits Wave/Orange réels",
    },
    {
      id: "refund_key",
      label: "BICTORYS_REFUND_API_KEY",
      ok: !!(
        process.env.BICTORYS_REFUND_API_KEY ||
        process.env.bictorys_refund_key ||
        process.env.BICTORYS_API_KEY
      ),
      required: prod,
      hint: "Remboursements litiges et annulations",
    },
    {
      id: "dev_auto_login_off",
      label: "DEV_AUTO_LOGIN=false",
      ok: process.env.DEV_AUTO_LOGIN === "false" || !prod,
      required: prod,
    },
  ];

  return checks;
}

export function getProdConfigSummary() {
  const checks = getProdConfigChecks();
  const required = checks.filter((c) => c.required);
  const missing = required.filter((c) => !c.ok);

  return {
    production: isProductionRuntime(),
    ready: missing.length === 0,
    checks,
    missingCount: missing.length,
    missingLabels: missing.map((c) => c.label),
  };
}
