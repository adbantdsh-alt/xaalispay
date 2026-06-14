import { updateDb } from "./db";
import {
  canCreateProducts,
  isSuperAdminEmail,
  SUPER_ADMIN_DEFAULT_PROFILE,
  superAdminProfileDefaults,
} from "./auth-policy";
import { createProfile, getProfileById, isUsernameTaken } from "./orders";
import type { Profile } from "./types";

function pickSuperAdminUsername(userId: string): string {
  const candidates = [
    SUPER_ADMIN_DEFAULT_PROFILE.username,
    "adbaxgoat",
    `admin_${userId.slice(0, 8)}`,
  ];

  for (const username of candidates) {
    if (!isUsernameTaken(username, userId)) return username;
  }

  return `admin_${userId.slice(0, 8)}`;
}

export function markProfileEmailVerified(userId: string): Profile | null {
  let updated: Profile | null = null;
  const now = new Date().toISOString();

  updateDb((db) => {
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) return;
    profile.emailVerifiedAt = now;
    updated = profile;
  });

  return updated;
}

export function ensureSuperAdminProfile(
  userId: string,
  email?: string | null
): Profile | undefined {
  if (!isSuperAdminEmail(email)) {
    return getProfileById(userId);
  }

  let profile = getProfileById(userId);
  const defaults = superAdminProfileDefaults();

  if (!profile) {
    profile = createProfile({
      id: userId,
      username: pickSuperAdminUsername(userId),
      displayName: SUPER_ADMIN_DEFAULT_PROFILE.displayName,
      businessName: SUPER_ADMIN_DEFAULT_PROFILE.businessName,
      phone: SUPER_ADMIN_DEFAULT_PROFILE.phone,
      role: defaults.role,
      emailVerifiedAt: defaults.emailVerifiedAt,
    });
    return profile;
  }

  if (profile.role === "super_admin" && profile.emailVerifiedAt) {
    return profile;
  }

  updateDb((db) => {
    const p = db.profiles.find((x) => x.id === userId);
    if (!p) return;
    p.role = defaults.role;
    p.emailVerifiedAt = defaults.emailVerifiedAt;
  });

  return getProfileById(userId);
}

export function getSellerAccess(userId: string, email?: string | null) {
  const profile = ensureSuperAdminProfile(userId, email);
  return {
    profile,
    canCreateProducts: canCreateProducts(profile, email),
    isSuperAdmin: isSuperAdminEmail(email) || profile?.role === "super_admin",
    emailVerified: !!profile?.emailVerifiedAt,
  };
}
