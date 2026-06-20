"use client";

import { useState } from "react";
import { MoneyTimeline } from "@/components/ui/MoneyTimeline";
import { CopyButton } from "@/components/ui/CopyButton";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconLock, IconCheck } from "@/components/ui/AppIcon";
import { getBuyerTimeline } from "@/lib/order-timeline";
import { generatePin } from "@/lib/utils";
import { buildPinShareMessage, buildWhatsAppUrl } from "@/lib/share";
import type { MobileMoneyMethod } from "@/lib/payment-methods";
import { calculateBuyerProtectionFee } from "@/lib/fees";
import {
  PayOrderSummary,
  PayProtectionBlock,
  PayClientFields,
  PayMethodButtons,
  PayCheckoutSection,
  PinConsentGate,
} from "@/components/pay/PayPageSections";

const DEMO = {
  productName: "iPhone 13 Pro Max",
  productPrice: 250000,
  deliveryCost: 2000,
  seller: { displayName: "Adba Shop", username: "adba", phone: "77 123 45 67" },
};

type Mode = "checkout" | "paid";

export default function PayPagePreview() {
  const [mode, setMode] = useState<Mode>("checkout");
  const [pinConsent, setPinConsent] = useState(false);
  const [pin, setPin] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [clientFields, setClientFields] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const handleSimulatePay = async (_method: MobileMoneyMethod) => {
    if (
      !clientFields.firstName.trim() ||
      !clientFields.lastName.trim() ||
      !clientFields.phone.trim() ||
      !clientFields.address.trim()
    ) {
      setError("Remplissez prénom, nom, téléphone et adresse pour simuler.");
      return;
    }
    setError("");
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    setPin(generatePin());
    setPinConsent(false);
    setPaying(false);
    setMode("paid");
  };

  const goPaidTab = () => {
    if (!pin) setPin(generatePin());
    setPinConsent(false);
    setMode("paid");
  };

  const goCheckout = () => {
    setMode("checkout");
    setPinConsent(false);
    setError("");
  };

  if (mode === "paid") {
    return (
      <div className="pay-success-screen">
        <PreviewTabs mode={mode} onCheckout={goCheckout} onPaid={goPaidTab} />
        <BrandMark size="lg" />
        <div className="pay-success-card animate-fade-up" style={{ marginTop: "2rem" }}>
          <div className="pay-success-ring">
            <div className="pay-success-check">
              <IconCheck size={24} />
            </div>
          </div>
          <h1 className="pay-success-title">Paiement confirmé</h1>
          <p className="pay-success-sub">Argent protégé — en attente du colis</p>
          <MoneyTimeline steps={getBuyerTimeline("paid")} />

          <PinConsentGate accepted={pinConsent} onAcceptChange={setPinConsent}>
            <div className="pay-pin-block">
              <p className="pay-pin-label">Code Livraison</p>
              <p className="pay-pin-code">{pin}</p>
            </div>

            <p className="pay-pin-hint">
              Donnez ce code au livreur après vérification du colis.
            </p>

            <div className="share-buttons">
              <CopyButton text={pin} label="Copier le code" className="btn-primary" />
              <a
                href={buildWhatsAppUrl(buildPinShareMessage(pin, DEMO.productName))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary share-btn-whatsapp"
                style={{
                  background: "linear-gradient(135deg,#25d366,#128c7e)",
                  color: "#fff",
                  border: "none",
                }}
              >
                Partager sur WhatsApp
              </a>
            </div>
          </PinConsentGate>

          <p className="pay-preview-sim-note">
            Simulation locale — aucun vrai paiement effectué.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-app">
      <PreviewTabs mode={mode} onCheckout={goCheckout} onPaid={goPaidTab} />
      <header className="pay-brand-bar">
        <BrandMark />
        <span className="pay-secure-pill">
          <IconLock size={14} />
          Sécurisé
        </span>
      </header>
      <div className="pay-sheet pay-sheet-flat animate-fade-up">
        <div className="pay-sheet-handle" />
        <PayOrderSummary
          productName={DEMO.productName}
          productPrice={DEMO.productPrice}
          deliveryCost={DEMO.deliveryCost}
          buyerProtectionFee={calculateBuyerProtectionFee(DEMO.productPrice + DEMO.deliveryCost)}
          seller={DEMO.seller}
        />
        <PayProtectionBlock protectionMinutes={30} />
        <PayCheckoutSection>
          <PayClientFields values={clientFields} onChange={setClientFields} />
        </PayCheckoutSection>
        <PayMethodButtons onPay={handleSimulatePay} paying={paying} />
        {error && <p className="alert-danger" role="alert">{error}</p>}
        <p className="pay-preview-sim-hint">
          Remplissez le formulaire puis cliquez Wave ou Orange pour simuler l&apos;achat.
        </p>
      </div>
    </div>
  );
}

function PreviewTabs({
  mode,
  onCheckout,
  onPaid,
}: {
  mode: Mode;
  onCheckout: () => void;
  onPaid: () => void;
}) {
  return (
    <div className="pay-preview-tabs">
      <button
        type="button"
        className={`pay-preview-tab ${mode === "checkout" ? "pay-preview-tab-active" : ""}`}
        onClick={onCheckout}
      >
        Paiement
      </button>
      <button
        type="button"
        className={`pay-preview-tab ${mode === "paid" ? "pay-preview-tab-active" : ""}`}
        onClick={onPaid}
      >
        Code PIN
      </button>
    </div>
  );
}
