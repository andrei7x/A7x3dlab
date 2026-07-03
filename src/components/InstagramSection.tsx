import { Camera } from "lucide-react";
import { storeConfig } from "@/lib/config";
import { Product } from "@/lib/types";

type InstagramSectionProps = {
  products: Product[];
};

export function InstagramSection({ products }: InstagramSectionProps) {
  const previewProducts = products.slice(0, 3);

  return (
    <section className="py-16">
      <div className="section-shell grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[#1668e8]">@A7-3DLAB</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Veja nossos trabalhos no Instagram
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-[#667085]">
            Acompanhe cores, acabamentos, bastidores de impressão e peças personalizadas feitas por
            encomenda.
          </p>
          <a
            href={storeConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:-translate-y-0.5 hover:bg-[#262a33]"
          >
            <Camera size={18} />
            Abrir Instagram
          </a>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {previewProducts.map((product) => (
            <a
              key={product.id}
              href={storeConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="aspect-[4/5] overflow-hidden rounded-lg bg-[#edf1f7] shadow-sm"
              title={product.name}
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
