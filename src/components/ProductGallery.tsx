"use client";

import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  name: string;
};

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="grid gap-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-[#edf1f7]">
        <img src={activeImage} alt={name} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveImage(image)}
              className={`aspect-square overflow-hidden rounded-lg border ${
                activeImage === image ? "border-[#1668e8]" : "border-[#d8dee8]"
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
