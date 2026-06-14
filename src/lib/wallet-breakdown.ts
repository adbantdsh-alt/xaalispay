import type { OrderStatus } from "./types";

export interface WalletSequesteredItem {
  orderId: string;
  productName: string;
  clientName: string;
  amount: number;
  status: OrderStatus;
  protectionEndsAt?: string;
}

export interface WalletBreakdownInput {
  available: number;
  sequestered: WalletSequesteredItem[];
}

export interface WalletBreakdown {
  available: number;
  sequestered: number;
  pendingRefund: number;
  blocked: number;
  heldTotal: number;
}

export function computeWalletBreakdown(wallet: WalletBreakdownInput): WalletBreakdown {
  let sequestered = 0;
  let pendingRefund = 0;
  let blocked = 0;

  for (const item of wallet.sequestered) {
    if (item.status === "dispute") blocked += item.amount;
    else if (item.status === "protection") pendingRefund += item.amount;
    else if (item.status === "paid") sequestered += item.amount;
  }

  return {
    available: wallet.available,
    sequestered,
    pendingRefund,
    blocked,
    heldTotal: sequestered + pendingRefund + blocked,
  };
}
