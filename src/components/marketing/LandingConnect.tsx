"use client";

import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import { Reveal } from "@/components/marketing/Reveal";
import { LandingPhoto } from "@/components/marketing/LandingPhoto";
import { ConnectAccessForm } from "@/components/marketing/ConnectAccessForm";
import { COUNTRIES } from "@/lib/utils";

const FEATURES = [
  {
    title: "Une API, tout le séquestre",
    text: "Créez une transaction, l'acheteur paie en mobile money, l'argent reste bloqué jusqu'à ce que vous décidiez de le libérer ou de le rembourser.",
  },
  {
    title: "Votre commission, automatiquement",
    text: "Fixez votre application_fee à chaque transaction : elle vous est reversée à la libération, sans calcul de votre côté.",
  },
  {
    title: "Code de livraison & litiges",
    text: "Le même code livreur et la même protection 30 min que sur XaalisPay, branchés sur votre parcours.",
  },
  {
    title: `${COUNTRIES.length} pays, webhooks signés`,
    text: "Wave, Orange Money, MTN, Moov… Chaque événement vous est notifié par webhook signé HMAC.",
  },
];

const STEPS = [
  "Vous décrivez votre plateforme et vos flux",
  "On échange avec vous (appel ou WhatsApp) pour cadrer l'intégration",
  "Vous recevez vos accès au portail et vos clés API",
];

const SNIPPET = `curl -X POST $API/api/v1/connect/transactions \\
  -H "Authorization: Bearer $SK" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "beneficiary": "merchant-1",
    "application_fee": 1000,
    "payer": {"name": "Awa", "phone": "+221770000000"},
    "payment_method": "wave",
    "initiate_charge": true
  }'`;

export function LandingConnect() {
  return (
    <section id="connect" className="lp-surface-navy py-20 md:py-28 scroll-mt-20">
      <div className="lp-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <Reveal className="lg:col-span-6">
            <span className="lp-pill lp-pill-dark">XaalisPay Connect · Bêta</span>
            <h2
              className="mt-5 text-white font-semibold"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.1rem)", lineHeight: 1.06, letterSpacing: "-0.025em" }}
            >
              Le séquestre XaalisPay,{" "}
              <span className="italic font-normal text-[#D4A373]">dans votre plateforme.</span>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/70 max-w-xl">
              Marketplace, plateforme de services, application de livraison : branchez notre paiement sécurisé en
              quelques appels d&apos;API. Vos vendeurs sont payés, vos clients sont protégés, et vous touchez votre
              commission.
            </p>

            <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-t border-white/15 pt-4">
                  <dt className="text-[15px] font-semibold text-white">{f.title}</dt>
                  <dd className="mt-1.5 text-[14px] leading-relaxed text-white/60">{f.text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="lg:col-span-6 relative mx-auto w-full max-w-[540px]">
            <LandingPhoto
              src="/landing/connect.webp"
              alt="Équipe produit qui intègre XaalisPay Connect dans un espace de coworking à Dakar"
              sizes="(min-width: 1024px) 540px, 92vw"
              className="aspect-[3/2] w-full rounded-[28px] !bg-white/10"
            />
            <div className="relative -mt-16 mx-4 md:mx-8 rounded-2xl border border-white/10 bg-[#0f1f3a] p-4 md:p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#D4A373]">POST /transactions</span>
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </span>
              </div>
              <pre className="mt-3 overflow-x-auto font-mono text-[11.5px] leading-[1.6] text-white/80">{SNIPPET}</pre>
            </div>
          </Reveal>
        </div>

        <div id="connect-beta" className="mt-20 md:mt-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 scroll-mt-24">
          <Reveal className="lg:col-span-5">
            <h3 className="text-[28px] md:text-[34px] font-semibold text-white leading-[1.1] tracking-tight">
              Rejoignez la bêta.
            </h3>
            <p className="mt-4 text-[16px] leading-relaxed text-white/70">
              Connect tourne déjà en production. On ouvre l&apos;accès progressivement pour accompagner chaque
              intégration de près.
            </p>
            <ol className="mt-8 space-y-5">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-[12px] text-[#D4A373]">
                    0{i + 1}
                  </span>
                  <span className="pt-1 text-[15px] text-white/85">{s}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/connect/docs"
              className="mt-10 inline-flex items-center gap-2 text-[14px] font-medium text-[#D4A373] underline-offset-4 hover:underline"
            >
              Parcourir la documentation <IconArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal className="lg:col-span-7">
            <ConnectAccessForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
