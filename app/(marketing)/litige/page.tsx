import { DisputeDialog } from "@/components/marketing/DisputeDialog";

export default async function DisputePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code = "" } = await searchParams;

  return (
    <section className="dispute-page">
      <div className="dispute-page-shell">
        <DisputeDialog open onClose={() => undefined} initialPin={code} variant="page" />
      </div>
    </section>
  );
}
