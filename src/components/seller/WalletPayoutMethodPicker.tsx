"use client";

import {
  MaxitFavicon,
  MobicashFavicon,
  MoovFavicon,
  MtnFavicon,
  OrangeFavicon,
  TogocellFavicon,
  WaveFavicon,
} from "@/components/pay/PaymentBrandLogos";
import { MOBILE_MONEY_METHODS, mobileMoneyMethodsForCountry, type MobileMoneyMethod } from "@/lib/payment-methods";

interface Props {
  value: MobileMoneyMethod;
  onChange: (method: MobileMoneyMethod) => void;
  /** Code pays du vendeur (Profile.country) — détermine les opérateurs
   * proposés, voir apps.payments.operators.OPERATORS_BY_COUNTRY côté
   * backend, seule source de vérité pour ce qui est réellement accepté. */
  country: string;
}

// Les 7 opérateurs ont désormais tous un vrai logo — plus besoin du badge
// générique (OperatorMonogram) ici.
function MethodIcon({ id }: { id: MobileMoneyMethod }) {
  if (id === "wave") return <WaveFavicon className="wallet-method-icon" />;
  if (id === "orange") return <OrangeFavicon className="wallet-method-icon" />;
  if (id === "maxit") return <MaxitFavicon className="wallet-method-icon" />;
  if (id === "mtn") return <MtnFavicon className="wallet-method-icon" />;
  if (id === "moov") return <MoovFavicon className="wallet-method-icon" />;
  if (id === "togocell") return <TogocellFavicon className="wallet-method-icon" />;
  return <MobicashFavicon className="wallet-method-icon" />;
}

export function WalletPayoutMethodPicker({ value, onChange, country }: Props) {
  const available = mobileMoneyMethodsForCountry(country);
  const methods = MOBILE_MONEY_METHODS.filter((m) => available.includes(m.id));

  return (
    <div className="wallet-method-picker">
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`wallet-method-option ${value === m.id ? "wallet-method-option-active" : "wallet-method-option-inactive"}`}
          onClick={() => onChange(m.id)}
        >
          <MethodIcon id={m.id} />
          <span className="wallet-method-name">{m.shortName}</span>
          {value === m.id && (
            <svg
              className="wallet-method-check"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
