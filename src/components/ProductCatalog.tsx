"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, Product } from "@/lib/types";

type ProductCatalogProps = {
  products: Product[];
};

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const filteredProducts = useMemo(
    () =>
      selectedCategory === "Todos"
        ? products
        : products.filter((product) => product.category === selectedCategory),
    [products, selectedCategory]
  );

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap gap-2">
        {["Todos", ...CATEGORIES].map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-lg border px-4 py-2 text-sm font-black ${
                isActive
                  ? "border-[#1668e8] bg-[#1668e8] text-white"
                  : "border-[#d8dee8] bg-white text-[#344054] hover:border-[#1668e8] hover:text-[#1668e8]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#b8c2d2] bg-white p-10 text-center">
          <p className="font-black">Nenhum produto nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
