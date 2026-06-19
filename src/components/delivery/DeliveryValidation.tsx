"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck, IconShield } from "@/components/ui/AppIcon";
import { CopyButton } from "@/components/ui/CopyButton";
import { buildPinShareMessage, buildWhatsAppUrl } from "@/lib/share";
import { DELIVERY_CODE_TTL_MINUTES } from "@/lib/delivery-code";
import { apiFetch } from "@/lib/api-client";
import { adaptDeliverySession, type AdaptedDeliverySession } from "@/lib/api-adapters";
import styles from "./DeliveryValidation.module.css";

type DeliverySession = AdaptedDeliverySession;

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
  const [error, setError] = useState("");
  const [codeRemainingMs, setCodeRemainingMs] = useState(0);
  const [protectionRemainingMs, setProtectionRemainingMs] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(false);
  const [pendingElapsed, setPendingElapsed] = useState(0);
  const [renewing, setRenewing] = useState(false);

  // Modal de confirmation PIN
  const [showModal, setShowModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const pendingStartRef = useRef<number | null>(null);
  const verifyCalledRef = useRef(false);

  /* ─── Chargement session ─── */
  const loadSession = useCallback(async () => {
    const res = await apiFetch(`/api/orders/${orderSlug}`);
    if (!res.ok) return;
    const session = adaptDeliverySession(await res.json());
    if (session.status === "pending_payment") {
      if (!pendingStartRef.current) pendingStartRef.current = Date.now();
      setPendingPayment(true);
      setLoading(false);
      return;
    }
    pendingStartRef.current = null;
    verifyCalledRef.current = false;
    setPendingPayment(false);
    setSession(session);
    setLoading(false);
  }, [orderSlug]);

  /* Appel verify-payment une seule fois dès pending_payment — Wave n'a pas
   * de webhook garanti, on réconcilie activement plutôt que d'attendre. */
  useEffect(() => {
    if (!pendingPayment || verifyCalledRef.current) return;
    verifyCalledRef.current = true;
    apiFetch(`/api/orders/${orderSlug}/verify-payment`, { method: "POST" })
      .then((r) => r.json())
      .then((raw) => {
        const session = adaptDeliverySession(raw);
        if (session.status !== "pending_payment") {
          pendingStartRef.current = null;
          setPendingPayment(false);
          setSession(session);
          setLoading(false);
        }
      })
      .catch(() => undefined);
  }, [pendingPayment, orderSlug]);

  /* Polling rapide (2 s) en mode pending, normal (5 s) sinon */
  useEffect(() => {
    loadSession();
    const id = setInterval(loadSession, pendingPayment ? 2000 : 5000);
    return () => clearInterval(id);
  }, [loadSession, pendingPayment]);

  /* Compteur secondes pendant l'attente */
  useEffect(() => {
    if (!pendingPayment) { setPendingElapsed(0); return; }
    const id = setInterval(() => {
      setPendingElapsed(
        pendingStartRef.current
          ? Math.floor((Date.now() - pendingStartRef.current) / 1000)
          : 0
      );
    }, 1000);
    return () => clearInterval(id);
  }, [pendingPayment]);

  /* ─── Compte à rebours code ─── */
  const codeExpiresAt = session?.deliveryCodeExpiresAt;
  useEffect(() => {
    if (!codeExpiresAt) return;
    const tick = () =>
      setCodeRemainingMs(Math.max(0, new Date(codeExpiresAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [codeExpiresAt]);

  /* ─── Compte à rebours protection ─── */
  useEffect(() => {
    const endsAt = session?.protectionEndsAt;
    if (!endsAt || session?.status !== "protection") return;
    const tick = () =>
      setProtectionRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.protectionEndsAt, session?.status]);

  const codeExpired = codeRemainingMs <= 0 && !!codeExpiresAt;
  const isProtection = session?.status === "protection";
  const isReleased = session?.status === "released";

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

  /* ─── Renouvellement du code ─── */
  const handleRenew = async () => {
    setRenewing(true);
    setError("");
    try {
      const res = await apiFetch(`/api/orders/${orderSlug}/renew-code`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSession(adaptDeliverySession(data));
      } else {
        setError(data.error || "Impossible de renouveler le code.");
      }
    } finally {
      setRenewing(false);
    }
  };

  /* ─── Saisie OTP dans le modal ─── */
  const handleOtpDigit = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    setOtpError("");
    if (char && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const enteredPin = otpDigits.join("");
  const otpComplete = enteredPin.length === 4;

  const openModal = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError("");
    setShowModal(true);
    setTimeout(() => otpRefs[0].current?.focus(), 80);
  };

  const closeModal = () => {
    setShowModal(false);
    setOtpDigits(["", "", "", ""]);
    setOtpError("");
  };

  /* ─── Confirmation finale (envoi au serveur) ─── */
  const handleConfirm = async () => {
    if (!session?.pin || !otpComplete) return;
    setOtpError("");
    setConfirming(true);
    const res = await apiFetch(`/api/orders/${orderSlug}/confirm-delivery-public`, {
      method: "POST",
      body: JSON.stringify({ pin: enteredPin }),
    });
    const data = await res.json();
    setConfirming(false);
    if (!res.ok) {
      setOtpError(data.error || "Code incorrect. Vérifiez et réessayez.");
      setOtpDigits(["", "", "", ""]);
      setTimeout(() => otpRefs[0].current?.focus(), 50);
      return;
    }
    closeModal();
    setSession(adaptDeliverySession(data));
    onSessionChange?.();
  };

  /* ────────────────────────────────────────────
     Rendus conditionnels
  ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className={styles.deliverySecure} aria-busy="true">
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <div className={styles.liveBadge}>
            <motion.span
              className={styles.liveDot}
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            Connexion sécurisée…
          </div>
          <p className={styles.subtitle} style={{ marginTop: "0.6rem" }}>
            Chargement de la session de livraison.
          </p>
        </div>
      </div>
    );
  }

  if (pendingPayment) {
    const showTimeout = pendingElapsed >= 45;
    return (
      <div className={styles.deliverySecure} aria-live="polite">
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <div className={styles.liveBadge}>
            <motion.span
              className={styles.liveDot}
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            Confirmation en cours
          </div>
          <h2 className={styles.title}>Confirmation du paiement</h2>
          <p className={styles.subtitle}>
            Votre paiement Wave / Orange Money est en cours de validation.
            Le code livraison s&apos;affiche automatiquement — restez sur cette page.
          </p>
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              style={{
                display: "inline-block",
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "3px solid #e2e8f0",
                borderTopColor: "#0fd5c7",
              }}
            />
          </div>
          {pendingElapsed > 3 && (
            <p className={styles.pendingTimer}>Vérification en cours… {pendingElapsed}s</p>
          )}
          {showTimeout && (
            <p className={styles.pendingTimeout}>
              Si votre paiement a bien été débité, contactez le vendeur ou{" "}
              <a href="/contact" className={styles.pendingLink}>notre support</a>.
            </p>
          )}
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
            <span className={styles.successIcon}><IconCheck size={24} /></span>
            <h3 className={styles.successTitle}>Transaction finalisée</h3>
            <p className={styles.successText}>Les fonds ont été libérés au vendeur.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isProtection) {
    return (
      <div className={styles.deliverySecure}>
        <div className={styles.captureShield} aria-hidden="true" />
        <div className={styles.glassInner}>
          <div className={styles.successPanel}>
            <span className={styles.successIcon}><IconCheck size={24} /></span>
            <h3 className={styles.successTitle}>Réception confirmée</h3>
            <p className={styles.successText}>
              Séquestre Flash actif — {protectionMinutes} min avant libération au vendeur.
            </p>
            <p className={styles.countdownTime}>{formatCountdown(protectionRemainingMs)}</p>
            <div className={styles.protectionBar}>
              <div className={styles.protectionFill} style={{ width: `${protectionProgress}%` }} />
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href={`/litige?slug=${orderSlug}&code=${session.pin}`}
                className={`btn-ghost ${styles.pendingLink}`}
              >
                Ouvrir un litige
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── État principal : "paid" — affichage du code ── */
  return (
    <>
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
            Code livraison {productName} — à donner au livreur après réception
          </p>

          {/* Avertissement + bouton révélation */}
          {!consent ? (
            <div className={styles.consent}>
              <p className={styles.consentWarn}>
                ⚠️ Ne donnez ce code qu&apos;une fois le colis <strong>entre vos mains</strong>.
              </p>
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setConsent(true)}
              >
                Afficher le code
              </button>
            </div>
          ) : null}

          {/* Révélation du code */}
          <AnimatePresence>
            {consent && (
              <motion.div
                className={styles.pinReveal}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className={styles.pulseWrap}>
                  <motion.div
                    className={styles.pulseRing}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.85, 0.4] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className={styles.pulseRing}
                    animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.45, 0.18] }}
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
                    <p className={styles.expiredNote}>Code expiré — renouveler pour continuer.</p>
                  )}
                </div>

                {/* Copier + Partager sur la même ligne */}
                <div className={styles.shareRow}>
                  <CopyButton
                    text={session.pin}
                    label="Copier"
                    className="btn-primary pay-code-action"
                  />
                  <a
                    href={buildWhatsAppUrl(buildPinShareMessage(session.pin, productName))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary pay-code-action"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg,#25d366,#128c7e)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "999px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      minHeight: 40,
                      textDecoration: "none",
                    }}
                  >
                    WhatsApp
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className={styles.actions}>
            {codeExpired ? (
              <button
                type="button"
                className={styles.renewBtn}
                onClick={handleRenew}
                disabled={renewing}
              >
                {renewing ? "Renouvellement…" : "Renouveler le code"}
              </button>
            ) : (
              <button
                type="button"
                className={styles.confirmBtn}
                disabled={!consent}
                onClick={openModal}
              >
                Confirmer la réception
              </button>
            )}
            <p className={styles.hint}>
              <IconShield size={13} className={styles.hintIcon} />
              Déclenche le Séquestre Flash {protectionMinutes} min
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>

      {/* ── Modal saisie PIN ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.modalBox}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHandle} />
              <h3 className={styles.modalTitle}>Confirmer la réception</h3>
              <p className={styles.modalSubtitle}>
                Saisissez le code ci-dessous pour valider votre réception.
              </p>
              {/* Code affiché dans le modal pour faciliter la saisie */}
              <div className={styles.modalPinDisplay}>
                {session.pin.split("").map((d, i) => (
                  <span key={i} className={styles.modalPinDigit}>{d}</span>
                ))}
              </div>
              <p className={styles.modalPinHint}>↓ Recopiez ce code dans les cases</p>

              {/* OTP 4 chiffres */}
              <div className={styles.otpRow}>
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    className={`${styles.otpDigit}${d ? ` ${styles.otpFilled}` : ""}`}
                    onChange={(e) => handleOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {otpError && <p className={styles.otpError}>{otpError}</p>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={styles.submitBtn}
                  disabled={!otpComplete || confirming}
                  onClick={handleConfirm}
                >
                  {confirming ? (
                    <><span className="btn-spinner" aria-hidden="true" style={{ borderTopColor: "#fff" }} />Validation…</>
                  ) : "Confirmer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
