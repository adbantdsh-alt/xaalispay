"use client";

import type { ReactNode } from "react";
import { IconWallet, IconTruck, IconClock, IconCheck, IconStore, IconUser, IconShield } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { formatCurrency, splitCurrency } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    icon: <IconWallet size={20} />,
    title: "L'acheteur paie",
    desc: "Le paiement est sécurisé chez XaalisPay via Wave.",
    visual: <PayMockup />,
  },
  {
    n: "02",
    icon: <IconTruck size={20} />,
    title: "Le vendeur livre",
    desc: "Le vendeur prépare et expédie sans crainte sous 48 heures maximum ou le client est remboursé automatiquement.",
    visual: <DeliveryRouteVisual />,
  },
  {
    n: "03",
    icon: <IconClock size={20} />,
    title: "Le client valide",
    desc: "À l'arrivée du colis, le client valide sa réception ou dispose de 30 minutes pour signaler un problème.",
    visual: <ValidationMockup />,
  },
  {
    n: "04",
    icon: <IconCheck size={20} />,
    title: "Paiement libéré",
    desc: "Si aucun litige n'est ouvert 30 minutes après la livraison, l'argent est disponible au retrait pour le vendeur.",
    visual: <ReleaseMockup />,
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

/* Coque téléphone réutilisable — pas de boîte blanche/ombre autour, le
   mockup est autoporteur (taille réaliste, pas un petit icône perdu dans
   un grand rectangle vide). */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-[220px] md:w-[240px] rounded-[32px] bg-[#1E3A5F] p-[6px] shadow-[0_25px_55px_-18px_rgba(30,58,95,0.45)]">
      <div className="absolute top-[9px] left-1/2 -translate-x-1/2 h-[6px] w-16 rounded-full bg-[#0f1f3a] z-10" />
      <div className="w-full rounded-[26px] bg-white overflow-hidden">{children}</div>
    </div>
  );
}

