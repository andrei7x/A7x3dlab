"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";

type CheckoutButtonProps = {
  productId: string;
  disabled?: boolean;
  compact?: boolean;
};

export function CheckoutButton({ productId, disabled, compact }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível iniciar o checkout.");
      }

      window.location.href = data.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#1668e8] font-black text-white shadow-[0_14px_32px_rgba(22,104,232,0.28)] hover:-translate-y-0.5 hover:bg-[#0d54c5] disabled:cursor-not-allowed disabled:opacity-55 ${
          compact ? "px-4 py-2 text-sm" : "px-5 py-3"
        }`}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
        {loading ? "Abrindo..." : "Comprar"}
      </button>
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
