import { MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";
import { buildProductWhatsAppUrl } from "@/services/whatsapp";
import { CheckoutButton } from "@/components/CheckoutButton";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card overflow-hidden rounded-lg">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden bg-[#edf1f7]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
      </Link>
      <div className="grid gap-4 p-4">
        <div className="flex min-h-20 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-[#1668e8]">{product.category}</p>
            <Link href={`/produto/${product.slug}`} className="mt-1 block text-lg font-black">
              {product.name}
            </Link>
          </div>
          {product.isCustomizable ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#efe9ff] px-2 py-1 text-xs font-black text-[#5b2ab7]">
              <Sparkles size={13} />
              Personalizado
            </span>
          ) : null}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black">{formatCurrency(product.price)}</p>
            <p className="text-xs font-semibold text-[#667085]">{product.stock} disponíveis</p>
          </div>
          {product.isCustomizable ? (
            <a
              href={buildProductWhatsAppUrl(product.name)}
              target="_blank"
              rel="noreferrer"
              className="grid size-10 place-items-center rounded-lg border border-[#d8dee8] text-[#12b76a] hover:border-[#12b76a] hover:bg-[#eefbf5]"
              title="Personalizar no WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
          ) : null}
        </div>
        <CheckoutButton productId={product.id} disabled={product.stock === 0} compact />
      </div>
    </article>
  );
}
