"use client";

import { useRouter } from "next/navigation";
import { DisputeDialog } from "./DisputeDialog";

export function DisputePageClient({
  initialPin,
  orderSlug,
}: {
  initialPin?: string;
  orderSlug?: string;
}) {
  const router = useRouter();

  return (
    <DisputeDialog
      open
      onClose={() => router.push("/")}
      initialPin={initialPin}
      orderSlug={orderSlug}
      variant="page"
    />
  );
}
