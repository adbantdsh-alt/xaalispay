"use client";

import { useEffect, useState } from "react";

interface ReleaseCountdownProps {
  endsAt: string;
  minutes: number;
  onExpire?: () => void;
}

function formatTime(ms: number) {
  if (ms <= 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ReleaseCountdown({ endsAt, minutes, onExpire }: ReleaseCountdownProps) {
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
