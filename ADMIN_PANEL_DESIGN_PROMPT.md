# Prompt — refonte visuelle du panel admin XaalisPay

> Ce fichier est un prompt prêt à copier-coller dans une conversation Claude dédiée au design. Il contient tout le contexte et le code nécessaires pour proposer une meilleure interface visuelle, sans avoir besoin d'accéder au repo.

---

## Contexte produit

XaalisPay est une plateforme d'escrow (paiement séquestre) pour des transactions acheteur/vendeur au Sénégal. L'argent est bloqué jusqu'à confirmation de livraison, puis libéré au vendeur après une fenêtre de protection.

Le panel admin (`/admin`) est un **outil interne** utilisé par la petite équipe XaalisPay (pas par les vendeurs ni les acheteurs) pour :
- surveiller la plateforme (KPIs, analytics) ;
- arbitrer les litiges entre acheteurs et vendeurs ;
- gérer les retraits (relancer les retraits échoués) ;
- consulter/gérer les comptes vendeurs et les produits.

Il vient d'être restructuré : c'était une page unique avec des onglets, c'est maintenant un vrai portail avec une sidebar persistante et une route Next.js dédiée par section (`/admin`, `/admin/analytics`, `/admin/disputes`, `/admin/payouts`, `/admin/sellers`, `/admin/products`), plus une page de connexion à part (`/admin/login`, sans sidebar).

**La demande : une meilleure interface visuelle pour toutes les pages du panel admin** (sidebar, topbar, et les 6 pages). C'est une tâche de design/UI pure — la logique de données (fetch, polling, mutations, props des composants) ne doit pas changer, seul l'habillage visuel (CSS + structure JSX si besoin) est à revoir.

## Objectif

Proposer une interface plus professionnelle, moderne et agréable à utiliser au quotidien par une équipe interne (pense Stripe Dashboard, Linear, Vercel — outils internes denses en information mais clairs), pour :
1. **La coquille** : sidebar (logo, nav, badges, déconnexion), topbar (sync/refresh), page de connexion.
2. **Vue d'ensemble** : KPIs, soldes, revenu, exports CSV.
3. **Analytics** : sélecteur de période + graphiques (recharts).
4. **Litiges** : table de litiges ouverts + modal d'arbitrage détaillé (preuves photo/vidéo, contacts, chronologie, actions de décision).
5. **Retraits** : table des retraits avec relance des échecs.
6. **Vendeurs** : table avec recherche/tri + modal de détail vendeur (solde, commandes, retraits, litiges récents).
7. **Produits** : table avec recherche/filtre/tri + désactivation.

Points qui méritent particulièrement attention :
- Hiérarchie visuelle des KPIs sur la Vue d'ensemble (actuellement des cartes assez plates).
- Densité et lisibilité des tables (beaucoup de colonnes, badges de statut).
- Le modal d'arbitrage de litige est le flux le plus critique (argent réel en jeu) — actions irréversibles, doit inspirer confiance et éviter les clics accidentels.
- Cohérence des badges de statut (good/warn/bad/neutral) à travers toutes les pages.
- Responsive mobile correct (la sidebar bascule déjà en drawer sous 64rem, mais le contenu des pages — tables larges, grilles de KPI — doit aussi bien se comporter en mobile).

## Contraintes techniques

- **Next.js 16** (App Router), **React 19**, TypeScript strict.
- **Tailwind v4** est importé (`@import "tailwindcss";`) mais le panel admin n'utilise **pas** de classes utilitaires Tailwind ni de librairie de composants (pas de shadcn/ui, pas de Radix) — tout le style vient de classes custom écrites à la main dans `app/globals.css` (préfixe `admin-*`). Tu peux proposer d'introduire des classes utilitaires Tailwind si c'est plus simple, mais il faut que ça reste cohérent avec le reste du fichier `globals.css` (pas de second système de design qui cohabite mal avec le premier).
- Icônes : **lucide-react** (déjà utilisé).
- Graphiques : **recharts** (déjà utilisé dans Analytics, voir code plus bas).
- **Pas d'animation lourde** : `framer-motion` est dispo mais le style actuel est volontairement plat, sans ombres (`--shadow-soft/--shadow-card/--shadow-float: none`).
- **Ne pas changer les contrats de props** des composants listés ci-dessous (`AdminDisputesSection`, `AdminPayoutsSection`, etc.) — d'autres fichiers (les "page controllers") dépendent de ces signatures exactes. Si une refonte de structure JSX interne est nécessaire, c'est OK, mais les props d'entrée doivent rester identiques.
- Langue de l'UI : **français**.
- Design tokens de marque à respecter (voir section dédiée ci-dessous) — palette navy/corail, règle 70/20/10, pas de bleu/cyan/orange générique.

## Ce qu'il faut livrer

Pour chaque fichier listé plus bas (composants + CSS), fournir soit :
- le code mis à jour en entier (si la structure JSX change), soit
- un diff clair (avant/après) si seul le CSS change,

de façon à ce que ce soit directement copiable dans le repo. Précise aussi, en une phrase par fichier, **pourquoi** le changement améliore l'expérience (pas juste "plus joli").

---

## Design tokens actuels (`app/globals.css`, racine `:root`)

```css
:root {
  /* XaalisPay — Charte Graphique v2 (règle 70/20/10) */
  --color-white: #FFFFFF;
  --color-navy: #1E3A5F;
  --color-navy-soft: #2C4D7A;
  --color-coral: #D4A373;
  --color-coral-hover: #B8895D;
  --color-gray-50: #F5F5F5;
  --color-gray-200: #DEDEDE;
  --color-muted: #6B7280;

  --bg: var(--color-white);
  --bg-mesh: var(--color-white);
  --surface: var(--color-white);
  --surface-elevated: var(--color-white);
  --surface-muted: var(--color-gray-50);
  --text: var(--color-navy);
  --text-muted: var(--color-muted);
  --text-subtle: var(--color-muted);
  --border-hairline: var(--color-gray-200);

  --accent: var(--color-navy);
  --accent-light: var(--color-navy-soft);
  --accent-dark: var(--color-navy);
  --blue: var(--color-navy);
  --blue-light: var(--color-navy-soft);
  --teal: var(--color-coral);
  --wave: var(--color-coral);
  --wave-dark: var(--color-coral-hover);
  --orange: var(--color-coral);

  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-btn: 10px;
  --shadow-soft: none;
  --shadow-card: none;
  --shadow-float: none;
  --ease: ease-out;
}
```

Note : une partie du CSS admin existant utilise encore des couleurs codées en dur (`#0f1f66`, `rgba(15, 31, 102, ...)`) au lieu de `var(--color-navy)` — c'est une dette de l'ancienne version, n'hésite pas à tout migrer vers les variables CSS si tu refais ces règles.

## Dépendances disponibles (`package.json`)

```json
{
  "dependencies": {
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.18.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "tailwindcss": "^4"
  }
}
```

