#!/usr/bin/env node
/**
 * Vérifie les variables d'environnement avant déploiement pilote.
 * Usage : npm run preflight
 * Charge .env.local puis .env si présents.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const root = resolve(process.cwd());
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const isProd =
  process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

function hasWebhookSecret() {
  return !!(
    process.env.BICTORYS_WEBHOOK_SECRET?.trim() ||
    process.env.bictorys_webhook_secret?.trim()
  );
}

function hasPayoutKey() {
  return !!(
    process.env.BICTORYS_PAYOUT_API_KEY?.trim() ||
    process.env.bictorys_payout_key?.trim()
  );
}

function hasRefundKey() {
  return !!(
    process.env.BICTORYS_REFUND_API_KEY?.trim() ||
    process.env.bictorys_refund_key?.trim() ||
    process.env.BICTORYS_API_KEY?.trim()
  );
}

const checks = [
  {
    label: "NEXT_PUBLIC_SITE_URL (https://)",
    ok: !!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"),
    required: isProd,
  },
  {
    label: "NEXT_PUBLIC_SUPABASE_URL",
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    required: isProd,
  },
  {
    label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ok: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    required: isProd,
  },
  {
    label: "SUPABASE_SERVICE_ROLE_KEY",
    ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    required: isProd,
  },
  {
    label: "AUTH_SECRET (32+ car.)",
    ok: !!process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32,
    required: isProd,
  },
  {
    label: "CRON_SECRET",
    ok: !!process.env.CRON_SECRET,
    required: isProd,
  },
  {
    label: "BICTORYS_PUBLIC_KEY + BICTORYS_API_KEY",
    ok: !!(process.env.BICTORYS_PUBLIC_KEY && process.env.BICTORYS_API_KEY),
    required: isProd,
  },
  {
    label: "BICTORYS_BASE_URL (pas test)",
    ok: !process.env.BICTORYS_BASE_URL?.includes("test.bictorys"),
    required: isProd,
  },
  {
    label: "BICTORYS_WEBHOOK_SECRET",
    ok: hasWebhookSecret(),
    required: isProd,
  },
  {
    label: "BICTORYS_REFUND_API_KEY",
    ok: hasRefundKey(),
    required: isProd,
  },
  {
    label: "BICTORYS_PAYOUT_API_KEY",
    ok: hasPayoutKey(),
    required: false,
  },
  {
    label: "DEV_AUTO_LOGIN=false",
    ok: process.env.DEV_AUTO_LOGIN === "false" || !isProd,
    required: isProd,
  },
  {
    label: "NEXT_PUBLIC_SUPPORT_WHATSAPP (pilote)",
    ok: !!process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim(),
    required: false,
  },
];

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://xaalispay.com").replace(
  /\/$/,
  ""
);

console.log("\nXaalisPay — Preflight pilote\n");
console.log(`Environnement : ${isProd ? "production" : "development"}`);
console.log(`Site         : ${siteUrl}\n`);

let failedRequired = 0;
for (const check of checks) {
  const icon = check.ok ? "✓" : check.required ? "✗" : "○";
  const tag = check.required ? "requis" : "recommandé";
  console.log(`  ${icon} [${tag}] ${check.label}`);
  if (!check.ok && check.required) failedRequired++;
}

console.log("\nURLs à configurer :");
console.log(`  Webhook Bictorys : ${siteUrl}/api/webhook`);
console.log(`  Cron maintenance : GET ${siteUrl}/api/maintenance`);
console.log(`  Auth callback    : ${siteUrl}/auth/callback`);
console.log("\nGuide complet : supabase/LANCEMENT.md\n");

if (failedRequired > 0) {
  console.error(`Échec : ${failedRequired} variable(s) requise(s) manquante(s).\n`);
  process.exit(1);
}

console.log("Preflight OK — prêt pour le déploiement pilote.\n");
