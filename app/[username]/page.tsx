import { redirect } from "next/navigation";

export default async function LegacyUsernameRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/seller/${username}`);
}
