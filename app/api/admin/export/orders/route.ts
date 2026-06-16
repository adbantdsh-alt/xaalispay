import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-access";
import { getDb } from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRelationalMigrationStatus } from "@/lib/relational-store";
import { getOrderTotal } from "@/lib/utils";

const ORDER_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "slug", label: "Slug" },
  { key: "seller_username", label: "Vendeur" },
  { key: "product_name", label: "Produit" },
  { key: "client_name", label: "Client" },
  { key: "client_phone", label: "Téléphone client" },
  { key: "status", label: "Statut" },
  { key: "total", label: "Total (FCFA)" },
  { key: "payment_method", label: "Paiement" },
  { key: "paid_at", label: "Payé le" },
  { key: "created_at", label: "Créé le" },
];

async function fetchOrdersFromRelational() {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: orders, error } = await admin
    .from("xp_orders")
    .select(
      "id, slug, seller_id, product_name, client_name, client_phone, status, product_price, delivery_cost, buyer_protection_fee, payment_method, paid_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) return null;

  const { data: profiles } = await admin.from("xp_profiles").select("id, username");
  const usernameById = new Map((profiles || []).map((p) => [p.id, p.username]));

  return (orders || []).map((order) => {
    const total =
      Number(order.product_price) +
      Number(order.delivery_cost || 0) +
      Number(order.buyer_protection_fee || 0);
    return {
      id: order.id,
      slug: order.slug,
      seller_username: usernameById.get(order.seller_id) || order.seller_id,
      product_name: order.product_name,
      client_name: order.client_name,
      client_phone: order.client_phone,
      status: order.status,
      total,
      payment_method: order.payment_method || "",
      paid_at: order.paid_at || "",
      created_at: order.created_at,
    };
  });
}

async function fetchOrdersFromAppState() {
  const db = await getDb();
  const usernameById = new Map(db.profiles.map((p) => [p.id, p.username]));

  return [...db.orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => ({
      id: order.id,
      slug: order.slug,
      seller_username: usernameById.get(order.sellerId) || order.sellerId,
      product_name: order.productName,
      client_name: order.clientName,
      client_phone: order.clientPhone,
      status: order.status,
      total: getOrderTotal(order),
      payment_method: order.paymentMethod || "",
      paid_at: order.paidAt || "",
      created_at: order.createdAt,
    }));
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const relational = await getRelationalMigrationStatus();
  const rows =
    relational.schemaReady && relational.lastMigratedAt
      ? (await fetchOrdersFromRelational()) || (await fetchOrdersFromAppState())
      : await fetchOrdersFromAppState();

  const csv = toCsv(rows, ORDER_COLUMNS);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="xaalispay-commandes-${stamp}.csv"`,
    },
  });
}
