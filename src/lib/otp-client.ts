import { apiFetch, extractApiError } from "./api-client";

export type OtpPurpose = "signup" | "pin_reset" | "login";

export interface OtpResult {
  ok: boolean;
  error?: string;
  lockedUntil?: string;
}

export interface OtpVerifyResult extends OtpResult {
  ticket?: string;
}

/** Appellent Django directement (pas de proxy Next.js) : aucune de ces
 * étapes n'émet de token, donc aucun cookie à poser — seules signup/login
 * (côté auth-client.tsx) passent par un proxy. */

export async function requestOtp(phone: string, purpose: "signup" | "pin_reset"): Promise<OtpResult> {
  const res = await apiFetch("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone, purpose }),
  });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: extractApiError(data, "Échec de l'envoi du code") };
}

export async function verifyOtp(phone: string, purpose: OtpPurpose, code: string): Promise<OtpVerifyResult> {
  const res = await apiFetch("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, purpose, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: extractApiError(data, "Code incorrect") };
  return { ok: true, ticket: data.ticket };
}

export async function resetPin(phone: string, ticket: string, newPin: string): Promise<OtpResult> {
  const res = await apiFetch("/api/auth/pin/reset", {
    method: "POST",
    body: JSON.stringify({ phone, ticket, new_pin: newPin }),
  });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({}));
  return { ok: false, error: extractApiError(data, "Échec de la réinitialisation") };
}
