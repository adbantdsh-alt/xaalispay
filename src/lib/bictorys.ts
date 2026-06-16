import type { MobileMoneyMethod } from "./payment-methods";
import { buildPaymentLinkUrl } from "./site-url";
import type { Order, Payout } from "./types";
import { getCheckoutChargeAmount } from "./fees";
import { getOrderTotal } from "./utils";

export interface BictorysChargeResult {
  id?: string;
  reference?: string;
  status?: string;
  message?: string;
  paymentUrl?: string;
  qrCode?: string;
  raw: unknown;
}

export interface BictorysPayoutResult {
  id?: string;
  reference?: string;
  status?: string;
  message?: string;
  raw: unknown;
}

function getBaseUrl(): string {
  return (process.env.BICTORYS_BASE_URL || "https://api.bictorys.com").replace(/\/$/, "");
}

function firstEnvValue(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

const BICTORYS_PUBLIC_KEY_NAMES = [
  "BICTORYS_API_KEY",
  "BICTORYS_PUBLIC_KEY",
  "bictorys_xaalispay_encaissement",
] as const;

const BICTORYS_PAYOUT_KEY_NAMES = [
  "BICTORYS_PRIVATE_KEY",
  "BICTORYS_PAYOUT_API_KEY",
  "BICTORYS_SECRET_KEY",
  "BICTORYS_API_KEY",
  "bictorys_payout_key",
  "bictorys_xaalispay_encaissement",
] as const;

const BICTORYS_REFUND_KEY_NAMES = [
  "BICTORYS_REFUND_API_KEY",
  "BICTORYS_PRIVATE_KEY",
  "BICTORYS_API_KEY",
  "BICTORYS_SECRET_KEY",
  "BICTORYS_PAYOUT_API_KEY",
  "bictorys_refund_key",
  "bictorys_payout_key",
] as const;

function getPublicKey(): string {
  const key = firstEnvValue([...BICTORYS_PUBLIC_KEY_NAMES]);
  if (!key) throw new Error("BICTORYS_API_KEY / BICTORYS_PUBLIC_KEY manquante");
  return key;
}

function getPayoutKey(): string {
  const key = firstEnvValue([...BICTORYS_PAYOUT_KEY_NAMES]);
  if (!key) {
    throw new Error(
      "Clé Bictorys payout introuvable. Vérifiez BICTORYS_PAYOUT_API_KEY ou bictorys_payout_key dans Vercel, puis redéployez."
    );
  }
  return key;
}

function getRefundKey(): string {
  const key = firstEnvValue([...BICTORYS_REFUND_KEY_NAMES]);
  if (!key) {
    throw new Error(
      "Clé Bictorys remboursement introuvable. Vérifiez BICTORYS_REFUND_API_KEY ou bictorys_refund_key dans Vercel."
    );
  }
  return key;
}

export function isBictorysPayoutConfigured(): boolean {
  return Boolean(firstEnvValue([...BICTORYS_PAYOUT_KEY_NAMES]));
}

export function getWebhookSecret(): string | undefined {
  return process.env.BICTORYS_WEBHOOK_SECRET?.trim() || undefined;
}

export function getPayoutWebhookSecret(): string | undefined {
  return process.env.BICTORYS_PAYOUT_WEBHOOK_SECRET?.trim() || undefined;
}

export function getRefundWebhookSecret(): string | undefined {
  return process.env.BICTORYS_REFUND_WEBHOOK_SECRET?.trim() || undefined;
}

export function mapPaymentMethodToOperator(method: MobileMoneyMethod): "Wave" | "Orange Money" {
  return method === "wave" ? "Wave" : "Orange Money";
}

export function mapPaymentMethodToPaymentType(method: MobileMoneyMethod): "wave_money" | "orange_money" {
  return method === "wave" ? "wave_money" : "orange_money";
}

export function normalizeSenegalPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  while (digits.startsWith("221") && digits.length > 9) {
    digits = digits.slice(3);
  }
  digits = digits.replace(/^0+/, "");
  if (digits.startsWith("221")) return digits;
  return `221${digits}`;
}

/** Format Bictorys charges/payouts : +221771234567 */
export function toBictorysInternationalPhone(phone: string, country = "SN"): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed.replace(/\s/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (country === "SN") {
    if (digits.startsWith("221")) return `+${digits}`;
    return `+221${digits.replace(/^0+/, "")}`;
  }
  return `+${digits}`;
}

/** Numéro local Sénégal pour payout Bictorys (legacy). Préférer toBictorysInternationalPhone. */
export function toBictorysPayoutPhone(phone: string): string {
  return toBictorysInternationalPhone(phone, "SN");
}

