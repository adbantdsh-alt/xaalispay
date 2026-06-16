/** Autorise les appels cron/maintenance (Vercel cron ou secret manuel). */
export function isMaintenanceAuthorized(request: Request): boolean {
  const secret =
    process.env.CRON_SECRET?.trim() || process.env.MAINTENANCE_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const bearer =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const headerSecret = request.headers.get("x-cron-secret")?.trim();

  return bearer === secret || headerSecret === secret;
}
