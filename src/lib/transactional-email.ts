import { formatCurrency } from "./utils";
import { isTransactionalEmailEnabled } from "./runtime-env";
import type { Order, Payout } from "./types";
import { getDb } from "./db";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!isTransactionalEmailEnabled()) return false;

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const from = process.env.EMAIL_FROM!.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend error", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed", err);
    return false;
  }
}

export async function getSellerEmail(sellerId: string): Promise<string | null> {
  const db = await getDb();
  return db.authUsers.find((user) => user.id === sellerId)?.email ?? null;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://xaalispay.com").replace(/\/$/, "");
}

/** Fire-and-forget — ne bloque pas le flux métier. */
export function queueTransactionalEmail(payload: EmailPayload) {
  void sendEmail(payload).catch((err) => console.error("[email] queue failed", err));
}

export async function notifySellerOrderPaid(order: Order, sellerName: string) {
  const email = await getSellerEmail(order.sellerId);
  if (!email) return;

  const total = order.productPrice + (order.deliveryCost || 0) + (order.buyerProtectionFee || 0);
  const dashboard = `${siteUrl()}/dashboard`;

  queueTransactionalEmail({
    to: email,
    subject: `Nouvelle commande payée — ${order.productName}`,
    text:
      `Bonjour ${sellerName},\n\n` +
      `Une commande vient d'être payée sur XaalisPay.\n\n` +
      `Produit : ${order.productName}\n` +
      `Montant : ${formatCurrency(total)}\n` +
      `Client : ${order.clientName} (${order.clientPhone})\n` +
      `PIN livraison : ${order.pin}\n\n` +
      `Tableau de bord : ${dashboard}`,
    html:
      `<p>Bonjour <strong>${sellerName}</strong>,</p>` +
      `<p>Une commande vient d'être payée sur XaalisPay.</p>` +
      `<ul>` +
      `<li><strong>Produit :</strong> ${order.productName}</li>` +
      `<li><strong>Montant :</strong> ${formatCurrency(total)}</li>` +
      `<li><strong>Client :</strong> ${order.clientName} (${order.clientPhone})</li>` +
      `<li><strong>PIN livraison :</strong> <code>${order.pin}</code></li>` +
      `</ul>` +
      `<p><a href="${dashboard}">Ouvrir le tableau de bord</a></p>`,
  });
}

export async function notifySellerPayoutSuccess(payout: Payout, sellerName: string) {
  const email = await getSellerEmail(payout.sellerId);
  if (!email) return;

  const net = payout.netAmount ?? payout.amount;
  const wallet = `${siteUrl()}/wallet`;

  queueTransactionalEmail({
    to: email,
    subject: `Retrait confirmé — ${formatCurrency(net)}`,
    text:
      `Bonjour ${sellerName},\n\n` +
      `Votre retrait XaalisPay a été confirmé.\n\n` +
      `Montant net : ${formatCurrency(net)}\n` +
      `Méthode : ${payout.method === "wave" ? "Wave" : "Orange Money"}\n` +
      `Téléphone : ${payout.phone}\n\n` +
      `Portefeuille : ${wallet}`,
    html:
      `<p>Bonjour <strong>${sellerName}</strong>,</p>` +
      `<p>Votre retrait XaalisPay a été confirmé.</p>` +
      `<ul>` +
      `<li><strong>Montant net :</strong> ${formatCurrency(net)}</li>` +
      `<li><strong>Méthode :</strong> ${payout.method === "wave" ? "Wave" : "Orange Money"}</li>` +
      `<li><strong>Téléphone :</strong> ${payout.phone}</li>` +
      `</ul>` +
      `<p><a href="${wallet}">Voir mon portefeuille</a></p>`,
  });
}

export async function notifyAdminDisputeOpened(order: Order, sellerName: string) {
  const alertTo = process.env.ADMIN_ALERT_EMAIL?.trim();
  if (!alertTo) return;

  const admin = `${siteUrl()}/admin`;

  queueTransactionalEmail({
    to: alertTo,
    subject: `Litige ouvert — ${order.productName}`,
    text:
      `Un litige vient d'être ouvert sur XaalisPay.\n\n` +
      `Vendeur : ${sellerName}\n` +
      `Produit : ${order.productName}\n` +
      `Client : ${order.clientName} (${order.clientPhone})\n` +
      `Motif : ${order.disputeReason || "—"}\n\n` +
      `Admin : ${admin}`,
    html:
      `<p>Un litige vient d'être ouvert sur XaalisPay.</p>` +
      `<ul>` +
      `<li><strong>Vendeur :</strong> ${sellerName}</li>` +
      `<li><strong>Produit :</strong> ${order.productName}</li>` +
      `<li><strong>Client :</strong> ${order.clientName} (${order.clientPhone})</li>` +
      `<li><strong>Motif :</strong> ${order.disputeReason || "—"}</li>` +
      `</ul>` +
      `<p><a href="${admin}">Ouvrir l'admin</a></p>`,
  });
}