async function fetchBictorysWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
    const response = await fetch(url, init);
    if (response.ok) return response;

    const text = await response.clone().text();
    const isWaf =
      response.status === 403 &&
      (text.includes("Forbidden") || text.includes("<html"));
    if (isWaf && attempt < maxRetries) continue;
    return response;
  }
  throw new Error("Bictorys: max retries reached");
}

function extractChargePayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const data = obj.data;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return obj;
}

function findPaymentUrl(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  for (const key of ["link", "redirectUrl", "paymentUrl", "checkoutUrl", "url"]) {
    if (typeof obj[key] === "string" && /^https?:\/\//.test(obj[key])) {
      return obj[key];
    }
  }
  for (const item of Object.values(obj)) {
    const nested = findPaymentUrl(item);
    if (nested) return nested;
  }
  return undefined;
}

export async function createBictorysMobileMoneyCharge({
  order,
  method,
  otp,
}: {
  order: Order;
  method: MobileMoneyMethod;
  otp?: string;
}): Promise<BictorysChargeResult> {
  const reference = order.paymentReference || order.slug;
  const amount = getCheckoutChargeAmount(order);
  const customerName = order.clientName || order.clientFirstName || "Client XaalisPay";
  const phone = toBictorysInternationalPhone(order.clientPhone, "SN");
  const successUrl = `${buildPaymentLinkUrl(order.slug)}?payment=success`;
  const errorUrl = `${buildPaymentLinkUrl(order.slug)}?payment=failed`;

  const payload: Record<string, unknown> = {
    amount,
    merchantReference: reference,
    paymentReference: reference,
    currency: "XOF",
    country: "SN",
    customerObject: {
      name: customerName,
      email: "client@xaalispay.com",
      phone,
      country: "SN",
    },
    allowUpdateCustomer: false,
    successRedirectUrl: successUrl,
    ErrorRedirectUrl: errorUrl,
    errorRedirectUrl: errorUrl,
    callbackUrl: buildPaymentLinkUrl(order.slug),
    orderDetails: [
      {
        name: order.productName,
        price: order.productPrice,
        quantity: 1,
        taxRate: 0,
      },
      ...(order.deliveryCost
        ? [
            {
              name: "Livraison",
              price: order.deliveryCost,
              quantity: 1,
              taxRate: 0,
            },
          ]
        : []),
    ],
  };

  if (otp?.trim()) {
    payload.otp = otp.trim();
  }

  const res = await fetchBictorysWithRetry(
    `${getBaseUrl()}/pay/v1/charges?payment_type=${mapPaymentMethodToPaymentType(method)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": getPublicKey(),
        "Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    }
  );

  const rawText = await res.text();
  let raw: unknown = {};
  try {
    raw = rawText ? JSON.parse(rawText) : {};
  } catch {
    raw = { message: rawText };
  }
  if (!res.ok) {
    console.error("Bictorys charge failed", {
      status: res.status,
      preferredPaymentType: mapPaymentMethodToPaymentType(method),
      response: raw,
    });
    const rawObject = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const message =
      (typeof rawObject.message === "string" && rawObject.message) ||
      (typeof rawObject.error === "string" && rawObject.error) ||
      (typeof rawObject.detail === "string" && rawObject.detail) ||
      (typeof rawObject.title === "string" && rawObject.title) ||
      `Paiement Bictorys refusé (HTTP ${res.status})`;
    throw new Error(message);
  }

  const data = extractChargePayload(raw);
  return {
    id:
      data.id !== undefined
        ? String(data.id)
        : data.transactionId !== undefined
          ? String(data.transactionId)
          : undefined,
    reference:
      typeof data.reference === "string"
        ? data.reference
        : typeof data.merchantReference === "string"
          ? data.merchantReference
          : reference,
    status: typeof data.status === "string" ? data.status : undefined,
    paymentUrl:
      findPaymentUrl(data) || findPaymentUrl(raw),
    qrCode: typeof data.qrCode === "string" ? data.qrCode : undefined,
    message:
      typeof data.message === "string"
        ? data.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : (raw as { message?: string })?.message,
    raw,
  };
}

function extractBictorysMessage(raw: unknown, fallback: string): string {
  const rawObject = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return (
    (typeof rawObject.message === "string" && rawObject.message) ||
    (typeof rawObject.error === "string" && rawObject.error) ||
    (typeof rawObject.detail === "string" && rawObject.detail) ||
    (typeof rawObject.details === "string" && rawObject.details) ||
    (typeof rawObject.title === "string" && rawObject.title) ||
    fallback
  );
}

async function readBictorysResponse(res: Response): Promise<unknown> {
  const rawText = await res.text();
  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    return { message: rawText };
  }
}

export async function createBictorysPayout(payout: Payout): Promise<BictorysPayoutResult> {
  const paymentType = mapPaymentMethodToPaymentType(payout.method);
  const secretCode =
    process.env.BICTORYS_MERCHANT_SECRET_CODE?.trim() ||
    process.env.BICTORYS_PAYOUT_SECRET_CODE?.trim();

  const payload = {
    amount: payout.netAmount ?? payout.amount,
    currency: "XOF",
    country: "SN",
    transactionType: "payment",
    paymentReason: "Retrait vendeur XaalisPay",
    merchantReference: payout.id,
    customerObject: {
      name: "Vendeur XaalisPay",
      phone: toBictorysInternationalPhone(payout.phone, "SN"),
      email: "vendeur@xaalispay.com",
      country: "SN",
      locale: "fr-FR",
    },
    ...(secretCode ? { merchant: { secretCode } } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetchBictorysWithRetry(
      `${getBaseUrl()}/pay/v1/payouts?payment_type=${paymentType}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-API-Key": getPayoutKey(),
          "idempotency-key": payout.id,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeout);
  }
  const raw = await readBictorysResponse(res);
  if (!res.ok) {
    throw new Error(extractBictorysMessage(raw, `Payout Bictorys refusé (HTTP ${res.status})`));
  }

  const data = extractChargePayload(raw);
  return {
    id:
      data.id !== undefined
        ? String(data.id)
        : data.transactionId !== undefined
          ? String(data.transactionId)
          : undefined,
    reference:
      typeof data.reference === "string"
        ? data.reference
        : typeof data.merchantReference === "string"
          ? data.merchantReference
          : payout.id,
    status: typeof data.status === "string" ? data.status : "pending",
    message:
      typeof data.message === "string"
        ? data.message.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : undefined,
    raw,
  };
}

