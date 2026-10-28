"use client";

/* Mockups landing — reproductions FIDÈLES des écrans réels, pas des
   approximations :
   - Écrans vendeur : portés depuis l'app Expo (xaalispay-mobile), mêmes
     valeurs px que les StyleSheet RN (theme/tokens.ts, WalletOverviewCard,
     OrderRow, ActionRequiredCard, StatusBadge, TabButton, wallet/index).
   - Écran acheteur : les VRAIS composants de /orderlink/[slug]
     (PayProtectionBlock, PayOrderSummary, PayClientFields, PayMethodButtons)
     rendus tels quels, dans une coque Safari (parcours acheteur = page web).
   Chaque écran est rendu à la taille d'un vrai téléphone (390 px de large)
   puis réduit en CSS dans <PhoneFrame> — jamais de polices à 6 px. Toute
   modification d'un écran réel doit être répercutée ici. */

import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Home,
  Lock,
  Package,
  RotateCw,
  Settings,
  Share,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { IconCheck, IconLock, IconShield } from "@/components/ui/AppIcon";
import { MoneyTimeline } from "@/components/ui/MoneyTimeline";
import { getBuyerTimeline } from "@/lib/order-timeline";
import {
  PayCheckoutSection,
  PayClientFields,
  PayMethodButtons,
  PayOrderSummary,
  PayProtectionBlock,
} from "@/components/pay/PayPageSections";
import { calculateBuyerProtectionFee, calculateSellerCommission } from "@/lib/fees";
import { splitCurrency } from "@/lib/utils";
import dv from "@/components/delivery/DeliveryValidation.module.css";

/* ─── Tokens (copie de xaalispay-mobile/src/theme/tokens.ts) ─── */
const C = {
  white: "#FFFFFF",
  navy: "#1E3A5F",
  coral: "#D4A373",
  coralHover: "#B8895D",
  gray50: "#F5F5F5",
  gray200: "#DEDEDE",
  muted: "#6B7280",
};
const SANS = "var(--font-sans), Rubik, system-ui, sans-serif";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";
const font = (weight: number, size: number, color: string = C.navy, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: SANS,
  fontWeight: weight,
  fontSize: size,
  color,
  ...extra,
});
const eyebrow: CSSProperties = font(600, 11, C.muted, { letterSpacing: 0.14 * 11, textTransform: "uppercase" });

const SCREEN_W = 390;
const SCREEN_H = 844;

/* ─── Coque ─── */
const ADDRESS_BAR_H = 52;
const BROWSER_TOOLBAR_H = 84;

