import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/services/whatsapp";

export function WhatsAppFloatingButton() {
  return (
    <a
      aria-label="Abrir WhatsApp"
      href={buildWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      title="WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-lg bg-[#12b76a] text-white shadow-[0_18px_45px_rgba(18,183,106,0.35)] hover:-translate-y-1 hover:bg-[#0f9f5c]"
    >
      <MessageCircle size={26} />
    </a>
  );
}
