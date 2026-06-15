export const MOBILE_MONEY_METHODS = [
  {
    id: "wave" as const,
    name: "Wave",
    shortName: "Wave",
    btnClass: "pay-method-wave",
    color: "#00D4FF",
  },
  {
    id: "orange" as const,
    name: "Orange Money",
    shortName: "Orange",
    btnClass: "pay-method-orange",
    color: "#FF7900",
  },
];

export type MobileMoneyMethod = (typeof MOBILE_MONEY_METHODS)[number]["id"];

export function isMobileMoneyMethod(value: string): value is MobileMoneyMethod {
  return value === "wave" || value === "orange";
}

export const MOBILE_MONEY_LABELS: Record<MobileMoneyMethod, string> = {
  wave: "Wave",
  orange: "Orange Money",
};
