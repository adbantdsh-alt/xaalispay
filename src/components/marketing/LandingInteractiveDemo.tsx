"use client";

import { useEffect, useState } from "react";
import {
  IconWallet,
  IconShield,
  IconTruck,
  IconClock,
  IconCheck,
  IconBanknote,
} from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";

const DEMO_STEPS_BUYER = [
  { icon: IconWallet, label: "Vous payez", detail: "29 000 FCFA via Wave" },
  { icon: IconShield, label: "Argent bloqué", detail: "Protégé chez XaalisPay" },
  { icon: IconTruck, label: "Le vendeur livre", detail: "Le colis arrive" },
  { icon: IconClock, label: "Vous vérifiez", detail: "30 minutes pour valider" },
  { icon: IconCheck, label: "Validation", detail: "Tout est conforme" },
];
const DEMO_STEPS_SELLER = [
  { icon: IconWallet, label: "L'acheteur paie", detail: "Notification reçue" },
  { icon: IconShield, label: "Argent garanti", detail: "Disponible chez XaalisPay" },
  { icon: IconTruck, label: "Vous livrez", detail: "Sans aucun risque" },
  { icon: IconClock, label: "Validation client", detail: "Fenêtre de 30 min" },
  { icon: IconBanknote, label: "Vous êtes payé", detail: "Virement automatique" },
];

export function LandingInteractiveDemo() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [step, setStep] = useState(0);
  const steps = role === "buyer" ? DEMO_STEPS_BUYER : DEMO_STEPS_SELLER;

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, [steps.length]);

  useEffect(() => setStep(0), [role]);

  return (
    <section id="demo" className="lp-surface-gray py-20 md:py-24">
      <div className="lp-container">
        <Reveal className="max-w-3xl">
          <div className="lp-eyebrow">Démo interactive</div>
          <h2 className="lp-h2 mt-4">Vivez le parcours, en 5 secondes.</h2>
        </Reveal>

        <Reveal className="mt-10">
          <div className="inline-flex p-1 lp-hairline rounded-full bg-white">
            <button
              onClick={() => setRole("buyer")}
              className={`px-5 py-2 text-[13px] font-medium rounded-full transition ${
                role === "buyer" ? "bg-[#1E3A5F] lp-text-white" : "text-[#1E3A5F]"
              }`}
            >
              Je suis acheteur
            </button>
            <button
              onClick={() => setRole("seller")}
              className={`px-5 py-2 text-[13px] font-medium rounded-full transition ${
                role === "seller" ? "bg-[#1E3A5F] lp-text-white" : "text-[#1E3A5F]"
              }`}
            >
              Je suis vendeur
            </button>
          </div>
        </Reveal>

        <Reveal className="mt-10 grid grid-cols-1 md:grid-cols-5 gap-2">
          {steps.map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <div
                key={i}
                className={`relative lp-card-flat bg-white p-5 transition-all ${
                  active ? "!border-[#D4A373] shadow-[0_8px_24px_-16px_rgba(212,163,115,0.6)]" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`h-9 w-9 rounded-lg grid place-items-center transition ${
                      active ? "bg-[#D4A373] text-white" : done ? "bg-[#1E3A5F] text-[#D4A373]" : "bg-[#F5F5F5] text-[#1E3A5F]"
                    }`}
                  >
                    <s.icon size={16} />
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">0{i + 1}</span>
                </div>
                <div className="mt-4 text-[14px] font-semibold text-[#1E3A5F]">{s.label}</div>
                <div className="mt-1 text-[12px] text-[#6B7280]">{s.detail}</div>
                {active && (
                  <div className="absolute inset-x-5 bottom-2 h-0.5 rounded-full bg-[#eef1f5] overflow-hidden">
                    <div className="h-full bg-[#D4A373]" style={{ animation: "lp-progress-fill 1.8s linear" }} />
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>

        <p className="mt-8 text-center text-[13px] text-[#6B7280]">
          {role === "buyer"
            ? "Votre argent reste bloqué chez XaalisPay tant que vous n'avez pas validé."
            : "Vous livrez en sachant que le paiement est déjà sécurisé chez XaalisPay."}
        </p>
      </div>
    </section>
  );
}
