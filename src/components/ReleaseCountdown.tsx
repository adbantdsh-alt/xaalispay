"use client";

import { useEffect, useState } from "react";

interface ReleaseCountdownProps {
  endsAt: string;
  minutes: number;
  onExpire?: () => void;
  /** Rendu compact en une ligne ("12 min · 23 000"), pour une stat plutôt qu'une carte dédiée. */
  compact?: boolean;
  compactAmount?: string;
}

function formatTime(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 60000))} min`;
}

export function ReleaseCountdown({
  endsAt,
  minutes,
  onExpire,
  compact = false,
  compactAmount,
}: ReleaseCountdownProps) {
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        if (!expired) {
          setExpired(true);
          onExpire?.();
        }
        return;
      }
      setRemaining(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, expired, onExpire]);

  const progress = Math.max(0, Math.min(100, (remaining / (minutes * 60 * 1000)) * 100));

  if (compact) {
    return (
      <span className="wallet-funds-value">
        {formatMinutes(remaining)}
        {compactAmount && <span className="wallet-funds-value-suffix">· {compactAmount}</span>}
      </span>
    );
  }

  return (
    <div className="countdown-card animate-fade-up-d1">
      <p className="countdown-label">Libération dans</p>
      <p className="countdown-time">{formatTime(remaining)}</p>
      <div className="countdown-bar">
        <div className="countdown-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
