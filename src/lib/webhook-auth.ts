export function getWebhookHeaderSecret(request: Request): string | null {
  return (
    request.headers.get("x-secret-key") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-bictorys-secret")
  );
}

/** En production, le secret webhook est obligatoire. */
export function isWebhookSecretValid(
  request: Request,
  expectedSecret: string | undefined
): { ok: true } | { ok: false; status: number; error: string } {
  if (!expectedSecret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        error: "Webhook non configuré (secret manquant)",
      };
    }
    return { ok: true };
  }

  const received = getWebhookHeaderSecret(request);
  if (received !== expectedSecret) {
    return { ok: false, status: 401, error: "Webhook non autorisé" };
  }

  return { ok: true };
}
