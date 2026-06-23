import { Bell } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";

export function SellerHeader() {
  return (
    <header className="seller-header">
      <BrandMark size="sm" href="/dashboard" />
      <span className="seller-header-bell" aria-hidden="true">
        <Bell size={21} strokeWidth={1.5} />
        <span className="seller-header-bell-dot" />
      </span>
    </header>
  );
}
