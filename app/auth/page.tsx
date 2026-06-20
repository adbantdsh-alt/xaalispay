"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { OtpInput, emptyDigits } from "@/components/ui/OtpInput";
import { useAuth } from "@/lib/auth-client";
import { requestOtp, verifyOtp, resetPin } from "@/lib/otp-client";
import { isValidSenegalMobilePhone, toSenegalE164 } from "@/lib/utils";

type Step =
  | "login"
  | "login-otp"
  | "signup-phone"
  | "signup-otp"
  | "signup-details"
  | "forgot-phone"
  | "forgot-otp"
  | "forgot-new";

const RESEND_COOLDOWN_SECONDS = 60;

function useResendCooldown() {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  return { remaining, start: () => setRemaining(RESEND_COOLDOWN_SECONDS) };
}

function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">Téléphone</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-black">+221</span>
        <input
          className="input-field"
          style={{ paddingLeft: "3.25rem" }}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder="77 123 45 67"
          autoFocus
        />
      </div>
    </div>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, confirmLogin, signup } = useAuth();
  const initialMode = searchParams.get("mode") === "signup" ? "signup-phone" : "login";

  const [step, setStep] = useState<Step>(initialMode);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(emptyDigits(6));
  const [ticket, setTicket] = useState("");
  const [newPin1, setNewPin1] = useState<string[]>(emptyDigits(4));
  const [newPin2, setNewPin2] = useState<string[]>(emptyDigits(4));
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [signupPin1, setSignupPin1] = useState<string[]>(emptyDigits(4));
  const [signupPin2, setSignupPin2] = useState<string[]>(emptyDigits(4));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const otpPurpose = useRef<"signup" | "pin_reset" | "login">("signup");
  const resend = useResendCooldown();

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const goToLogin = (prefillPhone?: string) => {
    resetMessages();
    setPin("");
    setOtpDigits(emptyDigits(6));
    if (prefillPhone) setPhone(prefillPhone);
    setStep("login");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!isValidSenegalMobilePhone(phone)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const e164 = toSenegalE164(phone);
      const result = await login(e164, pin);
      if (!result.ok) {
        setError(result.error || "Connexion échouée");
        return;
      }
      otpPurpose.current = "login";
      setOtpDigits(emptyDigits(6));
      resend.start();
      setStep("login-otp");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const e164 = toSenegalE164(phone);
      const verify = await verifyOtp(e164, "login", otpDigits.join(""));
      if (!verify.ok || !verify.ticket) {
        setError(verify.error || "Code incorrect");
        setOtpDigits(emptyDigits(6));
        return;
      }
      const result = await confirmLogin(e164, verify.ticket);
      if (!result.ok) {
        setError(result.error || "Connexion échouée");
        return;
      }
      router.push(searchParams.get("redirect") || "/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!isValidSenegalMobilePhone(phone)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(toSenegalE164(phone), "signup");
      if (!result.ok) {
        setError(result.error || "Échec de l'envoi du code");
        return;
      }
      otpPurpose.current = "signup";
      setOtpDigits(emptyDigits(6));
      resend.start();
      setStep("signup-otp");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!isValidSenegalMobilePhone(phone)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(toSenegalE164(phone), "pin_reset");
      // Ne jamais révéler si le compte existe — seules les vraies erreurs
      // (quota, cooldown) bloquent la suite.
      if (!result.ok && result.error?.match(/attendre|Trop de codes/)) {
        setError(result.error);
        return;
      }
      otpPurpose.current = "pin_reset";
      setOtpDigits(emptyDigits(6));
      resend.start();
      setStep("forgot-otp");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const e164 = toSenegalE164(phone);
      const verify = await verifyOtp(e164, otpPurpose.current, otpDigits.join(""));
      if (!verify.ok || !verify.ticket) {
        setError(verify.error || "Code incorrect");
        setOtpDigits(emptyDigits(6));
        return;
      }
      setTicket(verify.ticket);
      setStep(otpPurpose.current === "signup" ? "signup-details" : "forgot-new");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resend.remaining > 0) return;
    resetMessages();
    const result = await requestOtp(toSenegalE164(phone), otpPurpose.current as "signup" | "pin_reset");
    if (!result.ok) {
      setError(result.error || "Échec de l'envoi du code");
      return;
    }
    resend.start();
    setInfo("Nouveau code envoyé.");
  };

  const handleSignupDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const pinValue = signupPin1.join("");
    if (pinValue.length !== 4) {
      setError("Choisissez un code à 4 chiffres.");
      return;
    }
    if (pinValue !== signupPin2.join("")) {
      setError("Les deux codes ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const result = await signup({
        phone: toSenegalE164(phone),
        ticket,
        pin: pinValue,
        display_name: displayName,
        business_name: businessName,
      });
      if (!result.ok) {
        setError(result.error || "Inscription échouée");
        return;
      }
      router.push("/dashboard?welcome=1");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const pinValue = newPin1.join("");
    if (pinValue.length !== 4) {
      setError("Choisissez un code à 4 chiffres.");
      return;
    }
    if (pinValue !== newPin2.join("")) {
      setError("Les deux codes ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const result = await resetPin(toSenegalE164(phone), ticket, pinValue);
      if (!result.ok) {
        setError(result.error || "Échec de la réinitialisation");
        return;
      }
      setPin("");
      setInfo("Code mis à jour — connectez-vous.");
      goToLogin(phone);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Step, { title: string; subtitle: string }> = {
    login: { title: "Bon retour", subtitle: "Accédez à votre espace vendeur" },
    "login-otp": { title: "Confirmation", subtitle: "Code reçu par SMS" },
    "signup-phone": { title: "Créer un compte", subtitle: "Votre boutique en 2 minutes" },
    "signup-otp": { title: "Confirmation", subtitle: "Code reçu par SMS" },
    "signup-details": { title: "Dernière étape", subtitle: "Votre boutique et votre code secret" },
    "forgot-phone": { title: "Code oublié", subtitle: "Recevez un code de vérification" },
    "forgot-otp": { title: "Confirmation", subtitle: "Code reçu par SMS" },
    "forgot-new": { title: "Nouveau code", subtitle: "Choisissez un nouveau code à 4 chiffres" },
  };
  const { title, subtitle } = titles[step];

  return (
    <div className="page-shell animate-fade-in" style={{ padding: "1.5rem 1.25rem" }}>
      <Link href="/" className="text-muted" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
        ← Accueil
      </Link>

      <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
        <BrandMark size="lg" />
      </div>

      <div className="animate-fade-up">
        <h1 className="page-hero-title" style={{ fontSize: "2.25rem", letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          {subtitle}
        </p>
      </div>

      {step === "login" && (
        <>
          <div className="surface mt-6 flex gap-1 p-1 animate-fade-up-d1" style={{ padding: "0.25rem" }}>
            <button type="button" className="tab-pill tab-pill-active">
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("signup-phone");
              }}
              className="tab-pill"
            >
              Inscription
            </button>
          </div>

          <form
            onSubmit={handleLoginSubmit}
            className="surface-card mt-5 animate-fade-up-d2"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <PhoneField value={phone} onChange={setPhone} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Code secret (4 chiffres)</label>
              <input
                className="input-field"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                required
                placeholder="••••"
              />
            </div>

            {error && <p className="alert-danger">{error}</p>}

            <button type="submit" disabled={loading || pin.length !== 4} className="btn-primary">
              {loading ? "Chargement..." : "Se connecter"}
            </button>
            <button
              type="button"
              className="text-muted"
              style={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}
              onClick={() => {
                resetMessages();
                setStep("forgot-phone");
              }}
            >
              Code secret oublié ?
            </button>
          </form>
        </>
      )}

      {(step === "login-otp" || step === "signup-otp" || step === "forgot-otp") && (
        <form
          onSubmit={step === "login-otp" ? handleLoginOtpSubmit : handleOtpSubmit}
          className="surface-card mt-6 animate-fade-up-d2"
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <p className="text-muted" style={{ textAlign: "center" }}>
            Code envoyé au +221 {phone}
          </p>
          <OtpInput length={6} value={otpDigits} onChange={setOtpDigits} autoFocus />

          {info && <p className="toast-success" style={{ textAlign: "center" }}>{info}</p>}
          {error && <p className="alert-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading || otpDigits.join("").length !== 6}
            className="btn-primary"
          >
            {loading ? "Vérification..." : "Confirmer"}
          </button>
          <button
            type="button"
            className="text-muted"
            style={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}
            disabled={resend.remaining > 0}
            onClick={handleResend}
          >
            {resend.remaining > 0 ? `Renvoyer le code (${resend.remaining}s)` : "Renvoyer le code"}
          </button>
        </form>
      )}

      {step === "signup-phone" && (
        <>
          <div className="surface mt-6 flex gap-1 p-1 animate-fade-up-d1" style={{ padding: "0.25rem" }}>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setStep("login");
              }}
              className="tab-pill"
            >
              Connexion
            </button>
            <button type="button" className="tab-pill tab-pill-active">
              Inscription
            </button>
          </div>

          <form
            onSubmit={handleSignupPhoneSubmit}
            className="surface-card mt-5 animate-fade-up-d2"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <PhoneField value={phone} onChange={setPhone} />
            {error && <p className="alert-danger">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Envoi..." : "Recevoir le code"}
            </button>
          </form>
        </>
      )}

      {step === "signup-details" && (
        <form
          onSubmit={handleSignupDetailsSubmit}
          className="surface-card mt-6 animate-fade-up-d2"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Votre nom</label>
            <input
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Amadou Diallo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nom de la boutique</label>
            <input
              className="input-field"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Ma Boutique SN"
            />
            <p className="mt-1 text-xs text-muted">
              Votre XaalisTag (xaalispay.com/seller/...) sera généré automatiquement à partir de ce nom.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Choisissez un code secret (4 chiffres)</label>
            <OtpInput length={4} value={signupPin1} onChange={setSignupPin1} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirmez le code</label>
            <OtpInput length={4} value={signupPin2} onChange={setSignupPin2} />
          </div>
          <p className="text-xs text-muted">
            Ce code remplace le mot de passe — il vous sera demandé pour vous connecter.
          </p>

          {error && <p className="alert-danger">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Création..." : "Créer mon compte vendeur"}
          </button>
        </form>
      )}

      {step === "forgot-phone" && (
        <form
          onSubmit={handleForgotPhoneSubmit}
          className="surface-card mt-6 animate-fade-up-d2"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <PhoneField value={phone} onChange={setPhone} />
          {error && <p className="alert-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Envoi..." : "Recevoir le code"}
          </button>
          <button
            type="button"
            className="text-muted"
            style={{ fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}
            onClick={() => goToLogin()}
          >
            Retour à la connexion
          </button>
        </form>
      )}

      {step === "forgot-new" && (
        <form
          onSubmit={handleForgotNewSubmit}
          className="surface-card mt-6 animate-fade-up-d2"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nouveau code (4 chiffres)</label>
            <OtpInput length={4} value={newPin1} onChange={setNewPin1} autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirmez le code</label>
            <OtpInput length={4} value={newPin2} onChange={setNewPin2} />
          </div>
          {error && <p className="alert-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Enregistrement..." : "Valider"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex min-h-dvh items-center justify-center">
          <div className="spinner" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
