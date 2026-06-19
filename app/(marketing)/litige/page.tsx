import { DisputePageClient } from "@/components/marketing/DisputePageClient";

export default async function DisputePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; slug?: string }>;
}) {
  const { code = "", slug } = await searchParams;

  return (
    <section className="dispute-page">
      <div className="dispute-page-shell">
        <DisputePageClient initialPin={code} orderSlug={slug} />
      </div>
    </section>
  );
}
