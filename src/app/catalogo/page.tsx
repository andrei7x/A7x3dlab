import { ProductCatalog } from "@/components/ProductCatalog";
import { readProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await readProducts();

  return (
    <section className="py-14">
      <div className="section-shell">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-black uppercase text-[#1668e8]">Catálogo</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            Produtos impressos em 3D
          </h1>
          <p className="mt-4 leading-7 text-[#667085]">
            Escolha uma peça pronta, filtre por categoria ou abra o WhatsApp para ajustar cores,
            medidas e acabamento.
          </p>
        </div>
        <ProductCatalog products={products} />
      </div>
    </section>
  );
}
