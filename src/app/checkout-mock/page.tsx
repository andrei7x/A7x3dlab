import { CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { readProducts } from "@/lib/products-store";
import { buildWhatsAppUrl } from "@/services/whatsapp";

type CheckoutMockPageProps = {
  searchParams: Promise<{ preferenceId?: string; product?: string }>;
};

export default async function CheckoutMockPage({ searchParams }: CheckoutMockPageProps) {
  const params = await searchParams;
  const products = await readProducts();
  const product = products.find((item) => item.slug === params.product);

  return (
    <section className="py-20">
      <div className="section-shell max-w-2xl rounded-lg border border-[#d8dee8] bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto text-[#12b76a]" size={46} />
        <p className="mt-5 text-sm font-black uppercase text-[#1668e8]">Mercado Pago mock</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Checkout preparado</h1>
        <p className="mt-4 leading-7 text-[#667085]">
          {product
            ? `Produto selecionado: ${product.name}.`
            : "A preferência de pagamento foi criada no fluxo de teste."}
        </p>
        <p className="mt-2 break-all text-xs font-semibold text-[#98a2b3]">
          {params.preferenceId || "mock-sem-preference-id"}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/catalogo"
            className="rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:bg-[#262a33]"
          >
            Voltar ao catálogo
          </Link>
          <a
            href={buildWhatsAppUrl(product ? `Olá! Quero finalizar o pedido: ${product.name}.` : undefined)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#12b76a] px-5 py-3 font-black text-[#128a52] hover:bg-[#eefbf5]"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