## Logo / marque

Le logo est géré par un composant existant, à réutiliser tel quel (ne pas le redessiner, juste l'intégrer dans la nouvelle UI) :

```tsx
// src/components/ui/XaalisIcon.tsx
const ICON_SRC = "/branding/xaalis-icon.png";

export function XaalisIcon({
  size = 32,
  className = "brand-icon-img",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={ICON_SRC}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      draggable={false}
    />
  );
}
```

```tsx
// src/components/ui/BrandMark.tsx
import Link from "next/link";
import { XaalisIcon } from "./XaalisIcon";

export function BrandMark({
  size = "md",
  variant = "full",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  href?: string | null;
}) {
  const sizes = { sm: "brand-sm", md: "brand-md", lg: "brand-lg" };
  const iconSizes = { sm: 24, md: 32, lg: 40 };

  const inner =
    variant === "icon" ? (
      <span className="brand-icon" aria-hidden="true">
        <XaalisIcon size={iconSizes[size]} />
      </span>
    ) : (
      <>
        <span className="brand-icon" aria-hidden="true">
          <XaalisIcon size={iconSizes[size]} />
        </span>
        <span className="brand-name">
          <span className="brand-name-strong">Xaalis</span><span className="brand-name-light">Pay</span>
        </span>
      </>
    );

  const mark = <div className={`brand-mark ${sizes[size]}`}>{inner}</div>;

  if (href) {
    return (
      <Link href={href} className="brand-mark-link" aria-label="Xaalis Pay — Accueil">
        {mark}
      </Link>
    );
  }

  return mark;
}
```

---

## Architecture actuelle (coquille du portail)

### `app/admin/(portal)/layout.tsx`
```tsx
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Administration",
  description: "Console d'administration XaalisPay.",
  noIndex: true,
});

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}
```

### `src/components/admin/AdminShellClient.tsx`
```tsx
"use client";

import { useState } from "react";
import { AdminDataProvider } from "./AdminDataProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

export function AdminShellClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminDataProvider>
      <div className="admin-shell">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="admin-content-wrapper">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </AdminDataProvider>
  );
}
```

### `src/components/admin/AdminSidebar.tsx`
```tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  Banknote,
  Users,
  Package,
  LogOut,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";
import { useAdminData } from "./AdminDataProvider";

const NAV_ITEMS = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/disputes", label: "Litiges", icon: ShieldAlert, badge: "disputes" as const },
  { href: "/admin/payouts", label: "Retraits", icon: Banknote, badge: "payouts" as const },
  { href: "/admin/sellers", label: "Vendeurs", icon: Users },
  { href: "/admin/products", label: "Produits", icon: Package },
];

export function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { overview } = useAdminData();

  const failedPayouts = overview?.payouts_by_status.failed ?? 0;
  const openDisputes = overview?.open_disputes_count ?? 0;

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  return (
    <>
      {open && <div className="admin-sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-sidebar-header">
          <BrandMark size="md" href="/admin" />
        </div>

        <nav className="admin-sidebar-nav" aria-label="Sections admin">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badgeCount = item.badge === "disputes" ? openDisputes : item.badge === "payouts" ? failedPayouts : 0;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`admin-sidebar-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`admin-tab-badge ${item.badge === "payouts" ? "admin-tab-badge--warn" : ""}`}>
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-sidebar-link admin-sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
```

### `src/components/admin/AdminTopbar.tsx`
```tsx
"use client";

import { Menu } from "lucide-react";
import { useAdminData } from "./AdminDataProvider";

export function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { lastUpdated, autoRefreshing, refresh } = useAdminData();

  return (
    <header className="admin-topbar">
      <button
        type="button"
        className="admin-topbar-toggle"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      <div className="admin-refresh-group">
        {lastUpdated && (
          <span className={`admin-last-updated ${autoRefreshing ? "admin-last-updated--syncing" : ""}`}>
            {autoRefreshing ? (
              <>
                <span className="btn-spinner admin-sync-spinner" aria-hidden="true" />
                Sync…
              </>
            ) : (
              <>
                <span className="admin-live-dot" aria-hidden="true" />
                {lastUpdated.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </>
            )}
          </span>
        )}
        <button type="button" className="admin-action-btn" onClick={() => refresh({ silent: false })}>
          Actualiser
        </button>
      </div>
    </header>
  );
}
```

### `src/components/admin/AdminDataProvider.tsx` (contexte de données — pas de changement attendu ici, fourni pour contexte)
```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-client";
import type { OverviewData } from "./admin-types";

interface AdminDataContextValue {
  overview: OverviewData | null;
  loading: boolean;
  lastUpdated: Date | null;
  autoRefreshing: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<OverviewData | null>;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

let inflightOverview: Promise<OverviewData | null> | null = null;

async function fetchOverview(): Promise<OverviewData | null> {
  if (inflightOverview) return inflightOverview;

  inflightOverview = (async () => {
    const res = await apiFetch("/api/admin/overview");
    if (!res.ok) return null;
    return (await res.json()) as OverviewData;
  })().finally(() => {
    inflightOverview = null;
  });

  return inflightOverview;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setAutoRefreshing(true);
    else setLoading(true);

    const next = await fetchOverview();
    if (next) {
      setOverview(next);
      setLastUpdated(new Date());
    }

    if (options?.silent) setAutoRefreshing(false);
    else setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    refresh({ silent: false });
  }, [authLoading, refresh]);

  useEffect(() => {
    const onFocus = () => refresh({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh({ silent: true });
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({ overview, loading: loading || authLoading, lastUpdated, autoRefreshing, refresh }),
    [overview, loading, authLoading, lastUpdated, autoRefreshing, refresh]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData doit être utilisé à l'intérieur de <AdminDataProvider>");
  return ctx;
}

export function handleAdminAuthStatus(
  status: number,
  router: ReturnType<typeof useRouter>,
  redirectPath: string
): boolean {
  if (status === 401) {
    router.replace(`/admin/login?redirect=${encodeURIComponent(redirectPath)}`);
    return true;
  }
  if (status === 403) {
    router.replace("/admin/login?error=forbidden");
    return true;
  }
  return false;
}
```

### Page de connexion — `src/components/admin/AdminLoginForm.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/auth-client";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const forbidden = searchParams.get("error") === "forbidden";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await adminLogin(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Connexion échouée");
      return;
    }
    router.replace(searchParams.get("redirect") || "/admin");
  };

  return (
    <div className="page-shell animate-fade-in" style={{ padding: "1.5rem 1.25rem" }}>
      <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
        <BrandMark size="lg" />
      </div>

      <div className="animate-fade-up">
        <h1 className="page-hero-title" style={{ fontSize: "2.25rem", letterSpacing: "-0.02em" }}>
          Panel admin
        </h1>
        <p className="text-muted" style={{ marginTop: "0.5rem" }}>
          Réservé à l&apos;équipe XaalisPay.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="surface-card mt-6 animate-fade-up-d2"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            className="input-field"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="admin-password">
            Mot de passe
          </label>
          <input
            id="admin-password"
            className="input-field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {(error || forbidden) && (
          <p className="alert-danger" role="alert">
            {error || "Session expirée ou accès non autorisé — reconnectez-vous."}
          </p>
        )}

        <button type="submit" disabled={loading || !email || !password} className="btn-primary">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
