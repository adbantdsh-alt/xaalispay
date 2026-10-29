import { CountUp } from "@/components/marketing/CountUp";
import { MOBILE_MONEY_METHODS } from "@/lib/payment-methods";
import { COUNTRIES } from "@/lib/utils";

const OPERATORS = MOBILE_MONEY_METHODS.map((m) => ({ name: m.name, logo: `/brands/${m.id}-favicon.png` }));

/** Bande de confiance sous le hero — chiffres clés (vendeurs réels, arrondis
 * côté backend), opérateurs mobile money réellement branchés (Bictorys) et
 * les 6 pays ouverts. */
export function LandingOperators({ sellers }: { sellers: number | null }) {
  const stats = [
    ...(sellers ? [{ value: sellers, prefix: "+", label: "vendeurs inscrits" }] : []),
    { value: COUNTRIES.length, prefix: "", label: "pays couverts" },
    { value: OPERATORS.length, prefix: "", label: "opérateurs mobile money" },
  ];
  return (
    <section aria-label="XaalisPay en chiffres et moyens de paiement acceptés" className="bg-white pb-14 md:pb-20">
      <div className="lp-container">
        <dl
          className="mx-auto mb-12 grid max-w-3xl divide-x divide-[#1E3A5F]/10 border-y border-[#1E3A5F]/10 py-6"
          style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-2 text-center">
              <dt className="order-2 mt-1 text-[12px] md:text-[13px] text-[#6B7280]">{s.label}</dt>
              <dd className="order-1 text-[30px] md:text-[44px] font-semibold leading-none tracking-tight text-[#1E3A5F]">
                <CountUp value={s.value} prefix={s.prefix} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-center text-[13px] text-[#6B7280]">
          Payez et soyez payé avec le mobile money que vous utilisez déjà, dans {COUNTRIES.length} pays
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {OPERATORS.map((op) => (
            <li key={op.name} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={op.logo} alt="" width={28} height={28} className="h-7 w-7 rounded-lg object-contain" />
              <span className="text-[15px] font-medium text-[#1E3A5F]">{op.name}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {COUNTRIES.map((c) => (
            <li key={c.code} className="rounded-full lp-hairline bg-white px-3 py-1 text-[12px] text-[#1E3A5F]">
              <span aria-hidden>{c.flag}</span> {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
