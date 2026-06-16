"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { IconCheck, IconShield } from "@/components/ui/AppIcon";
import { CopyButton } from "@/components/ui/CopyButton";
import { buildPinShareMessage, buildWhatsAppUrl } from "@/lib/share";
import { DELIVERY_CODE_TTL_MINUTES } from "@/lib/delivery-code";
import type { OrderStatus } from "@/lib/types";
import styles from "./DeliveryValidation.module.css";

type DeliverySession = {
  orderId: string;
  slug: string;
  status: OrderStatus;
  productName: string;
  pin: string;
  deliveryCodeIssuedAt?: string;
  deliveryCodeExpiresAt?: string;
  protectionEndsAt?: string;
  clientDeliveryConfirmedAt?: string;
};

type Props = {
  orderSlug: string;
  productName: string;
  protectionMinutes: number;
  onSessionChange?: () => void;
};

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DeliveryValidation({
  orderSlug,
  productName,
  protectionMinutes,
  onSessionChange,
}: Props) {
  const [session, setSession] = useState<DeliverySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [codeRemainingMs, setCodeRemainingMs] = useState(0);
  const [protectionRemainingMs, setProtectionRemainingMs] = useState(0);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/delivery/${orderSlug}`);
    if (!res.ok) return;
    const data = await res.json();
    setSession(data.session);
    setLoading(false);
  }, [orderSlug]);

  useEffect(() => {
    loadSession();
    const id = setInterval(loadSession, 5000);
    return () => clearInterval(id);
  }, [loadSession]);

  const codeExpiresAt = session?.deliveryCodeExpiresAt;

  useEffect(() => {
    if (!codeExpiresAt) return;
    const tick = () => {
      setCodeRemainingMs(Math.max(0, new Date(codeExpiresAt).getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [codeExpiresAt]);

  useEffect(() => {
    const endsAt = session?.protectionEndsAt;
    if (!endsAt || session.status !== "protection") return;
    const tick = () => {
      setProtectionRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.protectionEndsAt, session?.status]);

  const codeExpired = codeRemainingMs <= 0 && !!codeExpiresAt;
  const isProtection = session?.status === "protection";
  const isReleased = session?.status === "released";
  const canConfirm = session?.status === "paid" && consent;

  const codeProgress = useMemo(() => {
    if (!codeExpiresAt) return 0;
    const total = DELIVERY_CODE_TTL_MINUTES * 60 * 1000;
    return Math.max(0, Math.min(100, (codeRemainingMs / total) * 100));
  }, [codeExpiresAt, codeRemainingMs]);

  const protectionProgress = useMemo(() => {
    if (!session?.protectionEndsAt) return 0;
    const total = protectionMinutes * 60 * 1000;
    return Math.max(0, Math.min(100, (protectionRemainingMs / total) * 100));
  }, [protectionMinutes, protectionRemainingMs, session?.protectionEndsAt]);

  const handleConfirm = async () => {
    if (!session?.pin) return;
    setError("");
    setConfirming(true);
    const res = await fetch(`/api/delivery/${orderSlug}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: session.pin }),
    });
    const data = await res.json();
    setConfirming(false);
    if (!res.ok) {
      setError(data.error || "Confirmation impossible");
      return;
    }
    setSession(data.session);
    onSessionChange?.();
  };

  if (loading && !session) {
    return (
      <div className={styles.deliverySecure} aria-busy="true">
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <p className={styles.subtitle}>Chargement de la validation sécurisée…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (isReleased) {
    return (
      <div className={styles.deliverySecure}>
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <div className={styles.successPanel}>
            <span className={styles.successIcon}>
              <IconCheck size={28} />
            </span>
            <h3 className={styles.successTitle}>Transaction finalisée</h3>
            <p className={styles.successText}>Les fonds ont été libérés au vendeur.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isProtection || session.clientDeliveryConfirmedAt) {
    const pin = session.pin;
    return (
      <div className={styles.deliverySecure}>
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <div className={styles.successPanel}>
            <span className={styles.successIcon}>
              <IconCheck size={28} />
            </span>
            <h3 className={styles.successTitle}>Réception confirmée</h3>
            <p className={styles.successText}>
              Séquestre Flash actif — {protectionMinutes} min pour signaler un problème avant
              libération au vendeur.
            </p>
            <p className={styles.countdownTime}>{formatCountdown(protectionRemainingMs)}</p>
            <div className={styles.protectionBar}>
              <div className={styles.protectionFill} style={{ width: `${protectionProgress}%` }} />
            </div>
            {pin && (
              <div className={styles.shareRow}>
                <Link href={`/litige?code=${pin}`} className="btn-ghost dispute-link">
                  Ouvrir un litige
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.deliverySecure} aria-live="polite">
      <div className={styles.captureShield} aria-hidden="true" />

      <div className={styles.glassInner}>
        <div className={styles.liveBadge}>
          <motion.span
            className={styles.liveDot}
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.65, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          Session sécurisée active
        </div>

        <h2 className={styles.title}>Validation livraison</h2>
        <p className={styles.subtitle}>
          {productName} — code unique lié à la commande{" "}
          <span style={{ opacity: 0.7 }}>#{session.orderId.slice(0, 8)}</span>
        </p>

        <div className={styles.consent}>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Je confirme avoir reçu et vérifié mon colis. Je ne communique ce code qu&apos;au
              livreur, jamais au vendeur avant réception.
            </span>
          </label>
        </div>

        {consent && (
          <>
            <div className={styles.pulseWrap}>
              <motion.div
                className={styles.pulseRing}
                animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className={styles.pulseRing}
                animate={{ scale: [1, 1.18, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
              />
              <p className={styles.pinCode}>{session.pin}</p>
            </div>

            <div className={styles.countdown}>
              <p className={styles.countdownLabel}>
                Preuve de vie — expire dans ({DELIVERY_CODE_TTL_MINUTES} min)
              </p>
              <p className={styles.countdownTime}>{formatCountdown(codeRemainingMs)}</p>
              <div className={styles.protectionBar}>
                <div className={styles.protectionFill} style={{ width: `${codeProgress}%` }} />
              </div>
              {codeExpired && (
                <p className={styles.expiredNote}>
                  Affichage code expiré. Vous pouvez toujours confirmer la réception si le colis est
                  OK.
                </p>
              )}
            </div>

            <div className={styles.shareRow}>
              <CopyButton text={session.pin} label="Copier" className="btn-primary pay-code-action" />
              <a
                href={buildWhatsAppUrl(buildPinShareMessage(session.pin, productName))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary share-btn-whatsapp pay-code-action"
                style={{
                  background: "linear-gradient(135deg,#25d366,#128c7e)",
                  color: "#fff",
                  border: "none",
                }}
              >
                WhatsApp
              </a>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.confirmBtn}
            disabled={!canConfirm || confirming}
            onClick={handleConfirm}
          >
            {confirming ? "Confirmation…" : "Confirmer la réception"}
          </button>
          <p className={styles.hint}>
            <IconShield size={14} className={styles.hintIcon} />
            Validation atomique — déclenche le Séquestre Flash {protectionMinutes} min
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
