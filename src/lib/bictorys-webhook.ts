import { createHmac, timingSafeEqual } from "node:crypto";
import {
  getBictorysAmount,
  getBictorysReference,
  getBictorysStatus,
  getBictorysTransactionId,
  isBictorysFailureEvent,
  isBictorysSuccessEvent,
  normalizeBictorysStatus,
} from "./bictorys";
import { getCheckoutChargeAmount } from "./fees";
import type { Order } from "./types";

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export interface ParsedBictorysWebhook {
  payload: Record<string, unknown>;
  reference: string | null;
  providerId: string | undefined;
  status: string | undefined;
  amount: number | undefined;
  eventKey: string;
  success: boolean;
  failure: boolean;
}

function timingSafeEqualString(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function verifyBictorysWebhookSignature(
  request: Request,
  rawBody: string,
  expectedSecret: string | undefined
): { ok: true } | { ok: false; reason: string } {
  if (!expectedSecret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      return { ok: false, reason: "secret_missing" };
    }
    return { ok: true };
  }

  const signature = request.headers.get("x-webhook-signature")?.trim();
  const timestamp = request.headers.get("x-webhook-timestamp")?.trim();
  const secretKey = request.headers.get("x-secret-key")?.trim();

  if (signature && timestamp) {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
      return { ok: false, reason: "timestamp_invalid" };
    }

    const expected = createHmac("sha256", expectedSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    if (timingSafeEqualString(signature, expected)) {
      return { ok: true };
    }
    return { ok: false, reason: "hmac_invalid" };
  }

  if (secretKey && timingSafeEqualString(secretKey, expectedSecret)) {
    return { ok: true };
  }

  const legacy =
    request.headers.get("x-webhook-secret")?.trim() ||
    request.headers.get("x-bictorys-secret")?.trim();
  if (legacy && timingSafeEqualString(legacy, expectedSecret)) {
    return { ok: true };
  }

  return { ok: false, reason: "unauthorized" };
}

export function parseBictorysWebhookPayload(raw: unknown, prefix: string): ParsedBictorysWebhook {
  const payload =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const reference = getBictorysReference(payload);
  const providerId = getBictorysTransactionId(payload);
  const status = normalizeBictorysStatus(getBictorysStatus(payload));
  const amount = getBictorysAmount(payload);
  const eventKey = `${prefix}:${providerId || reference || JSON.stringify(payload).slice(0, 120)}`;

  return {
    payload,
    reference,
    providerId,
    status,
    amount,
    eventKey,
    success: isBictorysSuccessEvent(payload),
    failure: isBictorysFailureEvent(payload),
  };
}

/** Vérifie montant webhook vs commande (anti-fraude). */
export function verifyOrderWebhookAmount(order: Order, webhookAmount?: number): boolean {
  if (webhookAmount == null || !Number.isFinite(webhookAmount)) return true;
  const expected = getCheckoutChargeAmount(order);
  return webhookAmount === expected;
}

export function webhookResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
