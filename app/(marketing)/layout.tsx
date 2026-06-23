import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { MobileDisputeFab } from "@/components/marketing/MobileDisputeFab";
import { BackToTop } from "@/components/marketing/BackToTop";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-layout">
      <SiteHeader />
      <main className="marketing-main">{children}</main>
      <SiteFooter />
      <MobileDisputeFab />
      <BackToTop />
    </div>
  );
}
