/** Environnement d'exécution (Vercel / Node). */

export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** Seed, auto-login et autres outils dev — jamais en prod ni preview Vercel prod. */
export function isDevToolsAllowed(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return true;
}

export function isDevAutoLoginEnabled(): boolean {
  return isDevToolsAllowed() && process.env.DEV_AUTO_LOGIN !== "false";
}

/** Sync app_state → tables xp_* après chaque écriture (Phase 5B). */
export function isRelationalDualWriteEnabled(): boolean {
  const flag = process.env.XP_RELATIONAL_DUAL_WRITE?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return isProductionRuntime();
}

/** Lecture depuis xp_* au lieu de app_state (Phase 5B — bascule avancée). */
export function isRelationalReadEnabled(): boolean {
  const flag = process.env.XP_RELATIONAL_READ?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function isTransactionalEmailEnabled(): boolean {
  return !!(
    process.env.RESEND_API_KEY?.trim() &&
    process.env.EMAIL_FROM?.trim()
  );
}
