export const MOBILE_MONEY_METHODS = [
  {
    id: "wave" as const,
    name: "Wave",
    icon: "🌊",
    color: "bg-[#1DA1F2]",
  },
  {
    id: "orange" as const,
    name: "Orange Money",
    icon: "🟠",
    color: "bg-[#FF6600]",
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
