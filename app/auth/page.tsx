"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import type { CountryCode } from "libphonenumber-js/max";
import { BrandMark } from "@/components/ui/BrandMark";
import { OtpInput, emptyDigits } from "@/components/ui/OtpInput";
import { useAuth } from "@/lib/auth-client";
import { requestOtp, verifyOtp, resetPin } from "@/lib/otp-client";
import { isValidMobilePhone, normalizeSenegalPhoneLocal, slugifyUsername, toE164 } from "@/lib/utils";

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

// Un seul pays pour l'instant — ajouter une entrée ici suffit pour ouvrir le
// sélecteur à un nouveau marché, le reste (isValidMobilePhone/toE164) suit
// déjà via le paramètre `region`.
const COUNTRIES: { code: CountryCode; dial: string; flag: string }[] = [
  { code: "SN", dial: "+221", flag: "🇸🇳" },
];

function useResendCooldown() {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  return { remaining, start: () => setRemaining(RESEND_COOLDOWN_SECONDS) };
}

/** "+221 77 •• •• 71" — masque les deux groupes du milieu, garde les
 * extrémités pour que l'utilisateur reconnaisse son propre numéro. */
function maskPhoneForDisplay(raw: string, dial: string): string {
  const local = normalizeSenegalPhoneLocal(raw);
  if (local.length !== 9) return `${dial} ${raw}`;
  return `${dial} ${local.slice(0, 2)} •• •• ${local.slice(7)}`;
}

function CountrySelect({ value, onChange }: { value: CountryCode; onChange: (c: CountryCode) => void }) {
  return (
    <div className="auth-country-select">
      <select aria-label="Indicatif pays" value={value} onChange={(e) => onChange(e.target.value as CountryCode)}>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
    </div>
  );
}

