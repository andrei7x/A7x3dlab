import { storeConfig } from "@/lib/config";

const defaultMessage = "Olá! Tenho interesse em um produto personalizado de impressão 3D.";

export function buildWhatsAppUrl(message = defaultMessage) {
  const phone = storeConfig.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildProductWhatsAppUrl(productName: string) {
  return buildWhatsAppUrl(`Olá! Tenho interesse no produto personalizado "${productName}" da A7-3DLAB.`);
}
