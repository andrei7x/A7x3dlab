import { storeConfig } from "@/lib/config";
import { Product } from "@/lib/types";

type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http") || pathOrUrl.startsWith("data:")) return pathOrUrl;
  return `${storeConfig.siteUrl}${pathOrUrl}`;
}

export async function createMercadoPagoCheckout(product: Product, quantity = 1) {
  const preferenceId = `mock-${product.id}-${Date.now()}`;
  const mockUrl = `${storeConfig.siteUrl}/checkout-mock?preferenceId=${encodeURIComponent(
    preferenceId
  )}&product=${encodeURIComponent(product.slug)}`;
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const useMock = process.env.MERCADO_PAGO_USE_MOCK !== "false";

  if (!accessToken || useMock) {
    return {
      checkoutUrl: mockUrl,
      preferenceId,
      isMock: true
    };
  }

  // Troque este bloco pelo SDK oficial do Mercado Pago se preferir centralizar credenciais.
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          id: product.id,
          title: product.name,
          description: product.description,
          picture_url: absoluteUrl(product.images[0]),
          quantity,
          currency_id: "BRL",
          unit_price: product.price
        }
      ],
      back_urls: {
        success: `${storeConfig.siteUrl}/catalogo?pagamento=sucesso`,
        pending: `${storeConfig.siteUrl}/catalogo?pagamento=pendente`,
        failure: `${storeConfig.siteUrl}/catalogo?pagamento=falha`
      },
      auto_return: "approved",
      metadata: {
        product_id: product.id,
        product_slug: product.slug
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mercado Pago retornou erro ${response.status}: ${detail}`);
  }

  const preference = (await response.json()) as MercadoPagoPreference;

  return {
    checkoutUrl: preference.init_point || preference.sandbox_init_point || mockUrl,
    preferenceId: preference.id,
    isMock: false
  };
}
