import { redirect } from "next/navigation";

export default async function LegacyPayRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/orderlink/${slug}`);
}
