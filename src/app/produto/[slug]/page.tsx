import { ArrowLeft, MessageCircle, PackageCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ProductGallery } from "@/components/ProductGallery";
import { formatCurrency } from "@/lib/formatters";
import { findProductBySlug, readProducts } from "@/lib/products-store";
import { buildProductWhatsAppUrl } from "@/services/whatsapp";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await readProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  return {
    title: product ? `${product.name} | A7-3DLAB` : "Produto | A7-3DLAB"
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return (
      <section className="py-20">
        <div className="section-shell rounded-lg border border-[#d8dee8] bg-white p-10 text-center">
          <h1 className="text-3xl font-black">Produto não encontrado</h1>
          <Link href="/catalogo" className="mt-6 inline-flex font-black text-[#1668e8]">
            Voltar ao catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="section-shell">
        <Link
          href="/catalogo"
          className="mb-7 inline-flex items-center gap-2 text-sm font-black text-[#667085] hover:text-[#1668e8]"
        >
          <ArrowLeft size={17} />
          Catálogo
        </Link>

        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <ProductGallery images={product.images} name={product.name} />

          <div className="rounded-lg border border-[#d8dee8] bg-white p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-[#eaf1ff] px-3 py-1 text-xs font-black uppercase text-[#1668e8]">
                {product.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#eefbf5] px-3 py-1 text-xs font-black uppercase text-[#128a52]">
                <PackageCheck size={13} />
                {product.stock} disponíveis
              </span>
              {product.isCustomizable ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#efe9ff] px-3 py-1 text-xs font-black uppercase text-[#5b2ab7]">
                  <Sparkles size={13} />
                  Personalizado
                </span>
              ) : (
                <span className="rounded-lg bg-[#f1f3f7] px-3 py-1 text-xs font-black uppercase text-[#344054]">
                  Produto pronto
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-8 text-[#667085]">{product.description}</p>
            <p className="mt-7 text-4xl font-black">{formatCurrency(product.price)}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <CheckoutButton productId={product.id} disabled={product.stock === 0} />
              {product.isCustomizable ? (
                <a
                  href={buildProductWhatsAppUrl(product.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#12b76a] px-5 py-3 font-black text-[#128a52] hover:-translate-y-0.5 hover:bg-[#eefbf5]"
                >
                  <MessageCircle size={18} />
                  Personalizar
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
