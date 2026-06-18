/** 14 régions administratives du Sénégal */
export const SENEGAL_REGIONS = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kédougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Thiès",
  "Ziguinchor",
] as const;

export type SenegalRegion = (typeof SENEGAL_REGIONS)[number];

export function formatClientDeliveryAddress(region: string, detail: string): string {
  const r = region.trim();
  const d = detail.trim();
  if (!r && !d) return "";
  if (!r) return d;
  if (!d) return r;
  return `${r} — ${d}`;
}

export function filterSenegalRegions(query: string): SenegalRegion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SENEGAL_REGIONS];
  return SENEGAL_REGIONS.filter((r) => r.toLowerCase().includes(q));
}
