import { XaalisIcon } from "@/components/ui/XaalisIcon";
import { IconCheck, IconKey, IconLock, IconPackage, IconShield } from "@/components/ui/AppIcon";

type Variant = "hero" | "escrow" | "pin" | "seller";

export function LandingPhoneMockup({ variant = "hero" }: { variant?: Variant }) {
  return (
    <div className="landing-phone" aria-hidden="true">
      <div className="landing-phone-notch" />
      <div className="landing-phone-screen">
        {variant === "hero" && <HeroScreen />}
        {variant === "escrow" && <EscrowScreen />}
        {variant === "pin" && <PinScreen />}
        {variant === "seller" && <SellerScreen />}
      </div>
      <div className="landing-phone-home" />
    </div>
  );
}

function HeroScreen() {
  return (
    <>
      <div className="lpm-header">
        <XaalisIcon size={20} />
        <span className="lpm-header-title">Xaalis Pay</span>
        <span className="lpm-pill lpm-pill-green">
          <IconLock size={10} /> Sécurisé
        </span>
      </div>
      <div className="lpm-product">
        <div className="lpm-product-img">
          <IconPackage size={28} />
        </div>
        <div>
          <p className="lpm-product-name">Robe wax live</p>
          <p className="lpm-product-price">15 000 FCFA</p>
        </div>
      </div>
      <div className="lpm-pay-btns">
        <div className="lpm-pay-wave">
          <img src="/brands/wave-favicon.png" alt="" width={18} height={18} />
          <span>wave</span>
        </div>
        <div className="lpm-pay-orange">
          <img src="/brands/orange-favicon.png" alt="" width={18} height={18} />
          <span>ORANGE MONEY</span>
        </div>
      </div>
      <div className="lpm-float-card lpm-float-pin">
        <IconKey size={14} />
        <div>
          <p className="lpm-float-label">Code PIN reçu</p>
          <p className="lpm-float-value">4 8 2 1</p>
        </div>
      </div>
    </>
  );
}

function EscrowScreen() {
  return (
    <>
      <div className="lpm-header lpm-header-dark">
        <IconShield size={18} />
        <span>Séquestre actif</span>
      </div>
      <div className="lpm-escrow-amount">
        <p className="lpm-escrow-label">Montant protégé</p>
        <p className="lpm-escrow-value">15 000 <small>FCFA</small></p>
        <div className="lpm-escrow-bar">
          <div className="lpm-escrow-bar-fill" />
        </div>
        <p className="lpm-escrow-hint">Bloqué chez XaalisPay</p>
      </div>
      <ol className="lpm-timeline">
        <li className="lpm-timeline-item lpm-timeline-done">
          <span className="lpm-timeline-dot"><IconCheck size={10} /></span>
          <span>Paiement reçu</span>
        </li>
        <li className="lpm-timeline-item lpm-timeline-active">
          <span className="lpm-timeline-dot">2</span>
          <span>En attente livraison</span>
        </li>
        <li className="lpm-timeline-item">
          <span className="lpm-timeline-dot">3</span>
          <span>PIN au livreur</span>
        </li>
      </ol>
    </>
  );
}

function PinScreen() {
  return (
    <>
      <div className="lpm-pin-success">
        <span className="lpm-pin-check"><IconCheck size={20} /></span>
        <p>Paiement confirmé</p>
      </div>
      <div className="lpm-pin-block">
        <p className="lpm-pin-label">Code Livraison</p>
        <p className="lpm-pin-code">4821</p>
      </div>
      <p className="lpm-pin-note">Donnez ce code au livreur après vérification du colis.</p>
    </>
  );
}

function SellerScreen() {
  return (
    <>
      <div className="lpm-header">
        <span className="lpm-header-title">Mon lien</span>
      </div>
      <div className="lpm-link-box">
        <p className="lpm-link-url">xaalispay.com/…/robe-wax</p>
        <span className="lpm-link-copy">Copier</span>
      </div>
      <div className="lpm-social-pills">
        <span className="lpm-social-pill">TikTok</span>
        <span className="lpm-social-pill">Instagram</span>
        <span className="lpm-social-pill">WhatsApp</span>
      </div>
      <div className="lpm-seller-stat">
        <p className="lpm-seller-stat-val">+12 500 FCFA</p>
        <p className="lpm-seller-stat-label">Libéré après livraison</p>
      </div>
    </>
  );
}