```

---

## Les 6 pages

Chaque page Next.js (`app/admin/(portal)/<section>/page.tsx`) est un fichier de quelques lignes qui rend un "page controller" (`src/components/admin/Admin<Section>Page.tsx`), lequel gère le fetch/polling/mutations et rend un composant de présentation (`Admin<Section>Section.tsx`). **Les page controllers ne devraient pas avoir besoin de changer** (ils ne contiennent pas de JSX visuel, juste de la donnée) — le travail de design porte sur les composants de présentation ci-dessous. Ils sont inclus pour montrer exactement quelles props chaque composant reçoit.

### 1. Vue d'ensemble — `AdminOverviewSection.tsx`
```tsx
"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import type { OverviewData } from "./admin-types";

async function downloadCsv(path: string, filename: string) {
  const res = await apiFetch(path);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminOverviewSection({
  overview,
  onNavigate,
}: {
  overview: OverviewData;
  onNavigate: (route: "disputes" | "payouts") => void;
}) {
  const [exporting, setExporting] = useState<"orders" | "payouts" | null>(null);

  const exportCsv = async (kind: "orders" | "payouts") => {
    setExporting(kind);
    await downloadCsv(`/api/admin/export/${kind}`, `${kind}.csv`);
    setExporting(null);
  };

  const pendingPayouts = overview.payouts_by_status.pending + overview.payouts_by_status.processing;
  const failedPayouts = overview.payouts_by_status.failed;

  return (
    <section className="admin-section">
      <div className="admin-kpi-grid admin-kpi-grid--compact">
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("disputes")}>
          <p className="admin-kpi-label">Litiges ouverts</p>
          <p className={`admin-kpi-value${overview.open_disputes_count > 0 ? " admin-kpi-value--alert" : ""}`}>
            {overview.open_disputes_count}
          </p>
          <p className="admin-kpi-sub">Arbitrer →</p>
        </button>
        <button type="button" className="admin-kpi admin-kpi--action" onClick={() => onNavigate("payouts")}>
          <p className="admin-kpi-label">Retraits</p>
          <p className="admin-kpi-value">
            {pendingPayouts}
            {failedPayouts > 0 && <span className="admin-kpi-failed"> / {failedPayouts} échoué(s)</span>}
          </p>
          <p className="admin-kpi-sub">Gérer →</p>
        </button>
        <article className="admin-kpi">
          <p className="admin-kpi-label">GMV aujourd&apos;hui</p>
          <p className="admin-kpi-value">{formatCurrency(overview.gmv_today)}</p>
          <p className="admin-kpi-sub">{overview.paid_today_count} commande(s)</p>
        </article>
      </div>

      <article className="admin-card">
        <h2 className="admin-card-title">Plateforme</h2>
        <ul className="admin-health-list">
          <li><span>Vendeurs</span><strong>{overview.sellers_count}</strong></li>
          <li><span>Produits</span><strong>{overview.products_count}</strong></li>
          <li><span>Commandes totales</span><strong>{overview.orders_count}</strong></li>
        </ul>
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Soldes vendeurs (cumulés)</h2>
        <ul className="admin-health-list">
          <li><span>En séquestre</span><strong>{formatCurrency(overview.balances.escrow_total)}</strong></li>
          <li><span>Bloqué (litiges)</span><strong>{formatCurrency(overview.balances.blocked_total)}</strong></li>
          <li><span>Disponible</span><strong>{formatCurrency(overview.balances.available_total)}</strong></li>
          <li><span>Déjà versé</span><strong>{formatCurrency(overview.balances.paid_out_total)}</strong></li>
        </ul>
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Revenu XaalisPay</h2>
        <ul className="admin-health-list">
          <li><span>Frais protection acheteur</span><strong>{formatCurrency(overview.revenue.buyer_protection_fees_total)}</strong></li>
          <li><span>Commissions vendeur</span><strong>{formatCurrency(overview.revenue.seller_commissions_total)}</strong></li>
        </ul>
      </article>

      <article className="admin-card">
        <h2 className="admin-card-title">Exports CSV</h2>
        <div className="admin-export-actions">
          <button type="button" className="admin-action-btn" disabled={exporting === "orders"} onClick={() => exportCsv("orders")}>
            {exporting === "orders" ? "…" : "Télécharger commandes"}
          </button>
          <button type="button" className="admin-action-btn" disabled={exporting === "payouts"} onClick={() => exportCsv("payouts")}>
            {exporting === "payouts" ? "…" : "Télécharger retraits"}
          </button>
        </div>
      </article>
    </section>
  );
}
```

### 2. Analytics — `AdminAnalyticsSection.tsx` (autonome, fetch ses propres données)
```tsx
"use client";

import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsDayPoint, AnalyticsSummaryData, AnalyticsWindowMetrics } from "./admin-types";

const NAVY = "#1E3A5F";
const CORAL = "#D4A373";

function toDateInput(d: Date): string { return d.toISOString().slice(0, 10); }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return toDateInput(d); }

const QUICK_RANGES = [
  { label: "Aujourd'hui", from: () => daysAgo(0) },
  { label: "7 jours", from: () => daysAgo(6) },
  { label: "30 jours", from: () => daysAgo(29) },
  { label: "Tout", from: () => "2024-01-01" },
] as const;

function tickDate(value: string) { return value.slice(5); }
function tooltipLabel(label: unknown) { return tickDate(String(label)); }
function tooltipCurrency(value: unknown) { return formatCurrency(Number(value)); }
function tooltipVolume(value: unknown, name: unknown): [string | number, string] {
  const label = String(name);
  return [label === "GMV (FCFA)" ? formatCurrency(Number(value)) : Number(value), label];
}

function WindowCard({ title, metrics }: { title: string; metrics?: AnalyticsWindowMetrics }) {
  return (
    <article className="admin-kpi">
      <p className="admin-kpi-label">{title}</p>
      <p className="admin-kpi-value">{metrics ? formatCurrency(metrics.gmv) : "—"}</p>
      <p className="admin-kpi-sub">
        {metrics ? `${metrics.orders_count} commande(s)` : ""}
        {metrics && metrics.new_sellers > 0 ? ` · +${metrics.new_sellers} vendeur(s)` : ""}
      </p>
    </article>
  );
}

