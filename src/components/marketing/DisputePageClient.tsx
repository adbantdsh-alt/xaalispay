"use client";

import { DisputeDialog } from "./DisputeDialog";

export function DisputePageClient({
  initialPin,
  orderSlug,
}: {
  initialPin?: string;
  orderSlug?: string;
}) {
  return <DisputeDialog initialPin={initialPin} orderSlug={orderSlug} />;
}
