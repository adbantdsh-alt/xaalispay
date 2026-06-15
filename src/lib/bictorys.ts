import type { MobileMoneyMethod } from "./payment-methods";
import { buildPaymentLinkUrl } from "./site-url";
import type { Order } from "./types";
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

function getBaseUrl(): string {
  return (process.env.BICTORYS_BASE_URL || "https://api.test.bictorys.com").replace(/\/$/, "");
}

function getPublicKey(): string {
  const key = process.env.BICTORYS_PUBLIC_KEY?.trim();
  if (!key) throw new Error("BICTORYS_PUBLIC_KEY manquante");
  return key;
}

export function getWebhookSecret(): string | undefined {
  return process.env.BICTORYS_WEBHOOK_SECRET?.trim() || undefined;
}

export function mapPaymentMethodToOperator(method: MobileMoneyMethod): "Wave" | "Orange Money" {
  return method === "wave" ? "Wave" : "Orange Money";
}

export function mapPaymentMethodToPaymentType(method: MobileMoneyMethod): "wave_money" | "orange_money" {
  return method === "wave" ? "wave_money" : "orange_money";
}

export function normalizeSenegalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("221")) return digits;
  return `221${digits.replace(/^0+/, "")}`;
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
}: {
  order: Order;
  method: MobileMoneyMethod;
}): Promise<BictorysChargeResult> {
  const reference = order.paymentReference || order.slug;
  const amount = getOrderTotal(order);
  const customerName = order.clientName || order.clientFirstName || "Client XaalisPay";
  const phone = normalizeSenegalPhone(order.clientPhone);

  const payload = {
    amount,
    merchantReference: reference,
    paymentReference: reference,
    currency: "XOF",
    country: "SN",
    customerObject: {
      name: customerName,
      email: "client@xaalispay.com",
      phoneNumber: phone,
      phone,
    },
    allowUpdateCustomer: false,
    successRedirectUrl: `${buildPaymentLinkUrl(order.slug)}?payment=success`,
    errorRedirectUrl: `${buildPaymentLinkUrl(order.slug)}?payment=failed`,
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

  const res = await fetch(
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

export function isBictorysSuccessEvent(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  return obj.event === "charge.successful" || data.status === "success";
}

export function getBictorysReference(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  const ref = data.reference || data.paymentReference || data.merchantReference;
  return typeof ref === "string" ? ref : null;
}
