"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Eye, Lock, LogOut } from "lucide-react";
import { buildShopPath } from "@/lib/site-url";
import { formatSenegalPhoneDisplay } from "@/lib/utils";
import { IconCheck } from "@/components/ui/AppIcon";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { SettingsProfileEditor } from "@/components/seller/SettingsProfileEditor";
import { SettingsNotificationPrefs } from "@/components/seller/SettingsNotificationPrefs";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { useAuth } from "@/lib/auth-client";

const ACCOUNT_LINKS = [
  { href: "/create?tab=tag", label: "Mon XaalisTag", desc: "Modifier votre identifiant public" },
  { href: "/create", label: "Mes produits", desc: "Gérer produits et liens de paiement" },
  { href: "/settings/delivery-zones", label: "Zones de livraison", desc: "Gérer vos zones et tarifs de livraison" },
  { href: "/settings/affiliates", label: "Mes affiliés", desc: "Votre lien d'affiliation et vos gains" },
] as const;

const HELP_LINKS = [
  { href: "/contact", label: "Contact & aide", desc: "Support XaalisPay" },
  { href: "/cgv", label: "Conditions générales" },
  { href: "/confidentialite", label: "Confidentialité" },
] as const;

function SettingsLink({
  href,
  label,
  desc,
  icon,
}: {
  href: string;
  label: string;
  desc?: string;
  icon?: ReactNode;
}) {
  const text = (
    <>
      <span className="settings-link-label">{label}</span>
      {desc && <span className="settings-link-desc">{desc}</span>}
    </>
  );

  return (
    <Link href={href} className="settings-link-item">
      {icon ? (
        <div className="settings-link-body-iconed">
          {icon}
          <div className="settings-link-body">{text}</div>
        </div>
      ) : (
        <div className="settings-link-body">{text}</div>
      )}
      <svg className="settings-link-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function SettingsPage() {
  const { logout: authLogout } = useAuth();
  const { data, loading, refresh } = useSellerData();
  const profile = data?.profile ?? null;

  const logout = async () => {
    await authLogout();
    window.location.href = "/auth";
  };

  if (loading && !profile) return <DashboardSkeleton />;

  if (!profile) {
    return (
      <div className="seller-dashboard seller-dashboard-empty">
        <p className="text-muted">Profil introuvable</p>
        <Link href="/auth" className="btn-seller-primary">
          Connexion
        </Link>
      </div>
    );
  }

  const initial = profile.displayName.charAt(0).toUpperCase();
  const showAdmin = profile.role === "super_admin" || data?.isSuperAdmin === true;

  return (
    <div className="settings-page animate-settings-slide">
      <header className="settings-page-head settings-page-head-plain">
        <h1 className="settings-page-title settings-page-title-plain">Paramètres</h1>
      </header>

      <section className="settings-profile-card">
        <div className="settings-profile-hero">
          <div className="settings-profile-hero-id">
            <div className="settings-profile-avatar">{initial}</div>
            <div className="settings-profile-identity">
              <p className="settings-profile-name">{profile.displayName}</p>
              <p className="settings-profile-tag">@{profile.username}</p>
            </div>
          </div>
          <span className="settings-verified-badge">
            <IconCheck size={12} /> Vérifié
          </span>
        </div>

        <div className="settings-info-grid">
          <SettingsProfileEditor
            displayName={profile.displayName}
            businessName={profile.businessName}
            onSaved={async () => {
              await refresh({ silent: true });
            }}
          />
          <div className="settings-info-row">
            <span className="settings-phone-label">Téléphone</span>
            <div className="settings-phone-value-wrap">
              <span className="settings-phone-value">
                +221 {formatSenegalPhoneDisplay(profile.phone)}
              </span>
              <Lock size={14} strokeWidth={1.75} className="settings-row-lock" aria-label="Non modifiable" />
            </div>
          </div>
          <div className="settings-info-row">
            <span className="settings-phone-label">Pays &amp; devise</span>
            <span className="settings-phone-value">Sénégal · FCFA</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <p className="settings-section-label">Notifications</p>
        <SettingsNotificationPrefs />
      </section>

      {showAdmin && (
        <section className="settings-section">
          <p className="settings-section-label">Administration</p>
          <div className="settings-link-group">
            <Link href="/admin" className="settings-link-item settings-link-item-admin">
              <div className="settings-link-body">
                <span className="settings-link-label">Console admin</span>
                <span className="settings-link-desc">Piloter XaalisPay</span>
              </div>
              <svg className="settings-link-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      <section className="settings-section">
        <p className="settings-section-label">Mon compte</p>
        <div className="settings-link-group">
          {ACCOUNT_LINKS.map((item) => (
            <SettingsLink key={item.href} {...item} />
          ))}
          <SettingsLink
            href={buildShopPath(profile.username)}
            label="Voir ma page publique"
            icon={<Eye size={17} strokeWidth={1.5} />}
          />
        </div>
      </section>

      <section className="settings-section">
        <p className="settings-section-label">Aide &amp; légal</p>
        <div className="settings-link-group">
          {HELP_LINKS.map((item) => (
            <SettingsLink key={item.href} {...item} />
          ))}
        </div>
      </section>

      <div className="settings-logout-wrap">
        <button type="button" className="settings-logout-btn" onClick={logout}>
          <LogOut size={17} strokeWidth={1.5} />
          Se déconnecter
        </button>
        <p className="settings-version">XaalisPay · v1.0</p>
      </div>
    </div>
  );
}
