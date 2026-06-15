import { DisputePageClient } from "@/components/marketing/DisputePageClient";

export default async function DisputePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code = "" } = await searchParams;

  return (
    <section className="dispute-page">
      <div className="dispute-page-shell">
        <DisputePageClient initialPin={code} />
      </div>
    </section>
  );
}
