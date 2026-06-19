"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildShopPath } from "@/lib/site-url";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { SettingsPhoneEditor } from "@/components/seller/SettingsPhoneEditor";
import { SettingsProfileEditor } from "@/components/seller/SettingsProfileEditor";
import { SettingsNotificationPrefs } from "@/components/seller/SettingsNotificationPrefs";
import { useSellerData } from "@/components/seller/SellerDataProvider";
import { useAuth } from "@/lib/auth-client";

const ACCOUNT_LINKS = [
  { href: "/create?tab=tag", label: "Mon XaalisTag", desc: "Modifier votre identifiant public" },
  { href: "/create", label: "Mes produits", desc: "Gérer produits et liens de paiement" },
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
}: {
  href: string;
  label: string;
  desc?: string;
}) {
  return (
    <Link href={href} className="settings-link-item">
      <div className="settings-link-body">
        <span className="settings-link-label">{label}</span>
        {desc && <span className="settings-link-desc">{desc}</span>}
      </div>
      <svg className="settings-link-chevron" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function SettingsPage() {
  const router = useRouter();
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
      <header className="settings-page-head">
        <button
          type="button"
          className="settings-page-back"
          aria-label="Retour à l'accueil"
          onClick={() => router.push("/dashboard")}
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="settings-page-title">Paramètres</h1>
      </header>

      {data && data.emailVerified === false && (
        <div className="settings-email-alert" role="alert">
          <p className="settings-email-alert-title">Confirmez votre email</p>
          <p className="settings-email-alert-desc">
            Vérifiez votre boîte mail pour activer la création de produits et les retraits.
            Consultez aussi vos spams.
          </p>
        </div>
      )}

      <section className="settings-profile-card">
        <div className="settings-profile-hero">
          <div className="settings-profile-avatar">{initial}</div>
          <div className="settings-profile-identity">
            <p className="settings-profile-name">{profile.displayName}</p>
            <p className="settings-profile-tag">@{profile.username}</p>
          </div>
        </div>

        <dl className="settings-info-grid">
          <div className="settings-info-row">
            <dt>Pays</dt>
            <dd>Sénégal</dd>
          </div>
          <div className="settings-info-row">
            <dt>Devise</dt>
            <dd>FCFA</dd>
          </div>
        </dl>

        <SettingsProfileEditor
          displayName={profile.displayName}
          businessName={profile.businessName}
          onSaved={async () => {
            await refresh({ silent: true });
          }}
        />

        <SettingsPhoneEditor
          phone={profile.phone}
          onSaved={async () => {
            await refresh({ silent: true });
          }}
        />

        <SettingsNotificationPrefs />

        <Link href={buildShopPath(profile.username)} className="settings-public-link">
          Voir ma page publique
        </Link>
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
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
