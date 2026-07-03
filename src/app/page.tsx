import { ArrowRight, BadgeCheck, Box, Camera, MessageCircle, WandSparkles } from "lucide-react";
import Link from "next/link";
import { InstagramSection } from "@/components/InstagramSection";
import { ProductCard } from "@/components/ProductCard";
import { storeConfig } from "@/lib/config";
import { readProducts } from "@/lib/products-store";
import { buildWhatsAppUrl } from "@/services/whatsapp";

export default async function HomePage() {
  const products = await readProducts();
  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 4);

  return (
    <>
      <section className="relative grid min-h-[88vh] overflow-hidden bg-[#101217] text-white">
        <img
          src="/images/hero-3d-lab.png"
          alt="Impressora 3D criando produto personalizado"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101217] via-[#101217]/80 to-[#101217]/20" />
        <div className="section-shell relative z-10 flex items-center py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/18 bg-white/10 px-3 py-2 text-sm font-black text-white/85">
              <WandSparkles size={16} />
              Produtos personalizados em impressão 3D
            </p>
            <h1 className="gradient-text mt-6 text-5xl font-black tracking-tight md:text-7xl">
              {storeConfig.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/76">
              Loja virtual de peças prontas, presentes sob medida, organizadores e protótipos
              funcionais com acabamento moderno.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-black text-[#101217] hover:-translate-y-0.5 hover:bg-[#d8f8ff]"
              >
                Ver catálogo
                <ArrowRight size={18} />
              </Link>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-black text-white hover:-translate-y-0.5 hover:bg-white/10"
              >
                <MessageCircle size={18} />
                Encomendar
              </a>
              <a
                href={storeConfig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-black text-white hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Camera size={18} />
                Instagram
              </a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ["PLA/PETG", "materiais"],
                ["Sob medida", "personalização"],
                ["R$ BRL", "checkout"]
              ].map(([value, label]) => (
                <div key={value} className="glass-panel rounded-lg p-4">
                  <p className="text-xl font-black">{value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase text-white/58">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="section-shell">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase text-[#1668e8]">Produtos em destaque</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Peças prontas para comprar ou personalizar
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 py-3 font-black text-[#101217] hover:border-[#1668e8] hover:text-[#1668e8]"
            >
              Catálogo completo
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="section-shell grid gap-8 md:grid-cols-3">
          {[
            {
              icon: BadgeCheck,
              title: "Acabamento limpo",
              text: "Camadas consistentes, conferência visual e opções de cores para cada peça."
            },
            {
              icon: Box,
              title: "Produto pronto",
              text: "Itens de catálogo com estoque disponível e compra iniciada pelo checkout."
            },
            {
              icon: WandSparkles,
              title: "Sob encomenda",
              text: "Pedidos personalizados pelo WhatsApp com nome do produto na mensagem."
            }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-[#d8dee8] p-6">
              <item.icon className="text-[#1668e8]" size={28} />
              <h3 className="mt-5 text-xl font-black">{item.title}</h3>
              <p className="mt-3 leading-7 text-[#667085]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <InstagramSection products={products} />
    </>
  );
}
