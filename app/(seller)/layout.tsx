import { SellerAppShell } from "@/components/SellerAppShell";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerAppShell>{children}</SellerAppShell>;
}
