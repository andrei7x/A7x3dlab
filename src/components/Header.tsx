import { Camera, MessageCircle, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { buildWhatsAppUrl } from "@/services/whatsapp";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/seguranca", label: "Segurança" },
  { href: "/admin", label: "Admin" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101217]/90 text-white backdrop-blur-xl">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-black tracking-wide">
          <span className="grid size-9 place-items-center rounded-lg bg-white text-[#101217]">
            <ShoppingBag size={18} />
          </span>
          <span>{storeConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/74 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            aria-label="Instagram"
            href={storeConfig.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="grid size-10 place-items-center rounded-lg border border-white/12 text-white/80 hover:bg-white hover:text-[#101217]"
            title="Instagram"
          >
            <Camera size={18} />
          </a>
          <a
            aria-label="WhatsApp"
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-[#101217] hover:-translate-y-0.5 hover:bg-[#d8f8ff] sm:flex"
            title="WhatsApp"
          >
            <MessageCircle size={17} />
            WhatsApp
          </a>
          <Link
            aria-label="Painel administrativo"
            href="/admin"
            className="grid size-10 place-items-center rounded-lg border border-white/12 text-white/80 hover:bg-white/10 hover:text-white md:hidden"
            title="Admin"
          >
            <ShieldCheck size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
