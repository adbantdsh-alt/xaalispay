import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRelationalMigrationStatus } from "@/lib/relational-store";

const PAYOUT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "seller_username", label: "Vendeur" },
  { key: "amount", label: "Montant (FCFA)" },
  { key: "net_amount", label: "Net (FCFA)" },
  { key: "fee", label: "Frais (FCFA)" },
  { key: "method", label: "Méthode" },
  { key: "phone", label: "Téléphone" },
  { key: "status", label: "Statut" },
  { key: "failure_reason", label: "Erreur" },
  { key: "created_at", label: "Créé le" },
];

async function fetchPayoutsFromRelational() {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: payouts, error } = await admin
    .from("xp_payouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return null;

  const { data: profiles } = await admin.from("xp_profiles").select("id, username");
  const usernameById = new Map((profiles || []).map((p) => [p.id, p.username]));

  return (payouts || []).map((payout) => ({
    id: payout.id,
    seller_username: usernameById.get(payout.seller_id) || payout.seller_id,
    amount: payout.amount,
    net_amount: payout.net_amount ?? "",
    fee: payout.fee ?? "",
    method: payout.method,
    phone: payout.phone,
    status: payout.status,
    failure_reason: payout.failure_reason || "",
    created_at: payout.created_at,
  }));
}

async function fetchPayoutsFromAppState() {
  const db = await getDb();
  const usernameById = new Map(db.profiles.map((p) => [p.id, p.username]));

  return [...db.payouts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((payout) => ({
      id: payout.id,
      seller_username: usernameById.get(payout.sellerId) || payout.sellerId,
      amount: payout.amount,
      net_amount: payout.netAmount ?? "",
      fee: payout.fee ?? "",
      method: payout.method,
      phone: payout.phone,
      status: payout.status,
      failure_reason: payout.failureReason || "",
      created_at: payout.createdAt,
    }));
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const relational = await getRelationalMigrationStatus();
  const rows =
    relational.schemaReady && relational.lastMigratedAt
      ? (await fetchPayoutsFromRelational()) || (await fetchPayoutsFromAppState())
      : await fetchPayoutsFromAppState();

  const csv = toCsv(rows, PAYOUT_COLUMNS);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="xaalispay-retraits-${stamp}.csv"`,
    },
  });
}
