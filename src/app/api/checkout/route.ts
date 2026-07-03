import { NextResponse } from "next/server";
import { readProducts } from "@/lib/products-store";
import { createMercadoPagoCheckout } from "@/services/mercado-pago";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productId?: string; quantity?: number };
    const products = await readProducts();
    const product = products.find((item) => item.id === body.productId);
    const quantity = Number(body.quantity || 1);

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    if (product.stock <= 0) {
      return NextResponse.json({ error: "Produto sem estoque." }, { status: 400 });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }

    const checkout = await createMercadoPagoCheckout(product, quantity);
    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao iniciar pagamento." },
      { status: 500 }
    );
  }
}
