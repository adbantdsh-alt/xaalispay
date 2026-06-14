export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildPaymentLinkMessage(payUrl: string, productName: string) {
  return `Paiement sécurisé XaalisPay pour « ${productName} » :\n${payUrl}\n\nVos fonds sont protégés jusqu'à réception du colis.`;
}

export function buildShopShareMessage(shopUrl: string, username: string) {
  return `Achetez en toute sécurité sur ma boutique XaalisPay :\n${shopUrl}\n\nPaiement protégé jusqu'à réception du colis.`;
}

export function buildPinShareMessage(pin: string, productName: string) {
  return `Mon code livraison XaalisPay pour "${productName}" : ${pin}\n\nÀ donner uniquement après vérification du colis.`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