export async function refundBictorysTransaction(transactionId: string): Promise<BictorysPayoutResult> {
  const res = await fetch(`${getBaseUrl()}/pay/v1/transactions/${transactionId}/refund`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": getRefundKey(),
      "idempotency-key": transactionId,
    },
  });
  const raw = await readBictorysResponse(res);
  if (!res.ok) {
    throw new Error(extractBictorysMessage(raw, `Refund Bictorys refusé (HTTP ${res.status})`));
  }
  const data = extractChargePayload(raw);
  return {
    id:
      data.id !== undefined
        ? String(data.id)
        : data.transactionId !== undefined
          ? String(data.transactionId)
          : transactionId,
    reference:
      typeof data.reference === "string"
        ? data.reference
        : typeof data.merchantReference === "string"
          ? data.merchantReference
          : transactionId,
    status: typeof data.status === "string" ? data.status : "pending",
    message: typeof data.message === "string" ? data.message : undefined,
    raw,
  };
}

export function normalizeBictorysStatus(status?: string | number): string {
  if (status === 0 || status === "0") return "succeeded";
  if (typeof status !== "string") return String(status ?? "").toLowerCase();
  return status.toLowerCase();
}

export function isBictorysSuccessEvent(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<
    string,
    unknown
  >;
  const status = normalizeBictorysStatus(
    (data.status as string | number | undefined) ?? (obj.status as string | number | undefined)
  );
  return (
    obj.event === "charge.successful" ||
    status === "success" ||
    status === "succeeded" ||
    status === "authorized"
  );
}

export function isBictorysFailureEvent(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<
    string,
    unknown
  >;
  const status = normalizeBictorysStatus(
    (data.status as string | number | undefined) ?? (obj.status as string | number | undefined)
  );
  return (
    status === "failed" ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "reversed"
  );
}

export function getBictorysAmount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<
    string,
    unknown
  >;
  const amount = data.amount ?? obj.amount;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return Math.abs(Math.round(amount));
  }
  return undefined;
}

export async function checkBictorysTransactionStatus(
  transactionId: string
): Promise<string | undefined> {
  const res = await fetchBictorysWithRetry(
    `${getBaseUrl()}/pay/v1/transactions/${transactionId}/status`,
    {
      headers: { "X-Api-Key": getPublicKey(), accept: "application/json" },
    },
    2
  );
  if (!res.ok) return undefined;
  const raw = await readBictorysResponse(res);
  const data = extractChargePayload(raw);
  const status = data.status ?? (raw as Record<string, unknown>).status;
  return typeof status === "string" || typeof status === "number"
    ? normalizeBictorysStatus(status)
    : undefined;
}

export function isBictorysStatusPaid(status?: string): boolean {
  const s = normalizeBictorysStatus(status);
  return s === "succeeded" || s === "authorized" || s === "success";
}

export function getBictorysReference(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  const ref = data.reference || data.paymentReference || data.merchantReference;
  return typeof ref === "string" ? ref : null;
}

export function getBictorysTransactionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  const id = data.id || data.transactionId || data.transaction_id || obj.id;
  return typeof id === "string" ? id : undefined;
}

export function getBictorysStatus(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  const status = data.status || obj.status || obj.event;
  return typeof status === "string" ? status : undefined;
}
