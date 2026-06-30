"use client";

import { WaveFavicon, OrangeFavicon } from "@/components/pay/PaymentBrandLogos";

interface Props {
  value: "wave" | "orange";
  onChange: (method: "wave" | "orange") => void;
}

export function WalletPayoutMethodPicker({ value, onChange }: Props) {
  return (
    <div className="wallet-method-picker">
      <button
        type="button"
        className={`wallet-method-option ${value === "wave" ? "wallet-method-option-active" : "wallet-method-option-inactive"}`}
        onClick={() => onChange("wave")}
      >
        <WaveFavicon className="wallet-method-icon" />
        <span className="wallet-method-name">Wave</span>
        {value === "wave" && (
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
      <button
        type="button"
        className={`wallet-method-option ${value === "orange" ? "wallet-method-option-active" : "wallet-method-option-inactive"}`}
        onClick={() => onChange("orange")}
      >
        <OrangeFavicon className="wallet-method-icon" />
        <span className="wallet-method-name wallet-method-name-wrap">
          Orange
          <br />
          Money
        </span>
        {value === "orange" && (
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
    </div>
  );
}
