/** Boutons paiement — design Wave/Orange validé, ne pas modifier ces deux-là.
 * Tous les opérateurs ont désormais un vrai logo. Deux traitements :
 * - "wordmark" (MaxIt/MTN/Moov) : le logo contient déjà le nom de la marque
 *   sur son propre fond — tuile blanche neutre, pas de texte dupliqué.
 * - "icône + texte" (Togocell/Mobicash) : logo = symbole seul, sans texte —
 *   même gabarit que le badge générique d'avant (fond teinté à la couleur de
 *   marque), juste le vrai logo à la place du monogramme. */
"use client";

import { useEffect, useState } from "react";
import {
  MOBILE_MONEY_METHODS,
  mobileMoneyMethodsForCountry,
  orangeRequiresOtp,
  type MobileMoneyMethod,
} from "@/lib/payment-methods";
import {
  MaxitFavicon,
  MobicashFavicon,
  MoovFavicon,
  MtnFavicon,
  TogocellFavicon,
  WaveFavicon,
  OrangeFavicon,
} from "./PaymentBrandLogos";
import s from "./PayMethodButtons.module.css";

const WORDMARK_METHODS = new Set<MobileMoneyMethod>(["maxit", "mtn", "moov"]);

function WordmarkIcon({ id, className }: { id: MobileMoneyMethod; className?: string }) {
  if (id === "maxit") return <MaxitFavicon className={className} />;
  if (id === "mtn") return <MtnFavicon className={className} />;
  return <MoovFavicon className={className} />;
}

function IconOnlyLogo({ id, className }: { id: MobileMoneyMethod; className?: string }) {
  if (id === "togocell") return <TogocellFavicon className={className} />;
  return <MobicashFavicon className={className} />;
}

export function PayMethodButtons({
  country = "SN",
  onPay,
  paying = false,
  disabled = false,
}: {
  country?: string;
  onPay?: (method: MobileMoneyMethod, otp?: string) => void;
  paying?: boolean;
  disabled?: boolean;
}) {
  const [activeMethod, setActiveMethod] = useState<MobileMoneyMethod | null>(null);
  // Étape OTP dédiée (Orange Money Côte d'Ivoire uniquement) : l'acheteur
  // compose #144*82#, reçoit un code, le saisit ici avant que la charge ne
  // parte réellement — voir apps.payments.operators.operator_requires_orange_otp.
  const [otpMethod, setOtpMethod] = useState<MobileMoneyMethod | null>(null);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!paying) setActiveMethod(null);
  }, [paying]);

  const available = mobileMoneyMethodsForCountry(country);
  const buttons = MOBILE_MONEY_METHODS.filter((m) => available.includes(m.id));

  const handleClick = (method: MobileMoneyMethod) => {
    if (method === "orange" && orangeRequiresOtp(country)) {
      setOtpMethod(method);
      return;
    }
    setActiveMethod(method);
    onPay?.(method);
  };

  const handleOtpSubmit = () => {
    if (!otpMethod || otp.trim().length < 4) return;
    setActiveMethod(otpMethod);
    onPay?.(otpMethod, otp.trim());
  };

  if (otpMethod) {
    return (
      <div className={s.otpBlock}>
        <p className={s.otpInstructions}>
          Composez <strong>#144*82#</strong> sur votre téléphone Orange, puis saisissez le code reçu.
        </p>
        <div className={s.otpRow}>
          <input
            className={s.otpInput}
            type="tel"
            inputMode="numeric"
            placeholder="Code OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={paying}
            autoFocus
          />
          <button
            type="button"
            className={`${s.payBtn} ${s.orange}`}
            onClick={handleOtpSubmit}
            disabled={disabled || paying || otp.trim().length < 4}
          >
            {paying ? <span className={s.spinner} aria-hidden="true" /> : "Valider"}
          </button>
        </div>
        <button
          type="button"
          className={s.otpCancel}
          onClick={() => {
            setOtpMethod(null);
            setOtp("");
          }}
          disabled={paying}
        >
          Changer de moyen de paiement
        </button>
      </div>
    );
  }

  return (
    <div className={s.stack}>
      {buttons.map((method) => {
        const isActive = activeMethod === method.id && paying;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => handleClick(method.id)}
            disabled={disabled || paying}
            className={`${s.payBtn} ${
              method.id === "wave"
                ? s.wave
                : method.id === "orange"
                  ? s.orange
                  : WORDMARK_METHODS.has(method.id)
                    ? s.maxit
                    : s.generic
            } ${isActive ? s.loadingBtn : ""}`}
            style={
              method.id === "wave" || method.id === "orange" || WORDMARK_METHODS.has(method.id)
                ? undefined
                : { background: method.color }
            }
            aria-label={`Payer avec ${method.name}`}
          >
            {isActive ? (
              <span className={s.spinner} aria-hidden="true" />
            ) : method.id === "wave" ? (
              <>
                <WaveFavicon className={s.waveFavicon} />
                <span className={s.waveName}>wave</span>
              </>
            ) : method.id === "orange" ? (
              <>
                <span className={s.orangeFaviconWrap}>
                  <OrangeFavicon className={s.orangeFavicon} />
                </span>
                <span className={s.orangeName}>ORANGE MONEY</span>
              </>
            ) : WORDMARK_METHODS.has(method.id) ? (
              // Pas de texte séparé : le logo réel contient déjà le nom de la marque.
              <WordmarkIcon id={method.id} className={s.maxitFavicon} />
            ) : (
              <>
                <IconOnlyLogo id={method.id} className={s.genericIcon} />
                <span className={s.genericName}>{method.shortName}</span>
              </>
            )}
          </button>
        );
      })}
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
