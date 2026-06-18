import { resolveProductImageUrl } from "./product-images";

export function resolveProfileImageUrl(image?: string | null): string {
  return resolveProductImageUrl(image);
}

export interface SellerBrandView {
  displayName: string;
  username: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export function toSellerBrandView(profile: {
  displayName: string;
  username: string;
  avatarUrl?: string;
  coverUrl?: string;
}): SellerBrandView {
  return {
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: resolveProfileImageUrl(profile.avatarUrl) || undefined,
    coverUrl: resolveProfileImageUrl(profile.coverUrl) || undefined,
  };
}
