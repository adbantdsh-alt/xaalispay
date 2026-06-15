/** Boutons paiement Wave / Orange — design validé, ne pas modifier. */
"use client";

import type { MobileMoneyMethod } from "@/lib/payment-methods";
import { WaveFavicon, OrangeFavicon } from "./PaymentBrandLogos";
import s from "./PayMethodButtons.module.css";

const BUTTONS: { id: MobileMoneyMethod; label: string }[] = [
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
];

export function PayMethodButtons({
  onPay,
  paying = false,
  disabled = false,
}: {
  onPay?: (method: MobileMoneyMethod) => void;
  paying?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={s.stack}>
      {BUTTONS.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onPay?.(method.id)}
          disabled={disabled || paying}
          className={`${s.payBtn} ${method.id === "wave" ? s.wave : s.orange}`}
          aria-label={`Payer avec ${method.label}`}
        >
          {method.id === "wave" ? (
            <>
              <WaveFavicon className={s.waveFavicon} />
              <span className={s.waveName}>wave</span>
            </>
          ) : (
            <>
              <span className={s.orangeFaviconWrap}>
                <OrangeFavicon className={s.orangeFavicon} />
              </span>
              <span className={s.orangeName}>ORANGE MONEY</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

export function PayCheckoutSection({
  children,
  label = "Vos informations",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className={s.coordsBlock}>
      <p className={s.sectionLabel}>{label}</p>
      {children}
    </div>
  );
}
