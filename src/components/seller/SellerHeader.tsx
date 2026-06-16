import { BrandMark } from "@/components/ui/BrandMark";

export function SellerHeader() {
  return (
    <header className="seller-header seller-header-logo-only">
      <BrandMark size="sm" href="/dashboard" />
    </header>
  );
}
