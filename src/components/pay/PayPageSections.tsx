"use client";

import { IconKey } from "@/components/ui/AppIcon";

export { PayOrderSummary } from "./PayOrderSummary";
export { PayProtectionBlock } from "./PayProtectionBlock";
export { PayClientFields } from "./PayClientFields";
export type { PayClientFieldsValues } from "./PayClientFields";
export { PayMethodButtons, PayCheckoutSection } from "./PayMethodButtons";

export function PinConsentGate({
  accepted,
  onAcceptChange,
  children,
}: {
  accepted: boolean;
  onAcceptChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pay-pin-gate">
      <div className="pay-pin-consent">
        <p className="pay-pin-consent-title">
          <IconKey size={18} className="pay-pin-consent-icon" />
          Avant d&apos;afficher votre code
        </p>
        <p className="pay-pin-consent-text">
          Vous ne remettrez ce code <strong>qu&apos;à un livreur</strong>, une fois le colis
          reçu et vérifié. Ne le donnez <strong>jamais au vendeur</strong> directement sans
          avoir le colis en main.
        </p>
        <label className="pay-pin-consent-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onAcceptChange(e.target.checked)}
          />
          <span>J&apos;ai compris</span>
        </label>
      </div>
      {accepted ? (
        children
      ) : (
        <p className="pay-pin-consent-hint text-muted">
          Cochez « J&apos;ai compris » pour afficher votre code de livraison.
        </p>
      )}
    </div>
  );
}
