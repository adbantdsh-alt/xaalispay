/** Boutons paiement Wave / Orange — design validé, ne pas modifier. */
"use client";

import { useEffect, useState } from "react";
import type { MobileMoneyMethod } from "@/lib/payment-methods";
import { IconShield } from "@/components/ui/AppIcon";
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
  protectionMinutes = 30,
}: {
  onPay?: (method: MobileMoneyMethod) => void;
  paying?: boolean;
  disabled?: boolean;
  protectionMinutes?: number;
}) {
  const [activeMethod, setActiveMethod] = useState<MobileMoneyMethod | null>(null);

  useEffect(() => {
    if (!paying) setActiveMethod(null);
  }, [paying]);

  const handleClick = (method: MobileMoneyMethod) => {
    setActiveMethod(method);
    onPay?.(method);
  };

  return (
    <div className={s.stack}>
      {BUTTONS.map((method) => {
        const isActive = activeMethod === method.id && paying;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => handleClick(method.id)}
            disabled={disabled || paying}
            className={`${s.payBtn} ${method.id === "wave" ? s.wave : s.orange} ${isActive ? s.loadingBtn : ""}`}
            aria-label={`Payer avec ${method.label}`}
          >
            {isActive ? (
              <span className={s.spinner} aria-hidden="true" />
            ) : method.id === "wave" ? (
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
        );
      })}
      <p className={s.trustNote} role="note">
        <span className={s.trustIcon} aria-hidden="true">
          <IconShield size={16} />
        </span>
        <span>
          <strong>Votre argent reste chez XaalisPay.</strong> Après réception, nous le
          conservons encore <strong>{protectionMinutes} minutes</strong> avant de le verser au
          vendeur. Vous vérifiez d&apos;abord, vous payez ensuite — c&apos;est notre garantie
          anti-arnaque.
        </span>
      </p>
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
