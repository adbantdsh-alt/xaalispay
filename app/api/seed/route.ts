/**
 * POST /api/seed
 * Génère un compte vendeur de démo complet (dev uniquement).
 * Accès : http://localhost:3001/api/seed  →  POST via fetch ou curl
 * Credentials : demo@xaalispay.com / Demo2026!
 */
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth-local";
import { writeDb } from "@/lib/db";
import type { Database, Order, LedgerEntry } from "@/lib/types";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 403 });
  }

  const sellerId = "seed-seller-001";
  const now = new Date();
  const d = (offsetDays: number) =>
    new Date(now.getTime() - offsetDays * 86_400_000).toISOString();

  const passwordHash = await hashPassword("Demo2026!");

  /* ─── PRODUITS ─────────────────────────────────────────────── */
  const products = [
    { id: "prod-01", name: "iPhone 13 Pro 256 Go",         price: 285000, deliveryCost: 2000,  deliveryHours: 24,  description: "État parfait, batterie 98%",          note: "Couleur Graphite",    paymentSlug: "pay-iphone13"    },
    { id: "prod-02", name: "AirPods Pro 2",                 price: 68000,  deliveryCost: 1500,  deliveryHours: 24,  description: "Boîte ouverte, jamais utilisé",       note: "",                    paymentSlug: "pay-airpods"     },
    { id: "prod-03", name: "Samsung Galaxy S24 Ultra",      price: 320000, deliveryCost: 2000,  deliveryHours: 48,  description: "Neuf sous blister",                   note: "256 Go / 12 Go RAM",  paymentSlug: "pay-s24ultra"    },
    { id: "prod-04", name: "Nike Air Force 1 Taille 43",    price: 38000,  deliveryCost: 1000,  deliveryHours: 48,  description: "Original, neuf dans sa boîte",        note: "",                    paymentSlug: "pay-nike-af1"    },
    { id: "prod-05", name: "Sac Adidas Originals",          price: 22000,  deliveryCost: 0,     deliveryHours: 24,  description: "Modèle Classic, couleur noir",        note: "",                    paymentSlug: "pay-sac-adidas"  },
    { id: "prod-06", name: "Montre Casio G-Shock",          price: 45000,  deliveryCost: 1000,  deliveryHours: 72,  description: "Modèle GW-B5600, solaire Bluetooth",  note: "Garantie 1 an",       paymentSlug: "pay-gshock"      },
    { id: "prod-07", name: "Laptop Dell XPS 15",            price: 750000, deliveryCost: 3000,  deliveryHours: 48,  description: "Core i7 12e gen, 16 Go RAM, 512 SSD", note: "Chargeur inclus",     paymentSlug: "pay-dell-xps"    },
    { id: "prod-08", name: "Câble HDMI 4K 2m",              price: 5500,   deliveryCost: 0,     deliveryHours: 24,  description: "Compatible 4K 60Hz",                  note: "",                    paymentSlug: "pay-hdmi"        },
  ].map((p) => ({
    ...p,
    sellerId,
    image: "",
    active: true,
    productId: p.id,
    createdAt: d(30),
    updatedAt: d(15),
  }));

  /* ─── COMMANDES ────────────────────────────────────────────── */
  type OrderSeed = Omit<Order, "clientFirstName" | "clientNote" | "clientAddress" | "paymentReference" | "disputePhotos" | "disputeMedia" | "deliveryCost" | "deliveryHours"> & Partial<Order>;

  const orders: Order[] = [
    // 1. Livrée – libérée
    { id: "ord-01", sellerId, productId: "prod-01", slug: "ABC123", pin: "4821",
      clientName: "Ibrahima Diallo", clientFirstName: "Ibrahima", clientPhone: "771234567",
      clientAddress: "Dakar, Plateau", clientNote: "", productName: "iPhone 13 Pro 256 Go",
      productPrice: 285000, deliveryCost: 2000, deliveryHours: 24,
      status: "released", paymentMethod: "wave", paymentReference: "XP-001",
      paidAt: d(12), releasedAt: d(11), protectionEndsAt: d(11),
      buyerProtectionFee: 2000, sellerCommission: 5742,
      createdAt: d(13), updatedAt: d(11), disputePhotos: [], disputeMedia: [] },

    // 2. Livrée – libérée
    { id: "ord-02", sellerId, productId: "prod-02", slug: "DEF456", pin: "3390",
      clientName: "Fatou Ndiaye", clientFirstName: "Fatou", clientPhone: "781234567",
      clientAddress: "Pikine", clientNote: "Livrer avant 18h", productName: "AirPods Pro 2",
      productPrice: 68000, deliveryCost: 1500, deliveryHours: 24,
      status: "released", paymentMethod: "orange", paymentReference: "XP-002",
      paidAt: d(9), releasedAt: d(8), protectionEndsAt: d(8),
      buyerProtectionFee: 500, sellerCommission: 1374,
      createdAt: d(10), updatedAt: d(8), disputePhotos: [], disputeMedia: [] },

    // 3. En protection (30 min timer)
    { id: "ord-03", sellerId, productId: "prod-04", slug: "GHI789", pin: "7720",
      clientName: "Moussa Sow", clientFirstName: "Moussa", clientPhone: "701234567",
      clientAddress: "Guédiawaye", clientNote: "", productName: "Nike Air Force 1 Taille 43",
      productPrice: 38000, deliveryCost: 1000, deliveryHours: 48,
      status: "protection", paymentMethod: "wave", paymentReference: "XP-003",
      paidAt: d(0), protectionEndsAt: new Date(now.getTime() + 18 * 60 * 1000).toISOString(),
      clientDeliveryConfirmedAt: d(0),
      buyerProtectionFee: 380,
      createdAt: d(1), updatedAt: d(0), disputePhotos: [], disputeMedia: [] },

    // 4. Payée – en attente validation livraison (ACTION REQUISE)
    { id: "ord-04", sellerId, productId: "prod-06", slug: "JKL012", pin: "5511",
      clientName: "Aminata Balde", clientFirstName: "Aminata", clientPhone: "761234567",
      clientAddress: "Rufisque", clientNote: "Appeler avant livraison",
      productName: "Montre Casio G-Shock",
      productPrice: 45000, deliveryCost: 1000, deliveryHours: 72,
      status: "paid", paymentMethod: "orange", paymentReference: "XP-004",
      paidAt: d(1), deliveryCodeIssuedAt: d(1),
      deliveryCodeExpiresAt: new Date(now.getTime() + 12 * 60 * 1000).toISOString(),
      buyerProtectionFee: 450,
      createdAt: d(2), updatedAt: d(1), disputePhotos: [], disputeMedia: [] },

    // 5. Litige en cours
    { id: "ord-05", sellerId, productId: "prod-03", slug: "MNO345", pin: "9032",
      clientName: "Omar Thiaw", clientFirstName: "Omar", clientPhone: "771112233",
      clientAddress: "Dakar, HLM", clientNote: "",
      productName: "Samsung Galaxy S24 Ultra",
      productPrice: 320000, deliveryCost: 2000, deliveryHours: 48,
      status: "dispute", paymentMethod: "wave", paymentReference: "XP-005",
      paidAt: d(5), disputeOpenedAt: d(2),
      disputeReason: "Produit reçu différent de l'annonce (couleur et stockage incorrects)",
      buyerProtectionFee: 2000,
      createdAt: d(6), updatedAt: d(2), disputePhotos: [], disputeMedia: [] },

    // 6. En attente de paiement
    { id: "ord-06", sellerId, productId: "prod-05", slug: "PQR678", pin: "1234",
      clientName: "Rokhaya Cissé", clientFirstName: "Rokhaya", clientPhone: "781118899",
      clientAddress: "", clientNote: "",
      productName: "Sac Adidas Originals",
      productPrice: 22000, deliveryCost: 0, deliveryHours: 24,
      status: "pending_payment", paymentReference: "XP-006",
      createdAt: d(0), updatedAt: d(0), disputePhotos: [], disputeMedia: [] },

    // 7. Remboursée
    { id: "ord-07", sellerId, productId: "prod-07", slug: "STU901", pin: "6678",
      clientName: "Cheikh Diop", clientFirstName: "Cheikh", clientPhone: "701234000",
      clientAddress: "Dakar, Mermoz", clientNote: "",
      productName: "Laptop Dell XPS 15",
      productPrice: 750000, deliveryCost: 3000, deliveryHours: 48,
      status: "refunded", paymentMethod: "wave", paymentReference: "XP-007",
      paidAt: d(20), refundedAt: d(18),
      buyerProtectionFee: 2000,
      createdAt: d(21), updatedAt: d(18), disputePhotos: [], disputeMedia: [] },

    // 8. Livrée – libérée (récente)
    { id: "ord-08", sellerId, productId: "prod-08", slug: "VWX234", pin: "2255",
      clientName: "Adja Tall", clientFirstName: "Adja", clientPhone: "771230000",
      clientAddress: "Thiès", clientNote: "",
      productName: "Câble HDMI 4K 2m",
      productPrice: 5500, deliveryCost: 0, deliveryHours: 24,
      status: "released", paymentMethod: "orange", paymentReference: "XP-008",
      paidAt: d(3), releasedAt: d(2), protectionEndsAt: d(2),
      buyerProtectionFee: 55, sellerCommission: 110,
      createdAt: d(4), updatedAt: d(2), disputePhotos: [], disputeMedia: [] },

    // 9. Annulée (test de la feature)
    { id: "ord-09", sellerId, productId: "prod-01", slug: "YZA567", pin: "8844",
      clientName: "Samba Gueye", clientFirstName: "Samba", clientPhone: "771119999",
      clientAddress: "Ziguinchor", clientNote: "",
      productName: "iPhone 13 Pro 256 Go",
      productPrice: 285000, deliveryCost: 2000, deliveryHours: 24,
      status: "cancelled", paymentMethod: "wave", paymentReference: "XP-009",
      paidAt: d(7), cancelledAt: d(6),
      cancellationReason: "Rupture de stock — article non disponible",
      buyerProtectionFee: 2000,
      createdAt: d(8), updatedAt: d(6), disputePhotos: [], disputeMedia: [] },

    // 10. Livrée – libérée (ancienne)
    { id: "ord-10", sellerId, productId: "prod-02", slug: "BCD890", pin: "3344",
      clientName: "Ndeye Mbaye", clientFirstName: "Ndeye", clientPhone: "781230011",
      clientAddress: "Saint-Louis", clientNote: "",
      productName: "AirPods Pro 2",
      productPrice: 68000, deliveryCost: 1500, deliveryHours: 24,
      status: "released", paymentMethod: "wave", paymentReference: "XP-010",
      paidAt: d(25), releasedAt: d(24), protectionEndsAt: d(24),
      buyerProtectionFee: 500, sellerCommission: 1374,
      createdAt: d(26), updatedAt: d(24), disputePhotos: [], disputeMedia: [] },

    // 11. Payée (2ème en attente de livraison — sans action requise immédiate)
    { id: "ord-11", sellerId, productId: "prod-04", slug: "EFG111", pin: "9988",
      clientName: "Lamine Diallo", clientFirstName: "Lamine", clientPhone: "701230000",
      clientAddress: "Dakar, Point E", clientNote: "Taille 43 svp",
      productName: "Nike Air Force 1 Taille 43",
      productPrice: 38000, deliveryCost: 1000, deliveryHours: 48,
      status: "paid", paymentMethod: "wave", paymentReference: "XP-011",
      paidAt: d(0),
      deliveryCodeIssuedAt: d(0),
      deliveryCodeExpiresAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
      buyerProtectionFee: 380,
      createdAt: d(1), updatedAt: d(0), disputePhotos: [], disputeMedia: [] },

    // 12. Livrée – libérée
    { id: "ord-12", sellerId, productId: "prod-06", slug: "HIJ222", pin: "4455",
      clientName: "Awa Diop", clientFirstName: "Awa", clientPhone: "781230022",
      clientAddress: "Mbour", clientNote: "",
      productName: "Montre Casio G-Shock",
      productPrice: 45000, deliveryCost: 1000, deliveryHours: 72,
      status: "released", paymentMethod: "orange", paymentReference: "XP-012",
      paidAt: d(15), releasedAt: d(14), protectionEndsAt: d(14),
      buyerProtectionFee: 450, sellerCommission: 907,
      createdAt: d(16), updatedAt: d(14), disputePhotos: [], disputeMedia: [] },
  ] as Order[];

  /* ─── LEDGER — reconstruit depuis les commandes ─────────────── */
  const le = (entry: Omit<LedgerEntry, "id">): LedgerEntry => ({
    id: crypto.randomUUID(), ...entry,
  });

  const released = orders.filter((o) => o.status === "released");
  const paid     = orders.filter((o) => ["paid","protection","released","dispute","refunded","cancelled"].includes(o.status) && o.paidAt);

  const ledgerEntries: LedgerEntry[] = [];

  // Escrow credit pour toutes les commandes payées
  for (const o of paid) {
    const amount = o.productPrice + (o.deliveryCost || 0);
    ledgerEntries.push(le({
      sellerId, orderId: o.id,
      type: "escrow_credit", pocket: "escrow", direction: "credit",
      amount, reference: `order:${o.id}:escrow_credit`,
      createdAt: o.paidAt!,
      description: `Paiement client — ${o.productName}`,
    }));
  }

  // Release escrow → available pour les commandes libérées
  for (const o of released) {
    const gross = o.productPrice + (o.deliveryCost || 0);
    const commission = o.sellerCommission || 0;
    const net = gross - commission;
    ledgerEntries.push(le({
      sellerId, orderId: o.id,
      type: "escrow_release", pocket: "escrow", direction: "debit",
      amount: gross, reference: `order:${o.id}:escrow_release:debit`,
      createdAt: o.releasedAt!,
      description: `Sortie séquestre — ${o.productName}`,
    }));
    ledgerEntries.push(le({
      sellerId, orderId: o.id,
      type: "escrow_release", pocket: "available", direction: "credit",
      amount: net, reference: `order:${o.id}:escrow_release:credit`,
      createdAt: o.releasedAt!,
      description: `Crédit vendeur — ${o.productName}`,
    }));
    if (commission > 0) {
      ledgerEntries.push(le({
        sellerId, orderId: o.id,
        type: "seller_commission", pocket: "available", direction: "debit",
        amount: commission, reference: `order:${o.id}:seller_commission`,
        createdAt: o.releasedAt!,
        description: `Commission XaalisPay 2% — ${o.productName}`,
      }));
    }
  }

  // Dispute hold
  const dispute = orders.find((o) => o.status === "dispute");
  if (dispute) {
    const amount = dispute.productPrice + (dispute.deliveryCost || 0);
    ledgerEntries.push(le({
      sellerId, orderId: dispute.id,
      type: "dispute_hold", pocket: "escrow", direction: "debit",
      amount, reference: `order:${dispute.id}:dispute_hold:debit`,
      createdAt: dispute.disputeOpenedAt!,
      description: "Blocage litige",
    }));
    ledgerEntries.push(le({
      sellerId, orderId: dispute.id,
      type: "dispute_hold", pocket: "blocked", direction: "credit",
      amount, reference: `order:${dispute.id}:dispute_hold:credit`,
      createdAt: dispute.disputeOpenedAt!,
      description: "Montant bloqué — litige en cours",
    }));
  }

  // Refund
  const refunded = orders.find((o) => o.status === "refunded");
  if (refunded) {
    const amount = refunded.productPrice + (refunded.deliveryCost || 0);
    ledgerEntries.push(le({
      sellerId, orderId: refunded.id,
      type: "refund_debit", pocket: "escrow", direction: "debit",
      amount, reference: `order:${refunded.id}:refund_debit`,
      createdAt: refunded.refundedAt!,
      description: "Remboursement client",
    }));
  }

  // Un retrait simulé
  const payoutAmount = 120000;
  ledgerEntries.push(le({
    sellerId,
    type: "payout_debit", pocket: "available", direction: "debit",
    amount: payoutAmount, reference: "payout-seed-001",
    createdAt: d(10),
    description: "Retrait Wave — 120 000 F",
  }));

  /* ─── BALANCES ─────────────────────────────────────────────── */
  const sellerBalance = { sellerId, escrowBalance: 0, availableBalance: 0, blockedBalance: 0, paidOutBalance: 0, updatedAt: now.toISOString() };
  for (const e of ledgerEntries) {
    if (e.sellerId !== sellerId) continue;
    const keys = { escrow: "escrowBalance", available: "availableBalance", blocked: "blockedBalance", paid_out: "paidOutBalance" } as const;
    const k = keys[e.pocket];
    sellerBalance[k] += e.direction === "credit" ? e.amount : -e.amount;
  }

  /* ─── PAYOUT ────────────────────────────────────────────────── */
  const payouts = [
    {
      id: "payout-seed-001",
      sellerId,
      amount: payoutAmount,
      netAmount: 118200,
      fee: 1800,
      method: "wave" as const,
      phone: "771234567",
      status: "success" as const,
      provider: "bictorys" as const,
      createdAt: d(10),
      updatedAt: d(10),
    },
  ];

  /* ─── DATABASE ──────────────────────────────────────────────── */
  const db: Database = {
    authUsers: [{
      id: sellerId,
      email: "demo@xaalispay.com",
      passwordHash,
      createdAt: d(30),
    }],
    profiles: [{
      id: sellerId,
      username: "adba",
      displayName: "Mamadou Badji",
      businessName: "Boutique XaalisPay Demo",
      phone: "771234567",
      role: "seller",
      payoutMethod: "wave",
      payoutPhone: "771234567",
      emailVerifiedAt: d(29),
      autoPayoutEnabled: false,
      autoPayoutMode: "full_balance",
      autoPayoutMinAmount: 5000,
      autoPayoutFixedAmount: 10000,
      autoPayoutMinCompletedOrders: 3,
      createdAt: d(30),
    }],
    products: products as Database["products"],
    orders,
    ledgerEntries,
    sellerBalances: [sellerBalance],
    paymentAttempts: [],
    webhookEvents: [],
    payouts,
  };

  // Écriture directe (dev local seulement)
  writeDb(db);

  return NextResponse.json({
    ok: true,
    email: "demo@xaalispay.com",
    password: "Demo2026!",
    username: "adba",
    summary: {
      products: products.length,
      orders: orders.length,
      availableBalance: sellerBalance.availableBalance,
      escrowBalance: sellerBalance.escrowBalance,
      blockedBalance: sellerBalance.blockedBalance,
    },
  });
}
