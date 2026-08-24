import { PortalShellClient } from "@/components/connect-portal/PortalShellClient";

export default function ConnectPortalShellLayout({ children }: { children: React.ReactNode }) {
  return <PortalShellClient>{children}</PortalShellClient>;
}
