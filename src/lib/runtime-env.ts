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
