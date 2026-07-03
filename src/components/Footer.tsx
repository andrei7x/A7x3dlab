import { Camera, MessageCircle } from "lucide-react";
import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { buildWhatsAppUrl } from "@/services/whatsapp";

export function Footer() {
  return (
    <footer className="bg-[#101217] py-12 text-white">
      <div className="section-shell grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-xl font-black">{storeConfig.name}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/64">
            Produtos impressos em 3D, presentes personalizados, organizadores e peças técnicas sob
            encomenda.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Loja</p>
          <div className="mt-3 grid gap-2 text-sm text-white/64">
            <Link href="/catalogo" className="hover:text-white">
              Catálogo
            </Link>
            <Link href="/admin" className="hover:text-white">
              Painel administrativo
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-white/90">Contato</p>
          <div className="mt-3 flex gap-2">
            <a
              href={storeConfig.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="grid size-10 place-items-center rounded-lg border border-white/12 text-white/74 hover:bg-white hover:text-[#101217]"
              title="Instagram"
            >
              <Camera size={18} />
            </a>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noreferrer"
              className="grid size-10 place-items-center rounded-lg border border-white/12 text-white/74 hover:bg-white hover:text-[#101217]"
              title="WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
