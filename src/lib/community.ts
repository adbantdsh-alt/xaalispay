// Communauté WhatsApp XaalisPay. WhatsApp ne dit pas qui a rejoint : on
// mémorise localement (par vendeur) ce qu'on peut savoir — modal vu, clic
// sur « Rejoindre », carte fermée.
export const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/FEJc38jdt29AecYYZDiiG2?mode=gi_t";

export type CommunityState = { modalSeen: boolean; joined: boolean; cardDismissed: boolean };

type Flag = keyof CommunityState;

const key = (userId: string, flag: Flag) => `xp_community:${userId}:${flag}`;

function read(userId: string, flag: Flag): boolean {
  try {
    return localStorage.getItem(key(userId, flag)) === "1";
  } catch {
    return false;
  }
}

function write(userId: string, flag: Flag) {
  try {
    localStorage.setItem(key(userId, flag), "1");
  } catch {
    /* ignore */
  }
}

export function getCommunityState(userId: string): CommunityState {
  return {
    modalSeen: read(userId, "modalSeen"),
    joined: read(userId, "joined"),
    cardDismissed: read(userId, "cardDismissed"),
  };
}

export const markCommunityModalSeen = (userId: string) => write(userId, "modalSeen");
export const markCommunityJoined = (userId: string) => write(userId, "joined");
export const dismissCommunityCard = (userId: string) => write(userId, "cardDismissed");
