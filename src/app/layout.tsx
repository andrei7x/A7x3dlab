import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { storeConfig } from "@/lib/config";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: `${storeConfig.name} | Impressão 3D personalizada`,
  description:
    "Loja virtual de produtos impressos em 3D, peças sob encomenda, presentes personalizados e organizadores."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
