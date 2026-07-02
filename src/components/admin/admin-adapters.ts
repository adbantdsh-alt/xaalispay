import type {
  AffiliateProgramSummary,
  AffiliateRow,
  DisputeRow,
  PayoutRow,
  ProductRow,
  ReferrerGroupRow,
  SellerRow,
  TeamMemberDetail,
  TeamMemberRow,
} from "./admin-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptDisputeRow(o: any): DisputeRow {
  const dispute = o.dispute || {};
  return {
    id: String(o.id),
    orderNumber: o.order_number,
    slug: o.slug,
    sellerId: "",
    sellerUsername: o.seller_username,
    sellerName: o.seller_business_name,
    sellerPhone: o.seller_phone || null,
    productName: o.product_name,
    clientName: o.client_name,
    clientPhone: o.client_phone,
    clientAddress: o.client_address || null,
    status: o.status,
    total: o.total_amount,
    buyerProtectionFee: o.buyer_protection_fee || 0,
    paymentMethod: o.payment_method,
    paidAt: o.paid_at || undefined,
    clientDeliveryConfirmedAt: o.delivery_validated_at || undefined,
    disputeType: dispute.dispute_type,
    disputeTypeLabel: dispute.dispute_type_display || "",
    responsibleParty: dispute.responsible_party,
    disputeOpenedAt: dispute.opened_at || undefined,
    sellerResponseDeadlineAt: dispute.seller_response_deadline_at || undefined,
    disputeReason: dispute.reason || "",
    disputeMedia: dispute.media || [],
    createdAt: o.created_at,
    updatedAt: o.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptPayoutRow(p: any): PayoutRow {
  return {
    id: String(p.id),
    sellerUsername: p.seller_username,
    sellerName: p.seller_business_name,
    amount: p.amount,
    method: p.method,
    phone: p.phone,
    status: p.status,
    failureReason: p.failure_reason || undefined,
    createdAt: p.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptSellerRow(s: any): SellerRow {
  return {
    id: s.id,
    username: s.username,
    businessName: s.business_name,
    displayName: s.display_name,
    phone: s.phone,
    email: s.email || null,
    isActive: s.is_active,
    createdAt: s.created_at,
    ordersCount: s.orders_count,
    lifetimeGmv: s.lifetime_gmv,
    balance: {
      escrowBalance: s.balance.escrow_balance,
      availableBalance: s.balance.available_balance,
      blockedBalance: s.balance.blocked_balance,
      paidOutBalance: s.balance.paid_out_balance,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptProductRow(p: any): ProductRow {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    active: p.active,
    sellerUsername: p.seller_username,
    sellerBusinessName: p.seller_business_name,
    ordersCount: p.orders_count,
    createdAt: p.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptTeamMemberRow(m: any): TeamMemberRow {
  return {
    id: m.id,
    email: m.email || null,
    displayName: m.display_name,
    role: m.role,
    isActive: m.is_active,
    createdAt: m.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptTeamMemberDetail(m: any): TeamMemberDetail {
  return {
    ...adaptTeamMemberRow(m),
    mustChangePassword: m.must_change_password,
    tempPassword: m.temp_password ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptAffiliateRow(r: any): AffiliateRow {
  return {
    id: String(r.id),
    referrerUsername: r.referrer_username,
    referrerBusinessName: r.referrer_business_name,
    username: r.username,
    businessName: r.business_name,
    displayName: r.display_name,
    createdAt: r.created_at,
    boostExpiresAt: r.boost_expires_at,
    isBoosted: r.is_boosted,
    lifetimeGmv: r.lifetime_gmv,
    commissionEarnedTotal: r.commission_earned_total,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptReferrerGroupRow(r: any): ReferrerGroupRow {
  return {
    referrerId:             r.referrer_id,
    referrerUsername:       r.referrer_username,
    referrerBusinessName:   r.referrer_business_name,
    referralCount:          r.referral_count,
    boostedCount:           r.boosted_count,
    totalCommission:        r.total_commission,
    totalLifetimeGmv:       r.total_lifetime_gmv,
    latestBoostExpiresAt:   r.latest_boost_expires_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptAffiliateProgramSummary(s: any): AffiliateProgramSummary {
  return {
    totalReferrals: s.total_referrals,
    boostedCount: s.boosted_count,
    lifetimeCount: s.lifetime_count,
    commissionsPaidTotal: s.commissions_paid_total,
  };
}
