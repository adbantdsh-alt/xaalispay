"use client";

import { X } from "lucide-react";
import { WhatsAppLogo } from "@/components/ui/WhatsAppLogo";
import { WHATSAPP_COMMUNITY_URL } from "@/lib/community";

export function CommunityInviteCard({ onJoin, onDismiss }: { onJoin: () => void; onDismiss: () => void }) {
  return (
    <div className="community-card animate-fade-up">
      <div className="community-card-icon" aria-hidden="true">
        <WhatsAppLogo size={22} />
      </div>
      <div className="community-card-body">
        <p className="community-card-title">Communauté WhatsApp</p>
        <p className="community-card-desc">Aidez-nous à construire XaalisPay avec vous.</p>
      </div>
      <a
        href={WHATSAPP_COMMUNITY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="community-card-cta"
        onClick={onJoin}
      >
        Rejoindre
      </a>
      <button type="button" className="community-card-close" aria-label="Masquer" onClick={onDismiss}>
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
