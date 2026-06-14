import { MobileBottomNav } from "./MobileBottomNav";

export function SellerAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="seller-app seller-shell">
      <main className="seller-content">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