export function AdminAnalyticsSection() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [days, setDays] = useState<AnalyticsDayPoint[]>([]);
  const [dateFrom, setDateFrom] = useState(daysAgo(29));
  const [dateTo, setDateTo] = useState(daysAgo(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/analytics/summary").then(async (res) => {
      if (res.ok) setSummary(await res.json());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/api/admin/analytics/timeseries?date_from=${dateFrom}&date_to=${dateTo}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setError("Plage de dates invalide."); setDays([]); return; }
        const data = await res.json();
        setDays(data.days);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  const hasActivity = days.some(
    (d) => d.orders_count > 0 || d.buyer_protection_fees > 0 || d.seller_commissions > 0 || d.new_sellers > 0
  );

  return (
    <section className="admin-section">
      <div className="admin-daterange">
        {QUICK_RANGES.map((range) => (
          <button key={range.label} type="button" className="admin-filter"
            onClick={() => { setDateFrom(range.from()); setDateTo(daysAgo(0)); }}>
            {range.label}
          </button>
        ))}
        <input type="date" className="input-field input-compact" value={dateFrom} max={dateTo}
          onChange={(e) => setDateFrom(e.target.value)} />
        <span aria-hidden="true">→</span>
        <input type="date" className="input-field input-compact" value={dateTo} min={dateFrom} max={daysAgo(0)}
          onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="admin-kpi-grid">
        <WindowCard title="Aujourd'hui" metrics={summary?.today} />
        <WindowCard title="7 derniers jours" metrics={summary?.last_7_days} />
        <WindowCard title="30 derniers jours" metrics={summary?.last_30_days} />
        <WindowCard title="Depuis le début" metrics={summary?.all_time} />
      </div>

      {error && <p className="admin-error">{error}</p>}

      {loading ? (
        <p className="admin-empty">Chargement…</p>
      ) : !hasActivity ? (
        <p className="admin-empty">Aucune activité sur cette période.</p>
      ) : (
        <>
          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Volume de commandes &amp; GMV</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipVolume} />
                <Legend />
                <Bar yAxisId="left" dataKey="orders_count" name="Commandes" fill={NAVY} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" dataKey="gmv" name="GMV (FCFA)" stroke={CORAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Revenu XaalisPay</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} formatter={tooltipCurrency} />
                <Legend />
                <Bar dataKey="buyer_protection_fees" name="Frais protection acheteur" stackId="revenue" fill={NAVY} />
                <Bar dataKey="seller_commissions" name="Commissions vendeur" stackId="revenue" fill={CORAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="admin-card admin-chart-card">
            <h2 className="admin-card-title">Nouveaux vendeurs</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={tickDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={tooltipLabel} />
                <Bar dataKey="new_sellers" name="Nouveaux vendeurs" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
        </>
      )}
    </section>
  );
}
```

### 3. Litiges — `AdminDisputesSection.tsx` (le flux le plus critique : table + modal d'arbitrage)
```tsx
"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, isDisputeOverdue, type DisputeRow } from "./admin-types";

type ResolutionAction = "release_full" | "refund_full" | "split";

export function AdminDisputesSection({
  disputes,
  resolving,
  onResolve,
  onActivityChange,
}: {
  disputes: DisputeRow[];
  resolving: string | null;
  onResolve: (disputeId: string, action: ResolutionAction, refundAmount?: number) => Promise<boolean>;
  onActivityChange?: (busy: boolean) => void;
}) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [splitAmount, setSplitAmount] = useState("");
  const [showSplitForm, setShowSplitForm] = useState(false);

  useEffect(() => {
    onActivityChange?.(!!selectedDispute || !!lightboxUrl);
  }, [selectedDispute, lightboxUrl, onActivityChange]);

  const openDispute = (dispute: DisputeRow) => {
    setSelectedDispute(dispute);
    setShowSplitForm(false);
    setSplitAmount("");
  };

  const resolve = async (disputeId: string, action: ResolutionAction, refundAmount?: number) => {
    const ok = await onResolve(disputeId, action, refundAmount);
    if (ok) setSelectedDispute(null);
  };

  return (
    <>
      <section className="admin-section">
        {disputes.length === 0 ? (
          <p className="admin-empty">Aucun litige ouvert — bonne nouvelle.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Commande</th><th>Type</th><th>Vendeur</th><th>Acheteur</th>
                  <th>Montant</th><th>Ouvert le</th><th>Raison</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.orderNumber}</strong><span className="admin-cell-sub">{d.productName}</span></td>
                    <td>
                      {d.disputeTypeLabel}
                      {isDisputeOverdue(d) && <span className="admin-badge bad">Délai dépassé</span>}
                    </td>
                    <td>
                      @{d.sellerUsername}
                      {d.sellerPhone && <span className="admin-cell-sub"><a href={`tel:${d.sellerPhone}`}>{d.sellerPhone}</a></span>}
                    </td>
                    <td>{d.clientName}<span className="admin-cell-sub"><a href={`tel:${d.clientPhone}`}>{d.clientPhone}</a></span></td>
                    <td>{formatCurrency(d.total)}</td>
                    <td>{formatAdminDate(d.disputeOpenedAt)}</td>
                    <td className="admin-dispute-reason">
                      {d.disputeReason ? d.disputeReason.slice(0, 60) + (d.disputeReason.length > 60 ? "…" : "") : <em>Non précisée</em>}
                      {d.disputeMedia.length > 0 && <span className="admin-badge warn">{d.disputeMedia.length} preuve(s)</span>}
                    </td>
                    <td><button type="button" className="admin-action-btn" onClick={() => openDispute(d)}>Arbitrer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedDispute && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDispute(null)}>
          <article className="admin-modal admin-modal--dispute" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal-head">
              <h2>Litige {selectedDispute.orderNumber}</h2>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedDispute(null)}>×</button>
            </header>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">
                {selectedDispute.disputeTypeLabel}
                {isDisputeOverdue(selectedDispute) && <span className="admin-badge bad">Délai dépassé</span>}
              </h3>
              <p className="admin-dispute-text">{selectedDispute.disputeReason || <em>Non précisé par l&apos;acheteur</em>}</p>
              {selectedDispute.sellerResponseDeadlineAt && (
                <p className="admin-contact-sub">Délai vendeur : {formatAdminDate(selectedDispute.sellerResponseDeadlineAt)}</p>
              )}
            </div>

            {selectedDispute.disputeMedia.length > 0 && (
              <div className="admin-dispute-section">
                <h3 className="admin-dispute-section-title">Preuves ({selectedDispute.disputeMedia.length})</h3>
                <div className="admin-media-grid">
                  {selectedDispute.disputeMedia.map((m, i) =>
                    m.type === "image" ? (
                      <button key={i} type="button" className="admin-media-thumb" onClick={() => setLightboxUrl(m.url)} title="Agrandir">
                        <img src={m.url} alt={m.name || `Photo ${i + 1}`} loading="lazy" />
                        <span className="admin-media-overlay">Voir</span>
                      </button>
                    ) : (
                      <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="admin-media-thumb admin-media-video">
                        <span>▶ Vidéo {i + 1}</span>
                      </a>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="admin-dispute-section admin-dispute-contacts">
              <div className="admin-contact-card">
                <p className="admin-contact-role">Acheteur</p>
                <p className="admin-contact-name">{selectedDispute.clientName}</p>
                <div className="admin-contact-actions">
                  <a href={`tel:${selectedDispute.clientPhone}`} className="admin-contact-btn admin-contact-call">Appeler</a>
                  <a href={`https://wa.me/${selectedDispute.clientPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="admin-contact-btn admin-contact-wa">WhatsApp</a>
                </div>
                {selectedDispute.clientAddress && <p className="admin-contact-sub">{selectedDispute.clientAddress}</p>}
              </div>

              <div className="admin-contact-card">
                <p className="admin-contact-role">Vendeur</p>
                <p className="admin-contact-name">{selectedDispute.sellerName}<span className="admin-cell-sub"> @{selectedDispute.sellerUsername}</span></p>
                {selectedDispute.sellerPhone ? (
                  <div className="admin-contact-actions">
                    <a href={`tel:${selectedDispute.sellerPhone}`} className="admin-contact-btn admin-contact-call">Appeler</a>
                    <a href={`https://wa.me/${selectedDispute.sellerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="admin-contact-btn admin-contact-wa">WhatsApp</a>
                  </div>
                ) : (
                  <p className="admin-contact-sub">Téléphone non renseigné</p>
                )}
              </div>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Chronologie</h3>
              <ol className="admin-timeline">
                <li><span className="admin-timeline-dot" /><span className="admin-timeline-label">Commande créée</span><span className="admin-timeline-date">{formatAdminDate(selectedDispute.createdAt)}</span></li>
                {selectedDispute.paidAt && (
                  <li><span className="admin-timeline-dot admin-timeline-dot--ok" /><span className="admin-timeline-label">Paiement confirmé ({selectedDispute.paymentMethod})</span><span className="admin-timeline-date">{formatAdminDate(selectedDispute.paidAt)}</span></li>
                )}
                {selectedDispute.clientDeliveryConfirmedAt && (
                  <li><span className="admin-timeline-dot admin-timeline-dot--ok" /><span className="admin-timeline-label">Réception confirmée par l&apos;acheteur</span><span className="admin-timeline-date">{formatAdminDate(selectedDispute.clientDeliveryConfirmedAt)}</span></li>
                )}
                {selectedDispute.disputeOpenedAt && (
                  <li><span className="admin-timeline-dot admin-timeline-dot--bad" /><span className="admin-timeline-label">Litige ouvert</span><span className="admin-timeline-date">{formatAdminDate(selectedDispute.disputeOpenedAt)}</span></li>
                )}
              </ol>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Montants</h3>
              <dl className="admin-detail-list">
                <div><dt>Total commande</dt><dd>{formatCurrency(selectedDispute.total)}</dd></div>
                <div><dt>Frais protection acheteur</dt><dd>{formatCurrency(selectedDispute.buyerProtectionFee)}</dd></div>
              </dl>
            </div>

            <div className="admin-dispute-section admin-arbitrage">
              <h3 className="admin-dispute-section-title">Décision arbitrage</h3>
              <p className="admin-arbitrage-warn">Action irréversible — vérifiez les preuves et contactez les parties avant de trancher.</p>
              <div className="admin-arbitrage-actions">
                <button type="button" className="admin-arbitrage-btn admin-arbitrage-refund" disabled={resolving !== null} onClick={() => resolve(selectedDispute.id, "refund_full")}>
                  {resolving === selectedDispute.id + "refund_full" ? (<><span className="btn-spinner" aria-hidden="true" />En cours…</>) : "Rembourser intégralement"}
                </button>
                <button type="button" className="admin-arbitrage-btn admin-arbitrage-release" disabled={resolving !== null} onClick={() => resolve(selectedDispute.id, "release_full")}>
                  {resolving === selectedDispute.id + "release_full" ? (<><span className="btn-spinner" aria-hidden="true" />En cours…</>) : "Libérer au vendeur"}
                </button>
                <button type="button" className="admin-arbitrage-btn admin-arbitrage-split" disabled={resolving !== null} onClick={() => setShowSplitForm((v) => !v)}>
                  Remboursement partiel
                </button>
              </div>

              {showSplitForm && (
                <div className="admin-split-form">
                  <label className="admin-split-label" htmlFor="split-amount">
                    Montant envoyé à l&apos;acheteur (le reste est libéré au vendeur, moins commission)
                  </label>
                  <input id="split-amount" type="number" min={1} max={selectedDispute.total - 1} className="input-field input-compact"
                    value={splitAmount} onChange={(e) => setSplitAmount(e.target.value)} placeholder={`Max ${selectedDispute.total - 1} FCFA`} />
                  <button type="button" className="admin-arbitrage-btn admin-arbitrage-split" disabled={resolving !== null || !Number(splitAmount)}
                    onClick={() => resolve(selectedDispute.id, "split", Number(splitAmount))}>
                    {resolving === selectedDispute.id + "split" ? (<><span className="btn-spinner" aria-hidden="true" />En cours…</>) : "Confirmer le partage"}
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>
      )}

      {lightboxUrl && (
        <div className="admin-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Preuve litige" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="admin-lightbox-close" onClick={() => setLightboxUrl(null)}>×</button>
        </div>
      )}
    </>
  );
}
```

### 4. Retraits — `AdminPayoutsSection.tsx`
```tsx
"use client";

import { formatCurrency } from "@/lib/utils";
import { adminStatusClass, formatAdminDate, type PayoutRow } from "./admin-types";

export function AdminPayoutsSection({
  payouts,
  retryingId,
  onRetry,
}: {
  payouts: PayoutRow[];
  retryingId: string | null;
  onRetry: (payoutId: string) => void;
}) {
  const failedCount = payouts.filter((p) => p.status === "failed").length;
  const pendingCount = payouts.filter((p) => p.status === "pending" || p.status === "processing").length;

  return (
    <section className="admin-section">
      {(failedCount > 0 || pendingCount > 0) && (
        <p className="admin-section-hint">
          {pendingCount > 0 && `${pendingCount} en cours`}
          {pendingCount > 0 && failedCount > 0 && " · "}
          {failedCount > 0 && `${failedCount} échoué(s) — relancer si le vendeur n'a pas reçu`}
        </p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Vendeur</th><th>Montant</th><th>Méthode</th><th>Téléphone</th><th>Statut</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr><td colSpan={7}>Aucun retrait</td></tr>
            ) : (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td><strong>{payout.sellerName}</strong><span className="admin-cell-sub">@{payout.sellerUsername}</span></td>
                  <td>{formatCurrency(payout.amount)}</td>
                  <td>{payout.method}</td>
                  <td>{payout.phone}</td>
                  <td>
                    <span className={`admin-badge ${adminStatusClass(payout.status)}`}>{payout.status}</span>
                    {payout.failureReason && <span className="admin-cell-sub">{payout.failureReason}</span>}
                  </td>
                  <td>{formatAdminDate(payout.createdAt)}</td>
                  <td>
                    {payout.status === "failed" ? (
                      <button type="button" className="admin-action-btn" disabled={retryingId === payout.id} onClick={() => onRetry(payout.id)}>
                        {retryingId === payout.id ? "…" : "Relancer"}
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

### 5. Vendeurs — `AdminSellersSection.tsx` + `AdminSellerDetail.tsx` (modal de détail)
```tsx
"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { activeStatusClass, formatAdminDate, type SellerRow } from "./admin-types";
import { AdminSellerDetail } from "./AdminSellerDetail";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récents" },
  { value: "-orders_count", label: "Plus de commandes" },
  { value: "-lifetime_gmv", label: "CA le plus élevé" },
  { value: "business_name", label: "Nom (A→Z)" },
] as const;

export function AdminSellersSection({
  sellers,
  onSearch,
}: {
  sellers: SellerRow[];
  onSearch: (params: { search?: string; ordering?: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, ordering]);

  return (
    <section className="admin-section">
      <div className="admin-filters">
        <input className="input-field input-compact" placeholder="Rechercher un vendeur (nom, @, téléphone)…"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 240px" }} />
        <select className="input-field input-compact" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          {ORDERING_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {sellers.length === 0 ? (
        <p className="admin-empty">Aucun vendeur trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Vendeur</th><th>Téléphone</th><th>Commandes</th><th>CA cumulé</th><th>Solde dispo.</th><th>Inscrit le</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="admin-row-click" onClick={() => setSelectedSellerId(s.id)}>
                  <td><strong>{s.businessName}</strong><span className="admin-cell-sub">@{s.username}</span></td>
                  <td>{s.phone}</td>
                  <td>{s.ordersCount}</td>
                  <td>{formatCurrency(s.lifetimeGmv)}</td>
                  <td>{formatCurrency(s.balance.availableBalance)}</td>
                  <td>{formatAdminDate(s.createdAt)}</td>
                  <td><span className={`admin-badge ${activeStatusClass(s.isActive)}`}>{s.isActive ? "Actif" : "Inactif"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSellerId && <AdminSellerDetail sellerId={selectedSellerId} onClose={() => setSelectedSellerId(null)} />}
    </section>
  );
}
```

```tsx
// AdminSellerDetail.tsx — modal ouvert au clic sur une ligne vendeur
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { activeStatusClass, adminStatusClass, formatAdminDate, type OrderSummaryRow, type PayoutRow, type SellerDetail } from "./admin-types";

export function AdminSellerDetail({ sellerId, onClose }: { sellerId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    apiFetch(`/api/admin/sellers/${sellerId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setError("Vendeur introuvable."); return; }
        setDetail(await res.json()); // adapté en SellerDetail (voir admin-adapters.ts dans le repo)
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sellerId]);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <article className="admin-modal admin-modal--seller" onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <h2>{detail ? detail.profile.businessName : "Vendeur"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        {loading && <p className="admin-empty">Chargement…</p>}
        {!loading && error && <p className="admin-empty">{error}</p>}

        {!loading && detail && (
          <>
            <div className="admin-dispute-section">
              <p className="admin-cell-sub">
                @{detail.profile.username} ·{" "}
                <span className={`admin-badge ${activeStatusClass(detail.profile.isActive)}`}>
                  {detail.profile.isActive ? "Actif" : "Inactif"}
                </span>{" "}
                · Inscrit le {formatAdminDate(detail.profile.createdAt)}
              </p>
              <p className="admin-cell-sub">
                <a href={`tel:${detail.profile.phone}`}>{detail.profile.phone}</a>
                {detail.profile.email && <> · {detail.profile.email}</>}
              </p>
            </div>

            <div className="admin-dispute-section">
              <h3 className="admin-dispute-section-title">Solde</h3>
              <dl className="admin-detail-list">
                <div><dt>En séquestre</dt><dd>{formatCurrency(detail.profile.balance.escrowBalance)}</dd></div>
                <div><dt>Bloqué (litiges)</dt><dd>{formatCurrency(detail.profile.balance.blockedBalance)}</dd></div>
                <div><dt>Disponible</dt><dd>{formatCurrency(detail.profile.balance.availableBalance)}</dd></div>
                <div><dt>Déjà versé</dt><dd>{formatCurrency(detail.profile.balance.paidOutBalance)}</dd></div>
                <div><dt>Commandes (total)</dt><dd>{detail.lifetime.ordersCount}</dd></div>
                <div><dt>CA cumulé</dt><dd>{formatCurrency(detail.lifetime.lifetimeGmv)}</dd></div>
              </dl>
            </div>

            {/* + 3 tables : Commandes récentes / Retraits récents / Litiges récents,
                même structure .admin-table que les autres pages — voir repo pour le détail. */}
          </>
        )}
      </article>
    </div>
  );
}
```

### 6. Produits — `AdminProductsSection.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { formatAdminDate, type ProductRow } from "./admin-types";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récents" },
  { value: "-orders_count", label: "Plus de commandes" },
  { value: "-price", label: "Prix décroissant" },
  { value: "name", label: "Nom (A→Z)" },
] as const;

export function AdminProductsSection({
  products,
  deactivatingId,
  onSearch,
  onDeactivate,
}: {
  products: ProductRow[];
  deactivatingId: number | null;
  onSearch: (params: { search?: string; active?: string; ordering?: string }) => void;
  onDeactivate: (productId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    const id = setTimeout(() => onSearch({ search, active: active || undefined, ordering }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, active, ordering]);

  const handleDeactivate = (product: ProductRow) => {
    if (!window.confirm(`Désactiver « ${product.name} » ? Le produit ne sera plus visible sur la boutique publique.`)) return;
    onDeactivate(product.id);
  };

  return (
    <section className="admin-section">
      <div className="admin-filters">
        <input className="input-field input-compact" placeholder="Rechercher un produit ou un vendeur…"
          value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 240px" }} />
        <button type="button" className={`admin-filter ${active === "" ? "is-active" : ""}`} onClick={() => setActive("")}>Tous</button>
        <button type="button" className={`admin-filter ${active === "true" ? "is-active" : ""}`} onClick={() => setActive("true")}>Actifs</button>
        <button type="button" className={`admin-filter ${active === "false" ? "is-active" : ""}`} onClick={() => setActive("false")}>Inactifs</button>
        <select className="input-field input-compact" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          {ORDERING_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {products.length === 0 ? (
        <p className="admin-empty">Aucun produit trouvé.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Produit</th><th>Vendeur</th><th>Prix</th><th>Commandes</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><span className="admin-cell-sub">{formatAdminDate(p.createdAt)}</span></td>
                  <td>{p.sellerBusinessName}<span className="admin-cell-sub">@{p.sellerUsername}</span></td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.ordersCount}</td>
                  <td><span className={`admin-badge ${p.active ? "good" : "neutral"}`}>{p.active ? "Actif" : "Inactif"}</span></td>
                  <td>
                    {p.active ? (
                      <button type="button" className="admin-action-btn" disabled={deactivatingId === p.id} onClick={() => handleDeactivate(p)}>
                        {deactivatingId === p.id ? "…" : "Désactiver"}
                      </button>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
```

---

## Types de données (`admin-types.ts`, pour référence — pas besoin de redesign)
```ts
export interface OverviewData {
  sellers_count: number;
  products_count: number;
  orders_count: number;
  orders_by_status: Record<string, number>;
  payouts_by_status: Record<string, number>;
  balances: { escrow_total: number; available_total: number; blocked_total: number; paid_out_total: number };
  open_disputes_count: number;
  revenue: { buyer_protection_fees_total: number; seller_commissions_total: number };
  paid_today_count: number;
  gmv_today: number;
}

export interface PayoutRow {
  id: string; sellerUsername: string; sellerName: string; amount: number;
  method: string; phone: string; status: string; failureReason?: string; createdAt: string;
}

export interface DisputeRow {
  id: string; orderNumber: string; slug: string; sellerId: string; sellerUsername: string;
  sellerName: string; sellerPhone: string | null; productName: string; clientName: string;
  clientPhone: string; clientAddress: string | null; status: string; total: number;
  buyerProtectionFee: number; paymentMethod?: string; paidAt?: string; clientDeliveryConfirmedAt?: string;
  disputeType: string; disputeTypeLabel: string; responsibleParty: string; disputeOpenedAt?: string;
  sellerResponseDeadlineAt?: string; disputeReason: string;
  disputeMedia: { type: "image" | "video"; url: string; name?: string }[];
  createdAt: string; updatedAt: string;
}

export interface SellerRow {
  id: number; username: string; businessName: string; displayName: string; phone: string;
  email: string | null; isActive: boolean; createdAt: string; ordersCount: number; lifetimeGmv: number;
  balance: { escrowBalance: number; availableBalance: number; blockedBalance: number; paidOutBalance: number };
}

export interface ProductRow {
  id: number; name: string; price: number; active: boolean;
  sellerUsername: string; sellerBusinessName: string; ordersCount: number; createdAt: string;
}

// + helpers : formatAdminDate(iso), adminStatusClass(status) -> "good"|"warn"|"bad"|"neutral",
// activeStatusClass(isActive), isDisputeOverdue(row)
```

---

## CSS actuel du panel admin (`app/globals.css`, classes `admin-*`)

C'est tout le CSS qui s'applique aux composants ci-dessus. À toi de juger ce qui doit être réécrit entièrement vs. ajusté.

### Coquille (sidebar, topbar, shell)
```css
.admin-shell {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: var(--color-gray-50);
}

.admin-content-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  min-width: 0;
}

.admin-sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-navy);
  color: var(--color-white);
  z-index: 50;
}

.admin-sidebar-header {
  padding: 1.25rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.admin-sidebar-header .brand-name-strong,
.admin-sidebar-header .brand-name-light {
  color: var(--color-white);
}

.admin-sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 0.7rem;
  overflow-y: auto;
}

.admin-sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-btn);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms var(--ease), color 150ms var(--ease);
}

.admin-sidebar-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-white);
}

.admin-sidebar-link.is-active {
  background: var(--color-coral);
  color: var(--color-navy);
}

.admin-sidebar-link .admin-tab-badge {
  margin-left: auto;
}

.admin-sidebar-footer {
  padding: 0.7rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.admin-sidebar-logout {
  color: rgba(255, 255, 255, 0.78);
}

.admin-sidebar-backdrop {
  display: none;
}

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);
}

.admin-topbar-toggle {
  display: none;
  border: none;
  background: none;
  color: var(--color-navy);
  padding: 0.35rem;
  border-radius: var(--radius-btn);
}

.admin-main {
  flex: 1;
  padding: 1.25rem 1.5rem 2.5rem;
}

.admin-loading {
  min-height: 50dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: rgba(15, 31, 102, 0.65);
}

.admin-filter {
  border: 1px solid rgba(15, 31, 102, 0.12);
  background: #fff;
  color: #0f1f66;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.admin-filter.is-active {
  background: #0f1f66;
  color: #fff;
  border-color: #0f1f66;
}

.admin-refresh-group {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

@media (max-width: 64rem) {
  .admin-shell { grid-template-columns: 1fr; }
  .admin-sidebar {
    position: fixed;
    left: 0;
    width: 260px;
    transform: translateX(-100%);
    transition: transform 200ms var(--ease);
  }
  .admin-sidebar.is-open { transform: translateX(0); }
  .admin-sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 31, 102, 0.45);
    z-index: 45;
  }
  .admin-topbar-toggle { display: inline-flex; align-items: center; justify-content: center; }
}

.admin-last-updated {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.admin-last-updated--syncing { color: #3b82f6; }
.admin-live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  animation: livePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.75); }
}
.admin-sync-spinner {
  width: 11px; height: 11px; border-width: 1.5px;
  border-top-color: #3b82f6; border-color: rgba(59, 130, 246, 0.25); border-top-color: #3b82f6;
}

.admin-error {
  margin-bottom: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  font-size: 0.875rem;
}

.admin-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  margin-left: 0.3rem;
  padding: 0 4px;
}
.admin-tab-badge--warn { background: #f59e0b; }
```

### KPIs, cartes, tables, badges, modals (réutilisés par toutes les pages)
```css
.admin-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.admin-kpi-grid--compact { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.admin-kpi--action {
  cursor: pointer;
  text-align: left;
  border: 1px solid var(--color-gray-200);
  transition: border-color 150ms var(--ease);
}
.admin-kpi--action:hover { border-color: var(--color-navy); }
.admin-kpi-value--alert { color: #dc2626; }
.admin-kpi-failed { font-size: 0.875rem; font-weight: 700; color: #b45309; }
.admin-health-ok { color: #15803d; }
.admin-health-bad { color: #b91c1c; font-size: 0.75rem; word-break: break-all; }
.admin-card-title-tag { font-size: 0.8125rem; margin-left: 0.5rem; font-weight: 700; }
.admin-tab-loading { margin: 0.5rem 0 0; font-size: 0.8125rem; }
.admin-section-hint { margin: 0 0 0.75rem; font-size: 0.8125rem; color: rgba(15, 31, 102, 0.65); }

.admin-kpi,
.admin-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: none;
}
.admin-kpi-label,
.admin-card-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(15, 31, 102, 0.55);
}
.admin-kpi-value { margin-top: 0.35rem; font-size: 1.35rem; font-weight: 700; color: #0f1f66; }
.admin-kpi-sub { margin-top: 0.25rem; font-size: 0.82rem; color: rgba(15, 31, 102, 0.6); }
.admin-card-title { margin-bottom: 0.75rem; }
.admin-health-list { list-style: none; display: grid; gap: 0.55rem; }
.admin-health-list li { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }

.admin-table-wrap {
  overflow: auto;
  border-radius: 16px;
  border: 1px solid rgba(15, 31, 102, 0.08);
  background: #fff;
}
.admin-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
.admin-table th,
.admin-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid rgba(15, 31, 102, 0.06); text-align: left; vertical-align: top; }
.admin-table th {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: rgba(15, 31, 102, 0.55); background: rgba(15, 31, 102, 0.03);
}
.admin-row-click { cursor: pointer; }
.admin-row-click:hover { background: rgba(15, 212, 199, 0.06); }
.admin-cell-sub { display: block; margin-top: 0.15rem; font-size: 0.75rem; color: rgba(15, 31, 102, 0.55); }

.admin-badge { display: inline-block; padding: 0.15rem 0.45rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.admin-badge.good { background: rgba(16, 185, 129, 0.12); color: #047857; }
.admin-badge.warn { background: rgba(245, 158, 11, 0.14); color: #b45309; }
.admin-badge.bad { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.admin-badge.neutral { background: rgba(15, 31, 102, 0.08); color: #0f1f66; }

.admin-filters { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.75rem; }
.admin-action-btn { border: none; border-radius: 999px; padding: 0.35rem 0.7rem; background: #0f1f66; color: #fff; font-size: 0.78rem; font-weight: 600; }
.admin-action-btn:disabled { opacity: 0.6; }

.admin-modal-backdrop {
  position: fixed; inset: 0; background: rgba(15, 31, 102, 0.35);
  display: flex; align-items: flex-end; justify-content: center; padding: 1rem; z-index: 80;
}
.admin-modal { width: min(520px, 100%); background: #fff; border-radius: 20px 20px 16px 16px; padding: 1rem 1rem 1.25rem; }
.admin-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.admin-modal-close { border: none; background: transparent; font-size: 1.5rem; line-height: 1; color: #0f1f66; }

.admin-detail-list { display: grid; gap: 0.65rem; }
.admin-detail-list dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(15, 31, 102, 0.55); }
.admin-detail-list dd { margin: 0.15rem 0 0; color: #0f1f66; }

.admin-export-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.admin-export-actions .admin-action-btn { text-decoration: none; display: inline-flex; align-items: center; }

.admin-empty { padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; }
```

### Litiges (modal d'arbitrage, médias, contacts, chronologie)
```css
.admin-dispute-reason { max-width: 280px; }
.admin-modal--dispute { width: min(640px, 100%); max-height: 92dvh; overflow-y: auto; }
.admin-modal--seller { width: min(760px, 100%); max-height: 92dvh; overflow-y: auto; }
.admin-chart-card { margin-top: 0.85rem; min-height: 280px; }
.admin-daterange { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
.admin-dispute-section { padding: 0.85rem 1rem; border-top: 1px solid rgba(15, 31, 102, 0.07); }
.admin-dispute-section-title {
  margin: 0 0 0.6rem; font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted);
}
.admin-dispute-text { margin: 0; font-size: 0.875rem; line-height: 1.6; color: var(--text); }

.admin-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; }
.admin-media-thumb {
  position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 1;
  background: #f1f5f9; border: 1.5px solid #DEDEDE; cursor: pointer; padding: 0;
}
.admin-media-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.admin-media-overlay {
  position: absolute; inset: 0; background: rgba(15, 31, 102, 0.0); color: #fff;
  font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s, background 0.15s;
}
.admin-media-thumb:hover .admin-media-overlay { opacity: 1; background: rgba(15, 31, 102, 0.45); }
.admin-media-video { display: flex; align-items: center; justify-content: center; background: #0f1f66; color: #fff; font-size: 0.8rem; font-weight: 600; text-decoration: none; }

.admin-dispute-contacts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.admin-contact-card { padding: 0.75rem; border-radius: 12px; background: #f8fafc; border: 1px solid #DEDEDE; }
.admin-contact-role { margin: 0 0 0.2rem; font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
.admin-contact-name { margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 700; color: var(--text); }
.admin-contact-actions { display: flex; gap: 0.4rem; }
.admin-contact-btn { flex: 1; padding: 0.35rem 0.5rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; text-align: center; text-decoration: none; border: none; cursor: pointer; }
.admin-contact-call { background: #0f1f66; color: #fff; }
.admin-contact-wa { background: #25d366; color: #fff; }
.admin-contact-sub { margin: 0.4rem 0 0; font-size: 0.75rem; color: var(--text-muted); }

.admin-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.admin-timeline li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
.admin-timeline-dot { width: 10px; height: 10px; border-radius: 999px; background: #cbd5e1; flex-shrink: 0; }
.admin-timeline-dot--ok { background: #0fd5c7; }
.admin-timeline-dot--bad { background: #dc2626; }
.admin-timeline-label { flex: 1; color: var(--text); }
.admin-timeline-date { color: var(--text-muted); font-size: 0.78rem; white-space: nowrap; }

.admin-arbitrage-warn {
  margin: 0 0 0.75rem; padding: 0.6rem 0.75rem; border-radius: 10px;
  background: #fffbeb; border: 1px solid #fde68a; font-size: 0.8125rem; color: #92400e;
}
.admin-arbitrage-actions { display: flex; gap: 0.625rem; }
.admin-arbitrage-btn { flex: 1; min-height: 44px; border-radius: 999px; border: none; font-size: 0.9375rem; font-weight: 800; cursor: pointer; transition: opacity 0.15s; }
.admin-arbitrage-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.admin-arbitrage-refund { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
.admin-arbitrage-release { background: #f0fdf9; color: #059669; border: 1.5px solid #a7f3d0; }
.admin-arbitrage-split { background: #eff6ff; color: #2563eb; border: 1.5px solid #bfdbfe; }
.admin-split-form { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.admin-split-label { font-size: 0.8125rem; color: var(--text-seller-muted, #64748b); }

.admin-lightbox {
  position: fixed; inset: 0; z-index: 200; background: rgba(0, 0, 0, 0.88);
  display: flex; align-items: center; justify-content: center; cursor: zoom-out;
}
.admin-lightbox img { max-width: min(92vw, 840px); max-height: 90dvh; object-fit: contain; border-radius: 12px; }
.admin-lightbox-close {
  position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; border-radius: 999px;
  background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 1.25rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
```

---

## Format de réponse attendu

1. Une courte synthèse de la direction artistique proposée (2-3 phrases) avant le code.
2. Pour chaque fichier modifié : le chemin exact dans le repo (`app/globals.css`, `src/components/admin/AdminSidebar.tsx`, etc.) suivi du code complet à jour.
3. Si tu introduis de nouvelles classes CSS, donne-leur un nom cohérent avec le préfixe existant (`admin-*`) pour rester grep-able.
4. Ne propose pas de nouvelle dépendance npm sans le signaler explicitement (et pourquoi c'est justifié) — l'idée est que ce soit applicable directement.
