export function getProtectionDurationMinutes(): number {
  const raw = process.env.PROTECTION_MINUTES;
  const parsed = raw ? Number(raw) : 30;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export function getProtectionDurationMs(): number {
  return getProtectionDurationMinutes() * 60 * 1000;
}

export function computeProtectionEndsAt(from: Date = new Date()): string {
  return new Date(from.getTime() + getProtectionDurationMs()).toISOString();
}

export function computeDeliveryDeadlineAt(
  deliveryHours: number,
  from: Date = new Date()
): string {
  return new Date(from.getTime() + deliveryHours * 60 * 60 * 1000).toISOString();
}
