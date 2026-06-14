import { SellerShellClient } from "./SellerShellClient";

export function SellerAppShell({ children }: { children: React.ReactNode }) {
  return <SellerShellClient>{children}</SellerShellClient>;
}
