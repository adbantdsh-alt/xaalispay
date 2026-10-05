"use client";

import { WhatsAppLogo } from "@/components/ui/WhatsAppLogo";
import { WHATSAPP_COMMUNITY_URL } from "@/lib/community";

// XaalisPay est un outil pour les vendeurs : la communauté sert d'abord à
// construire le produit avec eux — c'est le message principal du modal.
const BENEFITS = [
  "Proposez les fonctionnalités dont vous avez besoin",
  "Testez les nouveautés avant tout le monde",
  "Échangez astuces et conseils avec d'autres vendeurs",
];

export function CommunityInviteDialog({
  open,
  onClose,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet community-invite-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-invite-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-sheet-handle" />
        <div className="community-invite-icon" aria-hidden="true">
          <WhatsAppLogo size={30} />
        </div>
        <h3 id="community-invite-title" className="community-invite-title">
          Construisons XaalisPay ensemble
        </h3>
        <p className="community-invite-lead">
          XaalisPay est fait pour les vendeurs, et nous voulons l&apos;améliorer avec vous.
          Rejoignez la communauté WhatsApp : vos retours guident nos prochaines évolutions.
        </p>
        <ul className="community-invite-list">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <a
          href={WHATSAPP_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-seller-primary"
          onClick={onJoin}
        >
          <WhatsAppLogo size={20} color="#fff" />
          Rejoindre la communauté
        </a>
        <button type="button" className="community-invite-later" onClick={onClose}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
