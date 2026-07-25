import Link from "next/link";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type ReturnInfo = { status: string; success_url: string; error_url: string };

async function fetchReturn(txn: string): Promise<ReturnInfo | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/connect/pay/${txn}/return`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ReturnInfo;
  } catch {
    return null;
  }
}

/**
 * Page de retour d'un paiement Connect (séquestre).
 *
 * La plateforme appelante (ex. CopyX) fournit ses URLs de retour, transmises
 * directement au PSP : dans le cas normal l'acheteur ne passe donc PAS par ici.
 * Cette page est le filet de sécurité — si le PSP retombe sur l'URL XaalisPay
 * par défaut, on renvoie l'acheteur chez le marchand (URLs persistées) ; à
 * défaut, on affiche un vrai statut plutôt qu'un 404.
 */
export default async function ConnectPayReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ txn: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { txn } = await params;
  const { payment } = await searchParams;
  const failed = payment === "failed";

  const info = await fetchReturn(txn);
  const target = failed ? info?.error_url : info?.success_url;

  // URL marchand connue -> on y renvoie l'acheteur (hors try/catch : redirect()
  // lève volontairement pour effectuer la redirection).
  if (target) redirect(target);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#0B1220] px-4 text-center text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div
          className={
            "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[26px] font-bold " +
            (failed ? "bg-rose-500 text-white" : "bg-emerald-400 text-[#0B1220]")
          }
        >
          {failed ? "!" : "✓"}
        </div>
        <h1 className="mt-5 text-[22px] font-extrabold">
          {failed ? "Paiement non abouti" : "Paiement confirmé"}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
          {failed
            ? "Aucun montant n'a été prélevé. Vous pouvez réessayer depuis la boutique."
            : "Votre paiement a bien été reçu. Vous pouvez retourner à la boutique."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-[14px] font-extrabold text-[#0B1220] transition hover:brightness-95"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
