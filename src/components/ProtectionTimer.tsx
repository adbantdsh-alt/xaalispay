"use client";

import { useEffect, useState } from "react";

interface ProtectionTimerProps {
  endsAt: string;
  minutes?: number;
  title?: string;
  subtitle?: string;
  onExpire?: () => void;
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function ProtectionTimer({
  endsAt,
  minutes = 30,
  title = "Séquestre Flash en cours",
  subtitle,
  onExpire,
}: ProtectionTimerProps) {
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
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, expired, onExpire]);

  const progress = Math.max(0, Math.min(100, (remaining / (minutes * 60 * 1000)) * 100));

  return (
    <div className="glass-card-blue p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-label">{title}</p>
          {subtitle && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-extrabold text-black">
            {formatRemaining(remaining)}
          </p>
          <p className="text-[10px] text-subtle">restantes</p>
        </div>
      </div>
      <div className="timer-bar-track mt-4">
        <div className="timer-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