function PhoneField({
  value,
  onChange,
  country,
  onCountryChange,
}: {
  value: string;
  onChange: (v: string) => void;
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">Numéro de téléphone</label>
      <div className="phone-field-row">
        <CountrySelect value={country} onChange={onCountryChange} />
        <input
          className="input-field"
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

function TrustRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="auth-trust-row">
      <ShieldCheck size={16} />
      {children}
    </p>
  );
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, confirmLogin, signup } = useAuth();
  const initialMode = searchParams.get("mode") === "signup" ? "signup-phone" : "login";

  const [step, setStep] = useState<Step>(initialMode);
  const [country, setCountry] = useState<CountryCode>("SN");
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

  const dial = COUNTRIES.find((c) => c.code === country)?.dial ?? "+221";

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

  const handleEditPhone = () => {
    resetMessages();
    const target =
      otpPurpose.current === "signup" ? "signup-phone" : otpPurpose.current === "pin_reset" ? "forgot-phone" : "login";
    setStep(target);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!isValidMobilePhone(phone, country)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const e164 = toE164(phone, country);
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
      const e164 = toE164(phone, country);
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
    if (!isValidMobilePhone(phone, country)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(toE164(phone, country), "signup");
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
    if (!isValidMobilePhone(phone, country)) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestOtp(toE164(phone, country), "pin_reset");
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
      const e164 = toE164(phone, country);
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
    const result = await requestOtp(toE164(phone, country), otpPurpose.current as "signup" | "pin_reset");
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
        phone: toE164(phone, country),
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
      const result = await resetPin(toE164(phone, country), ticket, pinValue);
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
    login: { title: "Bon retour", subtitle: "Accédez à votre espace vendeur." },
    "login-otp": { title: "Vérifiez votre numéro", subtitle: "Saisissez le code reçu par WhatsApp." },
    "signup-phone": { title: "Créer un compte", subtitle: "Commencez à encaisser en 2 minutes." },
    "signup-otp": { title: "Vérifiez votre numéro", subtitle: "Saisissez le code reçu par WhatsApp." },
    "signup-details": { title: "Dernière étape", subtitle: "Votre boutique et votre code secret." },
    "forgot-phone": { title: "Code oublié", subtitle: "Recevez un code de vérification." },
    "forgot-otp": { title: "Vérifiez votre numéro", subtitle: "Saisissez le code reçu par WhatsApp." },
    "forgot-new": { title: "Nouveau code", subtitle: "Choisissez un nouveau code à 4 chiffres." },
  };
  const { title, subtitle } = titles[step];

  return (
    <div className="animate-fade-in">
      <div className="auth-hero">
        <Link href="/" className="auth-hero-back">
          ← Accueil
        </Link>
        <div className="auth-hero-brand">
          <BrandMark size="md" href={null} />
        </div>
        <h1 className="auth-hero-title">{title}</h1>
        <p className="auth-hero-subtitle">{subtitle}</p>
      </div>

      <div className="auth-card-wrap animate-fade-up">
        {step === "signup-details" && (
          <div className="auth-progress">
            <div className="auth-progress-track">
              <div className="auth-progress-seg auth-progress-seg-done" />
              <div className="auth-progress-seg auth-progress-seg-done" />
              <div className="auth-progress-seg auth-progress-seg-done" />
            </div>
            <span className="auth-progress-label">3/3</span>
          </div>
        )}

        {step === "login" && (
          <>
            <div className="surface mt-0 flex gap-1 p-1" style={{ padding: "0.25rem" }}>
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
              className="mt-5"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <PhoneField value={phone} onChange={setPhone} country={country} onCountryChange={setCountry} />
              <div>
                <div className="auth-field-row">
                  <label className="text-sm font-medium">Code secret</label>
                  <span className="auth-field-hint">4 chiffres</span>
                </div>
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

              {error && <p className="alert-danger" role="alert">{error}</p>}

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

              <TrustRow>Connexion sécurisée.</TrustRow>
            </form>
          </>
        )}

        {(step === "login-otp" || step === "signup-otp" || step === "forgot-otp") && (
          <form
            onSubmit={step === "login-otp" ? handleLoginOtpSubmit : handleOtpSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className="auth-otp-banner">
              <span className="auth-otp-banner-icon">
                <MessageCircle size={16} />
              </span>
              <span className="auth-otp-banner-text">Code envoyé au {maskPhoneForDisplay(phone, dial)}</span>
              <button type="button" className="auth-otp-banner-edit" onClick={handleEditPhone}>
                Modifier
              </button>
            </div>

            <OtpInput length={6} value={otpDigits} onChange={setOtpDigits} autoFocus />

            {info && <p className="toast-success" role="status" style={{ textAlign: "center" }}>{info}</p>}
            {error && <p className="alert-danger" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading || otpDigits.join("").length !== 6}
              className="btn-primary"
            >
              {loading ? "Vérification..." : "Confirmer"}
            </button>

            <p className="auth-resend-line">
              Vous n&apos;avez rien reçu ?{" "}
              <button type="button" disabled={resend.remaining > 0} onClick={handleResend}>
                {resend.remaining > 0 ? `Renvoyer dans ${resend.remaining}s` : "Renvoyer le code"}
              </button>
            </p>

            <TrustRow>Vérification en 1 étape, sans mot de passe.</TrustRow>
          </form>
        )}

        {step === "signup-phone" && (
          <>
            <div className="surface mt-0 flex gap-1 p-1" style={{ padding: "0.25rem" }}>
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
              className="mt-5"
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <PhoneField value={phone} onChange={setPhone} country={country} onCountryChange={setCountry} />
              {error && <p className="alert-danger" role="alert">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Envoi..." : "Recevoir le code par WhatsApp"}
                {!loading && <ArrowRight size={18} />}
              </button>
              <p className="auth-field-hint" style={{ textAlign: "center" }}>
                Un code de vérification à 6 chiffres vous sera envoyé par WhatsApp.
              </p>

              <div className="auth-divider" />

              <TrustRow>Vendez protégé — paiement séquestré jusqu&apos;à livraison.</TrustRow>
              <p className="auth-consent">
                En continuant, vous acceptez les <Link href="/cgv">CGU</Link> et la{" "}
                <Link href="/confidentialite">Confidentialité</Link>.
              </p>
            </form>
          </>
        )}

        {step === "signup-details" && (
          <form
            onSubmit={handleSignupDetailsSubmit}
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
              <p className="auth-slug-preview">
                Votre lien :{" "}
                <code>xaalispay.com/seller/{slugifyUsername(businessName) || "votre-boutique"}</code>
              </p>
            </div>

            <div>
              <div className="auth-field-row">
                <label className="text-sm font-medium">Choisissez un code secret</label>
                <span className="auth-field-hint">4 chiffres</span>
              </div>
              <OtpInput length={4} value={signupPin1} onChange={setSignupPin1} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirmez le code</label>
              <OtpInput length={4} value={signupPin2} onChange={setSignupPin2} />
            </div>
            <p className="auth-field-hint">
              Ce code remplace le mot de passe — il vous sera demandé pour valider vos retraits et connexions.
            </p>

            {error && <p className="alert-danger" role="alert">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Création..." : "Créer mon compte vendeur"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {step === "forgot-phone" && (
          <form
            onSubmit={handleForgotPhoneSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <PhoneField value={phone} onChange={setPhone} country={country} onCountryChange={setCountry} />
            {error && <p className="alert-danger" role="alert">{error}</p>}
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
            {error && <p className="alert-danger" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Enregistrement..." : "Valider"}
            </button>
          </form>
        )}
      </div>
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
      <div className="page-shell">
        <AuthForm />
      </div>
    </Suspense>
  );
}
