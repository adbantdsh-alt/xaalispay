import { DisputePageClient } from "@/components/marketing/DisputePageClient";

export default async function DisputePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; slug?: string }>;
}) {
  const { code = "", slug } = await searchParams;

  return <DisputePageClient initialPin={code} orderSlug={slug} />;
}
