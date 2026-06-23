"use client";

import { WaveFavicon, OrangeFavicon } from "@/components/pay/PaymentBrandLogos";

/**
 * Sélecteur de méthode de retrait — distinct des gros boutons de paiement
 * acheteur (PayMethodButtons, design gelé) : ici c'est un choix, pas un CTA.
 * Orange Money est désactivé tant que le retrait direct n'est pas branché
 * côté backend (voir wallet/page.tsx).
 */
export function WalletPayoutMethodPicker() {
  return (
    <div className="wallet-method-picker">
      <button type="button" className="wallet-method-option wallet-method-option-active" disabled>
        <WaveFavicon className="wallet-method-icon" />
        <span className="wallet-method-name">Wave</span>
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
      </button>
      <button type="button" className="wallet-method-option wallet-method-option-disabled" disabled>
        <OrangeFavicon className="wallet-method-icon" />
        <span className="wallet-method-name wallet-method-name-wrap">
          Orange
          <br />
          Money
        </span>
        <span className="wallet-method-soon">Bientôt</span>
      </button>
    </div>
  );
}
