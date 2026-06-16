import { verifyBictorysWebhookSignature } from "./bictorys-webhook";

export function getWebhookHeaderSecret(request: Request): string | null {
  return (
    request.headers.get("x-secret-key") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-bictorys-secret")
  );
}

/** @deprecated Préférer verifyBictorysWebhookSignature avec body brut. */
export function isWebhookSecretValid(
  request: Request,
  expectedSecret: string | undefined
): { ok: true } | { ok: false; status: number; error: string } {
  const auth = verifyBictorysWebhookSignature(request, "", expectedSecret);
  if (auth.ok) return { ok: true };

  if (auth.reason === "secret_missing") {
    return {
      ok: false,
      status: 503,
      error: "Webhook non configuré (secret manquant)",
    };
  }

  const received = getWebhookHeaderSecret(request);
  if (expectedSecret && received === expectedSecret) {
    return { ok: true };
  }

  if (!expectedSecret && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  return { ok: false, status: 401, error: "Webhook non autorisé" };
}

export { verifyBictorysWebhookSignature };