export function PhoneFrame({
  children,
  width = 280,
  screenHeight = SCREEN_H,
  background = C.white,
  scrollY = 0,
  browserUrl,
  className = "",
}: {
  children: ReactNode;
  /** Simule un défilement de l'écran (px, à l'échelle 390) — pour montrer le bas d'une page longue. */
  scrollY?: number;
  /** Largeur affichée de l'écran (px) — le contenu 390 px est réduit à cette taille. */
  width?: number;
  screenHeight?: number;
  background?: string;
  /** Page web (parcours acheteur, sans app) : affiche la barre d'adresse et la barre d'outils de Safari iOS. */
  browserUrl?: string;
  className?: string;
}) {
  const scale = width / SCREEN_W;
  const browser = Boolean(browserUrl);
  // En-tête fixe (barre d'état + éventuelle barre d'adresse) superposé au
  // contenu dès qu'on simule un défilement ou un navigateur.
  const overlayHeader = browser || Boolean(scrollY);
  const headerH = browser ? 50 + ADDRESS_BAR_H : 50;
  return (
    <div
      className={`relative shrink-0 rounded-[44px] bg-[#0f1a2b] p-[9px] lp-phone ${className}`}
      style={{ width: width + 18 }}
    >
      <div
        className="relative overflow-hidden rounded-[36px]"
        style={{ width, height: screenHeight * scale, background }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden"
          style={{ width: SCREEN_W, height: screenHeight, transform: `scale(${scale})` }}
        >
          <div style={scrollY ? { transform: `translateY(-${scrollY}px)` } : undefined}>
            {overlayHeader ? <div style={{ height: headerH }} /> : <StatusBar />}
            {children}
          </div>
          {overlayHeader ? (
            <div
              className="absolute inset-x-0 top-0"
              style={{ background: browser ? "#F6F6F7" : background, borderBottom: browser ? "0.5px solid #D6D6D8" : undefined }}
            >
              <StatusBar />
              {browser ? <SafariAddressBar url={browserUrl!} /> : null}
            </div>
          ) : null}
          {browser ? <SafariToolbar /> : null}
        </div>
      </div>
    </div>
  );
}

/** Barre d'adresse Safari iOS (affichage « compact » : domaine seul). */
function SafariAddressBar({ url }: { url: string }) {
  return (
    <div className="flex items-center px-4" style={{ height: ADDRESS_BAR_H }} aria-hidden>
      <div
        className="flex h-[38px] w-full items-center gap-2 px-3"
        style={{ background: "#E4E4E7", borderRadius: 12 }}
      >
        <span style={font(500, 15, "#111")}>
          A<span style={{ fontSize: 12 }}>A</span>
        </span>
        <span className="flex flex-1 items-center justify-center gap-1.5">
          <Lock size={13} color="#6B6B70" strokeWidth={2.4} />
          <span style={{ fontFamily: "-apple-system, system-ui, sans-serif", fontSize: 16, color: "#111" }}>{url}</span>
        </span>
        <RotateCw size={15} color="#111" strokeWidth={2.2} />
      </div>
    </div>
  );
}

/** Barre d'outils du bas de Safari iOS. */
function SafariToolbar() {
  const icon = { size: 23, color: "#0A84FF", strokeWidth: 2 } as const;
  return (
    <div
      className="absolute inset-x-0 bottom-0 flex flex-col"
      style={{ height: BROWSER_TOOLBAR_H, background: "#F6F6F7", borderTop: "0.5px solid #D6D6D8" }}
      aria-hidden
    >
      <div className="flex flex-1 items-center justify-between px-7 pt-1">
        <ChevronLeft {...icon} />
        <ChevronRight {...icon} color="#B9B9BE" />
        <Share {...icon} />
        <BookOpen {...icon} />
        <Copy {...icon} />
      </div>
      <div className="flex h-[30px] items-center justify-center">
        <span className="h-[5px] w-[134px] rounded-full bg-black" />
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-[50px] items-center justify-between px-8" aria-hidden>
      <span style={font(600, 16, "#000")}>9:41</span>
      <span className="absolute left-1/2 top-[11px] h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-[2px]">
          {[5, 7, 9, 11].map((h) => (
            <span key={h} className="w-[3px] rounded-[1px] bg-black" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[12px] w-[24px] rounded-[4px] border-[1.5px] border-black/40 p-[1.5px]">
          <span className="block h-full w-[80%] rounded-[2px] bg-black" />
        </span>
      </span>
    </div>
  );
}

/* ─── Briques vendeur (portées depuis xaalispay-mobile) ─── */

type DemoOrder = {
  productName: string;
  clientName: string;
  zone?: string;
  gross: number;
  status: "paid" | "protection" | "released" | "dispute";
};

const BADGE: Record<DemoOrder["status"], { label: string; bg: string; fg: string }> = {
  paid: { label: "En séquestre", bg: "#EEF2F6", fg: C.navy },
  protection: { label: "En séquestre", bg: "#EEF2F6", fg: C.navy },
  released: { label: "Libérée", bg: C.gray50, fg: C.muted },
  dispute: { label: "Litige", bg: "#F7EEE3", fg: C.coralHover },
};

function StatusBadge({ status }: { status: DemoOrder["status"] }) {
  const b = BADGE[status];
  return (
    <span className="self-end rounded-[6px] px-2 py-[3px]" style={{ background: b.bg, ...font(600, 10.5, b.fg) }}>
      {b.label}
    </span>
  );
}

function ThumbEmpty({ size = 38, radius = 11 }: { size?: number; radius?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{ width: size, height: size, borderRadius: radius, background: C.gray50, border: "1px solid #ECECEC" }}
    >
      <Package size={size > 40 ? 18 : 17} color={C.muted} strokeWidth={1.75} />
    </span>
  );
}

function OrderRow({ order }: { order: DemoOrder }) {
  const [amount] = splitCurrency(order.gross - calculateSellerCommission(order.gross));
  return (
    <div
      className="flex items-center gap-3 bg-white p-[11px]"
      style={{ border: `1px solid ${C.gray200}`, borderRadius: 14 }}
    >
      <ThumbEmpty />
      <div className="min-w-0 flex-1">
        <p className="truncate" style={font(500, 14)}>
          {order.productName}
        </p>
        <p className="truncate" style={font(400, 12, C.muted)}>
          {order.clientName}
          {order.zone ? ` · ${order.zone}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-[3px]">
        <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 14, color: C.navy }}>{amount}</span>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}

function WalletOverviewCard({ available, sequestered, nextRelease }: { available: number; sequestered: number; nextRelease: number }) {
  const [availAmount, availSuffix] = splitCurrency(available);
  const gridLabel = font(600, 10, "rgba(255,255,255,0.5)", { letterSpacing: 0.7, textTransform: "uppercase" });
  return (
    <div className="flex flex-col gap-1" style={{ background: C.navy, borderRadius: 22, padding: 16 }}>
      <div className="flex items-center justify-between">
        <span style={font(600, 11, "rgba(255,255,255,0.55)", { letterSpacing: 0.99, textTransform: "uppercase" })}>
          Solde disponible
        </span>
        <BookmarkCheck size={18} color="rgba(255,255,255,0.5)" strokeWidth={1.75} />
      </div>
      <p className="mt-1" style={font(500, 32, C.white)}>
        {availAmount}
        <span style={font(400, 15, "rgba(255,255,255,0.5)")}> {availSuffix}</span>
      </p>
      <div
        className="mt-3 flex min-h-[44px] items-center justify-center gap-1.5"
        style={{ borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        <span style={font(500, 14, C.white)}>Retirer vers mobile money</span>
        <ArrowRight size={16} color={C.white} strokeWidth={1.75} />
      </div>
      <div className="mt-3 flex pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.13)" }}>
        <div className="flex flex-1 flex-col gap-[5px]">
          <span style={gridLabel}>En séquestre</span>
          <span style={{ fontFamily: MONO, fontSize: 16, color: C.white }}>{splitCurrency(sequestered)[0]}</span>
        </div>
        <span className="mx-3 w-px" style={{ background: "rgba(255,255,255,0.13)" }} />
        <div className="flex flex-1 flex-col gap-[5px]">
          <span className="flex items-center gap-1" style={gridLabel}>
            <Clock size={11} color="rgba(255,255,255,0.5)" strokeWidth={2} />
            Prochaine libération
          </span>
          <span style={{ fontFamily: MONO, fontSize: 17, color: C.white }}>
            24:12
            <span style={font(400, 13, "rgba(255,255,255,0.7)")}>
              {" "}
              · {splitCurrency(nextRelease - calculateSellerCommission(nextRelease))[0]}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionRequiredRow({
  productName,
  clientName,
  price,
  paidAgo,
  expanded,
  divider,
}: {
  productName: string;
  clientName: string;
  price: number;
  paidAgo: string;
  expanded?: boolean;
  divider?: boolean;
}) {
  const [priceAmount, priceSuffix] = splitCurrency(price);
  return (
    <div className="flex flex-col gap-2 p-3" style={divider ? { borderBottom: `1px solid ${C.gray200}` } : undefined}>
      <div className="flex items-center gap-[11px]">
        <ThumbEmpty size={44} radius={12} />
        <div className="min-w-0 flex-1">
          <p className="truncate" style={font(500, 14)}>
            {productName}
          </p>
          <p className="truncate" style={font(400, 12, C.muted)}>
            {clientName} · payé {paidAgo}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span style={{ fontFamily: MONO, fontSize: 15, color: C.navy }}>{priceAmount}</span>
          <span style={font(400, 10, C.muted)}>{priceSuffix}</span>
        </div>
      </div>
      {expanded ? (
        <>
          <div className="flex items-center gap-2">
            <div
              className="grid min-h-[48px] flex-1 place-items-center"
              style={{ border: `2px solid ${C.navy}`, borderRadius: 12, background: "rgba(255,255,255,0.95)" }}
            >
              <span style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 0.22 * 18, color: C.navy }}>4821</span>
            </div>
            <div
              className="grid min-h-[52px] flex-1 place-items-center px-3"
              style={{ background: C.coral, borderRadius: 10 }}
            >
              <span style={font(600, 15, C.white)}>Valider la livraison</span>
            </div>
          </div>
          <span style={font(400, 12.5, "#94a3b8", { textDecoration: "underline" })}>
            Je ne peux pas livrer cette commande
          </span>
        </>
      ) : (
        <span
          className="mt-0.5 inline-flex items-center gap-[5px] self-start bg-white px-[13px] py-2"
          style={{ border: "1px solid #E3C9AC", borderRadius: 9 }}
        >
          <span style={font(500, 13, C.coralHover)}>Valider</span>
          <ArrowRight size={14} color={C.coralHover} strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}

const TABS: { label: string; icon: LucideIcon }[] = [
  { label: "Accueil", icon: Home },
  { label: "Boutique", icon: Store },
  { label: "Portefeuille", icon: Wallet },
  { label: "Paramètres", icon: Settings },
];

function TabBar({ active }: { active: number }) {
  return (
    <div
      className="absolute inset-x-4 flex gap-1 bg-white p-1.5"
      style={{ bottom: 34 + 14, border: `1px solid ${C.gray200}`, borderRadius: 999 }}
    >
      {TABS.map((t, i) => {
        const on = i === active;
        return (
          <span
            key={t.label}
            className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-1 py-1.5"
            style={on ? { background: C.coral } : undefined}
          >
            <t.icon size={18} color={on ? C.white : C.muted} strokeWidth={1.75} />
            <span style={font(700, 9, on ? C.white : C.muted)}>{t.label}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ─── Écrans complets ─── */

const DEMO_ORDERS: DemoOrder[] = [
  { productName: "Robe wax imprimée", clientName: "Fatou Sow", zone: "Dakar Plateau", gross: 17000, status: "protection" },
  { productName: "Sac à main cuir", clientName: "Mariama Ba", zone: "Pikine", gross: 24500, status: "released" },
  { productName: "Ensemble bazin", clientName: "Awa Diop", zone: "Mermoz", gross: 35000, status: "released" },
  { productName: "Foulard soie", clientName: "Khady Ndiaye", zone: "Rufisque", gross: 9500, status: "released" },
];

/** Accueil vendeur — xaalispay-mobile/src/app/(tabs)/dashboard/index.tsx */
export function DashboardScreen({ withAction = true }: { withAction?: boolean }) {
  return (
    <>
      <div className="flex flex-col gap-[14px] px-4 pt-2">
        <p style={font(400, 14, C.muted)}>
          Bonjour, <span style={font(500, 14)}>Aïssa</span>
        </p>
        <WalletOverviewCard available={184500} sequestered={52250} nextRelease={17000} />
        {withAction ? (
          <div className="flex flex-col gap-2">
            <span style={font(500, 13, C.coralHover)}>Action requise</span>
            <div className="overflow-hidden" style={{ border: `1px solid ${C.gray200}`, borderRadius: 16 }}>
              <ActionRequiredRow productName="Ensemble bazin brodé" clientName="Ndeye Fall" price={35000} paidAgo="il y a 12 min" />
            </div>
          </div>
        ) : null}
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-[5px] p-[13px]" style={{ border: `1px solid ${C.gray200}`, borderRadius: 16 }}>
            <span style={eyebrow}>Ventes · 30 j</span>
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.navy }}>
              612 000 <span style={font(400, 13, C.muted)}>F</span>
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-[5px] p-[13px]" style={{ border: `1px solid ${C.gray200}`, borderRadius: 16 }}>
            <span style={eyebrow}>Commandes</span>
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.navy }}>
              38 <span style={font(400, 13, C.muted)}>ce mois</span>
            </span>
          </div>
        </div>
        <div className="mt-1.5 flex flex-col gap-2">
          <div className="mb-1 flex items-center justify-between">
            <span style={font(500, 16)}>Commandes</span>
            <span style={font(400, 12, C.muted)}>Tout voir ›</span>
          </div>
          {DEMO_ORDERS.map((o) => (
            <OrderRow key={o.productName} order={o} />
          ))}
        </div>
      </div>
      <TabBar active={0} />
    </>
  );
}

/** Carte « Action requise » seule, dépliée (saisie du code livreur). */
export function ActionRequiredScreen() {
  return (
    <>
      <div className="flex flex-col gap-[14px] px-4 pt-2">
        <p style={font(400, 14, C.muted)}>
          Bonjour, <span style={font(500, 14)}>Moussa</span>
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={font(500, 13, C.coralHover)}>Action requise</span>
            <span className="rounded-[20px] px-[9px] py-[3px]" style={{ background: "#F7EEE3", ...font(600, 11, C.coralHover) }}>
              2 à valider
            </span>
          </div>
          <div className="overflow-hidden" style={{ border: `1px solid ${C.gray200}`, borderRadius: 16 }}>
            <ActionRequiredRow
              productName="Sneakers cuir — 42"
              clientName="Ibrahima Sarr"
              price={45000}
              paidAgo="il y a 2 h"
              expanded
              divider
            />
            <ActionRequiredRow productName="Casquette brodée" clientName="Ousmane Kane" price={12000} paidAgo="il y a 5 h" />
          </div>
        </div>
        <WalletOverviewCard available={96000} sequestered={57000} nextRelease={45000} />
      </div>
      <TabBar active={0} />
    </>
  );
}

/** Portefeuille — xaalispay-mobile/src/app/(tabs)/wallet/index.tsx */
export function WalletScreen() {
  const [avail, suffix] = splitCurrency(184500);
  const meta = font(600, 10, "rgba(255,255,255,0.5)", { letterSpacing: 0.7, textTransform: "uppercase" });
  const fieldLabel = font(700, 11, C.muted, { letterSpacing: 0.44, textTransform: "uppercase" });
  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <p style={font(500, 20)}>Portefeuille</p>
          <p style={font(400, 13, C.muted)}>Retirez vos fonds disponibles</p>
        </div>
        <div className="flex flex-col gap-1 p-4" style={{ background: C.navy, borderRadius: 24 }}>
          <span style={font(600, 11, "rgba(255,255,255,0.55)", { letterSpacing: 0.99, textTransform: "uppercase" })}>
            Solde disponible
          </span>
          <p className="mt-1" style={{ fontFamily: MONO, fontSize: 30, color: C.white }}>
            {avail} <span style={font(400, 15, "rgba(255,255,255,0.5)")}>{suffix}</span>
          </p>
          <div className="mt-4 flex gap-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.13)" }}>
            <div className="flex flex-1 flex-col gap-[5px]">
              <span style={meta}>En séquestre</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: C.white }}>52 250</span>
            </div>
            <div className="flex flex-1 flex-col gap-[5px]">
              <span style={meta}>Bloqué · litige</span>
              <span style={{ fontFamily: MONO, fontSize: 16, color: C.white }}>0</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 bg-white p-4" style={{ border: `1px solid ${C.gray200}`, borderRadius: 24 }}>
          <span style={eyebrow}>Retrait</span>
          <span style={font(500, 16)}>Retirer vers mobile money</span>
          <span style={font(400, 13, C.muted)}>Retrait 100 % gratuit, sans frais déduit.</span>
          <div className="flex flex-col gap-1.5">
            <span style={font(500, 14)}>Montant</span>
            <div className="flex min-h-[56px] items-center px-4" style={{ background: C.gray50, borderRadius: 12 }}>
              <span style={font(500, 16)}>184500</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span style={fieldLabel}>Numéro de réception</span>
            <div className="flex gap-2">
              <span className="flex min-h-[56px] items-center px-3" style={{ background: C.gray50, borderRadius: 12, ...font(700, 15) }}>
                +221
              </span>
              <span className="flex min-h-[56px] flex-1 items-center px-4" style={{ background: C.gray50, borderRadius: 12, ...font(500, 16) }}>
                77 123 45 67
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span style={fieldLabel}>Méthode</span>
            <div className="flex gap-2">
              <span
                className="flex min-h-[48px] flex-1 items-center gap-1 px-3"
                style={{ background: C.white, border: `1.5px solid ${C.navy}`, borderRadius: 10 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brands/wave-favicon.png" alt="" width={22} height={22} />
                <span className="flex-1" style={font(600, 13)}>Wave</span>
                <Check size={16} color={C.navy} />
              </span>
              <span
                className="flex min-h-[48px] flex-1 items-center gap-1 px-3"
                style={{ background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 10 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brands/orange-favicon.png" alt="" width={22} height={22} />
                <span className="flex-1" style={font(600, 13, C.muted)}>Orange</span>
              </span>
            </div>
          </div>
          <div
            className="flex justify-between p-3"
            style={{ borderRadius: 14, background: "rgba(15,31,102,0.04)", border: "1px solid rgba(15,31,102,0.08)" }}
          >
            <span style={font(400, 15)}>Vous recevrez</span>
            <span style={font(700, 15)}>184 500 F</span>
          </div>
          <div className="grid min-h-[52px] place-items-center" style={{ background: C.coral, borderRadius: 10 }}>
            <span style={font(600, 16, C.white)}>Confirmer le retrait</span>
          </div>
        </div>
      </div>
      <TabBar active={2} />
    </>
  );
}

/* ─── Écrans acheteur (vrais composants de /orderlink/[slug]) ─── */

/** Page de paiement acheteur — mêmes composants que app/orderlink/[slug]/page.tsx. */
export function CheckoutScreen() {
  const price = 15000;
  const delivery = 1500;
  const protectionFee = calculateBuyerProtectionFee(price + delivery);
  return (
    <div className="pay-app pointer-events-none select-none" style={{ minHeight: 0 }} aria-hidden>
      <header className="pay-brand-bar">
        <BrandMark href={null} />
        <span className="pay-secure-pill">
          <IconLock size={14} />
          Sécurisé
        </span>
      </header>
      <div className="pay-sheet pay-sheet-flat">
        <div className="pay-sheet-handle" />
        <PayProtectionBlock protectionMinutes={30} />
        <PayOrderSummary
          productName="Robe wax imprimée"
          productImage="/landing/product-wax.webp"
          productPrice={price}
          deliveryCost={delivery}
          buyerProtectionFee={protectionFee}
          seller={{ displayName: "Aïssa Boutique", username: "aissa" }}
        />
        <PayCheckoutSection>
          <PayClientFields
            values={{
              firstName: "Awa",
              lastName: "Ndiaye",
              phone: "77 123 45 67",
              address: "Sacré-Cœur 3, villa 42",
              deliveryZoneId: "dakar",
            }}
            onChange={() => undefined}
            zones={[{ id: "dakar", name: "Dakar", price: delivery }]}
            totalToPay={price + delivery + protectionFee}
            country="SN"
          />
        </PayCheckoutSection>
        <PayMethodButtons country="SN" />
      </div>
    </div>
  );
}

/** Page acheteur après paiement — même structure que la branche
 * `showDelivery` de app/orderlink/[slug]/page.tsx (BrandMark, carte
 * « Paiement confirmé », MoneyTimeline) avec le markup/CSS de
 * DeliveryValidation (état « paid », code révélé). DeliveryValidation n'est
 * pas rendu tel quel : il interroge l'API et anime via framer-motion. */
export function DeliveryCodeScreen() {
  return (
    <div className="pay-success-screen pointer-events-none select-none" style={{ minHeight: 0 }} aria-hidden>
      <BrandMark size="lg" href={null} />
      <div className="pay-success-card" style={{ marginTop: "2rem", maxWidth: 480 }}>
        <div className="pay-success-ring">
          <div className="pay-success-check">
            <IconCheck size={24} />
          </div>
        </div>
        <h1 className="pay-success-title">Paiement confirmé</h1>
        <MoneyTimeline steps={getBuyerTimeline("paid")} />
        <div style={{ marginTop: "1.25rem" }}>
          <div className={dv.deliverySecure}>
            <div className={dv.captureShield} />
            <div className={dv.glassInner}>
              <div className={dv.liveBadge}>
                <span className={`${dv.liveDot} lp-animate-pulse-dot`} />
                Session sécurisée active
              </div>
              <h2 className={dv.title}>Validation livraison</h2>
              <p className={dv.subtitle}>Code livraison Robe wax imprimée — à donner au livreur après réception.</p>
              <div className={dv.pinReveal}>
                <div className={dv.pulseWrap}>
                  <div className={`${dv.pulseRing} lp-animate-ring-pulse`} />
                  <div className={`${dv.pulseRing} lp-animate-ring-pulse`} style={{ animationDelay: "350ms" }} />
                  <p className={dv.pinCode}>4821</p>
                </div>
                <div className={dv.shareRow}>
                  <span className="btn-primary pay-code-action" style={{ flex: 1 }}>
                    Copier
                  </span>
                  <span
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
                    }}
                  >
                    WhatsApp
                  </span>
                </div>
              </div>
              <div className={dv.actions}>
                <button type="button" tabIndex={-1} className={dv.confirmBtn}>
                  Confirmer la réception
                </button>
                <p className={dv.hint}>
                  <IconShield size={13} className={dv.hintIcon} />
                  Déclenche le Séquestre Flash 30 min
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Cartes flottantes (overlay sur photos / à côté du téléphone) ─── */

export function FloatingCard({
  icon,
  title,
  value,
  className = "",
  tone = "light",
}: {
  icon: ReactNode;
  title: string;
  value: ReactNode;
  className?: string;
  tone?: "light" | "navy";
}) {
  const navy = tone === "navy";
  return (
    <div
      className={`lp-float-card flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
        navy ? "bg-[#1E3A5F] lp-text-white" : "bg-white"
      } ${className}`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
          navy ? "bg-white/10 text-[#D4A373]" : "bg-[#F7EEE3] text-[#B8895D]"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block text-[11px] ${navy ? "text-white/60" : "text-[#6B7280]"}`}>{title}</span>
        <span className={`block text-[14px] font-semibold ${navy ? "text-white" : "text-[#1E3A5F]"}`}>{value}</span>
      </span>
    </div>
  );
}
