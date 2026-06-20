"use client";

import { useRef } from "react";

/** Saisie de code numérique en cases séparées — OTP (6 chiffres) ou PIN (4
 * chiffres). Pattern extrait de DeliveryValidation.tsx (avance automatique,
 * retour arrière, numérique uniquement) sans toucher à ce composant-là. */
export function OtpInput({
  length,
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  length: number;
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const handleDigit = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = char;
    onChange(next);
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoComplete="one-time-code"
          className="input-field"
          style={{ width: "3rem", minHeight: "3.5rem", padding: 0, textAlign: "center", fontSize: "1.25rem" }}
        />
      ))}
    </div>
  );
}

export function emptyDigits(length: number): string[] {
  return Array(length).fill("");
}
