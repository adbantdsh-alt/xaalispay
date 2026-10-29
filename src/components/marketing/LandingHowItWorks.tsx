"use client";

import { IconWallet, IconTruck, IconClock, IconCheck } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { LandingPhoto } from "@/components/marketing/LandingPhoto";
import {
  CheckoutScreen,
  DeliveryCodeScreen,
  FloatingCard,
  PhoneFrame,
  WalletScreen,
} from "@/components/marketing/AppMockups";

const STEPS = [
  {
    n: "01",
    icon: <IconWallet size={20} />,
    title: "L'acheteur paie",
    desc: "Le paiement est sécurisé chez XaalisPay via Wave, Orange Money, MTN ou Moov. Le vendeur ne touche rien pour l'instant.",
    visual: (
      <PhoneFrame width={250} background="var(--bg-mesh)" scrollY={770} browserUrl="xaalispay.com">
        <CheckoutScreen />
      </PhoneFrame>
    ),
  },
  {
    n: "02",
    icon: <IconTruck size={20} />,
    title: "Le vendeur livre",
    desc: "Le vendeur prépare et expédie sans crainte sous 72 heures maximum ou le client est remboursé automatiquement.",
    visual: <DeliveryPhotoVisual />,
  },
  {
    n: "03",
    icon: <IconClock size={20} />,
    title: "Le client valide",
    desc: "À l'arrivée du colis, le client valide sa réception ou dispose de 30 minutes pour signaler un problème.",
    visual: (
      <PhoneFrame width={250} background="var(--bg-mesh)" scrollY={170} browserUrl="xaalispay.com">
        <DeliveryCodeScreen />
      </PhoneFrame>
    ),
  },
  {
    n: "04",
    icon: <IconCheck size={20} />,
    title: "Paiement libéré",
    desc: "Si aucun litige n'est ouvert 30 minutes après la livraison, l'argent est disponible au retrait pour le vendeur.",
    visual: (
      <PhoneFrame width={250} screenHeight={932}>
        <WalletScreen />
      </PhoneFrame>
    ),
  },
];

export function LandingHowItWorks() {
  return (
    <section id="comment" className="lp-surface-gray py-20 md:py-24">
      <div className="lp-container">
        <Reveal className="max-w-4xl">
          <div className="lp-eyebrow">Comment ça marche</div>
          <h2 className="lp-h2 mt-6 !text-[44px] md:!text-[64px] leading-[1.05]">Quatre étapes. Zéro stress.</h2>
          <p className="mt-6 text-[18px] md:text-[20px] leading-relaxed text-[#6B7280] max-w-2xl">
            Un parcours linéaire, transparent, identique pour chaque transaction.
          </p>
        </Reveal>

        <div className="mt-20 md:mt-28 relative">
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#e3e7ee] -translate-x-1/2"
            aria-hidden
          />

          <div className="space-y-14 md:space-y-20">
            {STEPS.map((s, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={s.n} className="relative md:grid md:grid-cols-2 md:gap-16 items-center">
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 h-14 w-14 rounded-full bg-white lp-hairline items-center justify-center shadow-[0_4px_20px_-8px_rgba(30,58,95,0.25)]">
                    <span className="font-mono text-[13px] font-semibold text-[#1E3A5F]">{s.n}</span>
                  </div>

                  <div className={isEven ? "md:pr-20 md:text-right" : "md:pl-20 md:col-start-2 md:row-start-1"}>
                    <div className="md:hidden flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-full bg-white lp-hairline grid place-items-center font-mono text-[12px] text-[#1E3A5F]">
                        {s.n}
                      </div>
                      <div className="h-px flex-1 bg-[#e3e7ee]" />
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white lp-hairline ${isEven ? "md:ml-auto" : ""}`}
                    >
                      <span className="text-[#1E3A5F]">{s.icon}</span>
                      <span className="text-[12px] font-medium tracking-wide uppercase text-[#6B7280]">
                        Étape {s.n}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[28px] md:text-[40px] font-semibold text-[#1E3A5F] leading-[1.1] tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-5 text-[16px] md:text-[18px] leading-relaxed text-[#6B7280] max-w-md md:max-w-none md:inline-block">
                      {s.desc}
                    </p>
                  </div>

                  <div
                    className={`mt-8 md:mt-0 flex ${
                      isEven
                        ? "md:pl-20 md:col-start-2 justify-center md:justify-start"
                        : "md:pr-20 md:col-start-1 md:row-start-1 justify-center md:justify-end"
                    }`}
                  >
                    {s.visual}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliveryPhotoVisual() {
  return (
    <div className="relative w-full max-w-[420px]">
      <LandingPhoto
        src="/landing/delivery.webp"
        alt="Livreur qui remet un colis à une cliente à Dakar"
        sizes="(min-width: 768px) 420px, 90vw"
        className="aspect-[4/3] rounded-[28px]"
      />
      <FloatingCard
        className="absolute -bottom-5 left-4 md:-left-6"
        icon={<IconTruck size={16} />}
        title="Commande #4821 · en route"
        value="Livraison sous 72 h max"
      />
    </div>
  );
}
