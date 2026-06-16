"use client";

export function DevLandingBanner() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="dev-landing-banner" role="note">
      <span className="dev-landing-banner-label">Dev</span>
      <span className="dev-landing-banner-text">Landing visible — accès démo vendeur :</span>
      <a href="/api/dev/auto-login?redirect=/dashboard" className="dev-landing-banner-link">
        Dashboard démo
      </a>
    </div>
  );
}