function PayMockup() {
  return (
    <PhoneFrame>
      <div className="bg-white">
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1 w-9 rounded-full bg-[#DEDEDE]" />
        </div>
        <div className="px-3 pb-4 space-y-2.5 bg-white">
          {/* Bloc protection, état réduit */}
          <div className="rounded-2xl bg-[#F5F5F5] border border-[#DEDEDE] px-2.5 py-2 flex items-center gap-2">
            <span className="h-6 w-6 rounded-[7px] bg-[#1E3A5F] grid place-items-center text-white shrink-0">
              <IconShield size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-[6.5px] font-bold uppercase tracking-wide text-[#1E3A5F] leading-none">
                Protection XaalisPay
              </p>
              <p className="text-[8px] font-bold text-[#0a1628] leading-tight mt-0.5">
                Zéro arnaque. Vous restez maître de votre argent.
              </p>
            </div>
          </div>

          {/* Carte récap commande */}
          <div className="rounded-2xl bg-white border border-[#DEDEDE] p-2.5 space-y-2">
            <div className="flex gap-2 items-center">
              <div className="h-9 w-9 rounded-xl bg-[#F5F5F5] shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold text-[#0a1628] leading-tight truncate">
                  Robe wax imprimée
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-3 w-3 rounded-[3px] bg-[#1E3A5F] text-white text-[5px] grid place-items-center font-bold">
                    A
                  </span>
                  <span className="text-[7px] font-semibold text-[#5c6b82]">Aïssa Boutique</span>
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] text-[5.5px] font-extrabold">
                    <IconCheck size={6} /> Vérifié
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1 text-[7.5px]">
              <div className="flex justify-between">
                <span className="text-[#5c6b82]">Prix</span>
                <span className="font-bold text-[#0a1628]">{formatCurrency(15000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c6b82]">Expédition</span>
                <span className="font-bold text-[#0a1628]">{formatCurrency(1500)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c6b82]">Protection séquestre</span>
                <span className="font-bold text-[#0a1628]">{formatCurrency(500)}</span>
              </div>
            </div>
            <div
              className="flex justify-between items-baseline rounded-[8px] px-2 py-1.5"
              style={{ background: "rgba(212,163,115,0.14)" }}
            >
              <span className="text-[8px] font-bold text-[#0a1628]">Total à payer</span>
              <span className="text-[11px] font-extrabold text-[#1E3A5F]" style={{ fontFamily: "var(--font-mono)" }}>
                {formatCurrency(17000)}
              </span>
            </div>
          </div>

          {/* Boutons de paiement */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-[8px] bg-[#00b8e0] h-7 flex items-center justify-center">
              <span className="text-[9px] font-extrabold lowercase text-[#0a1628]">wave</span>
            </div>
            <div className="rounded-[8px] bg-[#2a2a2a] h-7 flex items-center justify-center">
              <span className="text-[6px] font-extrabold uppercase text-white tracking-wide">Orange Money</span>
            </div>
          </div>

          {/* Vos informations */}
          <div className="pt-2 border-t border-dashed border-[#1E3A5F]/15 space-y-1.5">
            <p className="text-[6px] font-bold uppercase tracking-wide text-[#5c6b82]">Vos informations</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-5 rounded-[6px] bg-[#F5F5F5] border border-[#DEDEDE]" />
              <div className="h-5 rounded-[6px] bg-[#F5F5F5] border border-[#DEDEDE]" />
            </div>
            <div className="flex gap-1">
              <div className="h-5 w-8 rounded-[6px] bg-[#F5F5F5] border border-[#DEDEDE] grid place-items-center text-[5.5px] font-bold text-[#1E3A5F]">
                +221
              </div>
              <div className="h-5 flex-1 rounded-[6px] bg-[#F5F5F5] border border-[#DEDEDE]" />
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function DeliveryRouteVisual() {
  return (
    <div className="relative w-full max-w-[380px] aspect-[4/3] lp-card-flat overflow-hidden p-6 md:p-8">
      <div className="absolute top-4 left-4 z-10 font-mono text-[11px] tracking-wider text-[#D4A373]">02 / 04</div>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <path
          d="M 40 240 C 120 240, 140 120, 240 120 S 360 80, 360 60"
          fill="none"
          stroke="#1E3A5F"
          strokeOpacity="0.18"
          strokeWidth="2"
          strokeDasharray="4 6"
          strokeLinecap="round"
          className="lp-animate-dash"
        />
      </svg>
      <div className="absolute left-6 bottom-6 flex flex-col items-center gap-1.5">
        <div className="h-11 w-11 rounded-xl bg-white lp-hairline grid place-items-center text-[#1E3A5F] shadow-sm">
          <IconStore size={20} />
        </div>
        <div className="text-[9px] font-medium text-[#1E3A5F]">Vendeur</div>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative bg-white lp-hairline rounded-2xl px-3 py-2.5 shadow-[0_15px_40px_-15px_rgba(30,58,95,0.35)] flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[#1E3A5F] grid place-items-center text-[#D4A373]">
            <IconTruck size={16} />
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wide text-[#6B7280]">Colis #4821</div>
            <div className="text-[11px] font-semibold text-[#1E3A5F] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 lp-animate-pulse-dot" />
              En route
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-6 top-6 flex flex-col items-center gap-1.5">
        <div className="h-11 w-11 rounded-xl bg-[#1E3A5F] grid place-items-center text-[#D4A373] shadow-sm">
          <IconUser size={20} />
        </div>
        <div className="text-[9px] font-medium text-[#1E3A5F]">Acheteur</div>
      </div>
    </div>
  );
}

function ValidationMockup() {
  return (
    <PhoneFrame>
      <div className="bg-white px-3.5 pt-5 pb-5">
        <div className="inline-flex items-center gap-1 text-[6.5px] font-bold uppercase tracking-wide text-[#475569]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] lp-animate-pulse-dot" />
          Session sécurisée active
        </div>
        <h3 className="mt-2 text-[11px] font-extrabold text-[#0f172a] leading-tight">Validation livraison</h3>
        <p className="text-[7px] text-[#64748b] leading-snug mt-0.5">
          Code à donner au livreur après réception.
        </p>

        <div className="relative mt-4 mx-auto h-[78px] w-[78px] grid place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-[rgba(212,163,115,0.35)] lp-animate-ring-pulse" />
          <span
            className="absolute -inset-1.5 rounded-full border-2 border-[rgba(212,163,115,0.18)] lp-animate-ring-pulse"
            style={{ animationDelay: "350ms" }}
          />
          <p
            className="relative text-[20px] font-extrabold tracking-[0.25em] text-[#0f172a]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            4821
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[6.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            30 min pour signaler un problème
          </p>
          <p className="text-[14px] font-bold text-[#B8895D] mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
            29:58
          </p>
          <div className="mt-1.5 h-1 w-full rounded-full bg-[#DEDEDE] overflow-hidden">
            <div className="h-full bg-[#D4A373] lp-animate-progress" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Partager le code */}
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <div className="h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center">
            <span className="text-[6.5px] font-bold text-white">Copier</span>
          </div>
          <div
            className="h-6 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}
          >
            <span className="text-[6.5px] font-bold text-white">WhatsApp</span>
          </div>
        </div>

        <div className="mt-4 rounded-full bg-[#D4A373] h-7 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">Confirmer la réception</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function ReleaseMockup() {
  const [intPart, suffix] = splitCurrency(47500);
  return (
    <PhoneFrame>
      <div className="bg-[#F5F5F5] px-3 pt-6 pb-5">
        <p className="text-[8px] font-semibold uppercase tracking-wide text-[#475569]">Portefeuille</p>

        <div className="mt-2.5 rounded-2xl bg-[#1E3A5F] text-white p-3 lp-animate-amount-pop">
          <p className="text-[7px] font-semibold uppercase tracking-wide text-white/55">Solde disponible</p>
          <p className="mt-1 text-[20px] font-medium leading-none" style={{ fontFamily: "var(--font-mono)" }}>
            {intPart}
            <span className="ml-1 text-[9px] opacity-50" style={{ fontFamily: "var(--font-sans)" }}>
              {suffix}
            </span>
          </p>
          <div className="mt-2.5 pt-2 border-t border-white/15 flex gap-3">
            <div>
              <span className="block text-[6px] font-semibold uppercase tracking-wide text-white/50">
                En séquestre
              </span>
              <span className="block mt-0.5 text-[9px] font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                0 F
              </span>
            </div>
            <div>
              <span className="block text-[6px] font-semibold uppercase tracking-wide text-white/50">
                Bloqué · litige
              </span>
              <span className="block mt-0.5 text-[9px] font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                0 F
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white border border-[#DEDEDE] p-2.5 flex items-center gap-2">
          <span
            className="h-7 w-7 rounded-full grid place-items-center shrink-0"
            style={{ background: "#faf3ec", border: "1.5px solid #ecd9c4", color: "#b8895d" }}
          >
            <IconCheck size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-extrabold text-[#0f172a] leading-tight">Transaction finalisée</p>
            <p className="text-[6.5px] text-[#64748b] leading-snug mt-0.5">Fonds libérés au vendeur</p>
          </div>
        </div>

        {/* Historique */}
        <div className="mt-3 space-y-1.5">
          <p className="text-[6px] font-bold uppercase tracking-wide text-[#94a3b8]">Historique</p>
          {[
            { name: "Robe wax imprimée", amount: 17000 },
            { name: "Sac à main cuir", amount: 24500 },
          ].map((tx) => (
            <div
              key={tx.name}
              className="rounded-xl bg-white border border-[#DEDEDE] px-2 py-1.5 flex items-center justify-between gap-2"
            >
              <span className="text-[7px] font-semibold text-[#1E3A5F] truncate">{tx.name}</span>
              <span className="text-[7px] font-bold text-[#15803d] shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                +{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
