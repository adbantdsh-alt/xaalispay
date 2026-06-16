/** Compte vendeur de démo (localhost uniquement). */
export const DEMO_ACCOUNT = {
  id: "seed-seller-001",
  email: "demo@xaalispay.com",
  password: "Demo2026!",
  username: "adba",
  displayName: "Mamadou Badji",
} as const;

export function isDevAutoLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTO_LOGIN !== "false"
  );
}

export function isProtectedSellerPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/admin")
  );
}
