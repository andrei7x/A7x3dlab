export const CATEGORIES = [
  "Decoração",
  "Chaveiros",
  "Organizadores",
  "Presentes personalizados",
  "Peças sob encomenda"
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  images: string[];
  stock: number;
  isCustomizable: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductPayload = {
  name: string;
  description: string;
  category: Category;
  price: number;
  images: string[];
  stock: number;
  isCustomizable: boolean;
  isFeatured: boolean;
};

export type CheckoutResponse = {
  checkoutUrl: string;
  preferenceId: string;
  isMock: boolean;
};
