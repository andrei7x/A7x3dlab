import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { CATEGORIES, Product, ProductPayload } from "@/lib/types";

const productsFile = path.join(process.cwd(), "src", "data", "products.json");

function isValidCategory(value: string): value is ProductPayload["category"] {
  return CATEGORIES.includes(value as ProductPayload["category"]);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureStore() {
  await fs.mkdir(path.dirname(productsFile), { recursive: true });

  try {
    await fs.access(productsFile);
  } catch {
    await fs.writeFile(productsFile, "[]", "utf8");
  }
}

export async function readProducts() {
  await ensureStore();
  const raw = await fs.readFile(productsFile, "utf8");
  return JSON.parse(raw) as Product[];
}

async function writeProducts(products: Product[]) {
  await ensureStore();
  await fs.writeFile(productsFile, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

function makeUniqueSlug(name: string, products: Product[], ignoredId?: string) {
  const baseSlug = slugify(name) || "produto";
  let slug = baseSlug;
  let index = 2;

  while (products.some((product) => product.id !== ignoredId && product.slug === slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

export function validateProductPayload(payload: Partial<ProductPayload>) {
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const category = String(payload.category || "");
  const price = Number(payload.price);
  const stock = Number(payload.stock);
  const images = Array.isArray(payload.images)
    ? payload.images.map((image) => String(image).trim()).filter(Boolean)
    : [];

  if (name.length < 3) throw new Error("Informe um nome com pelo menos 3 caracteres.");
  if (description.length < 12) throw new Error("Informe uma descrição mais completa.");
  if (!isValidCategory(category)) throw new Error("Selecione uma categoria válida.");
  if (!Number.isFinite(price) || price <= 0) throw new Error("Informe um preço válido.");
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Informe um estoque válido.");
  if (images.length === 0) throw new Error("Adicione pelo menos uma foto do produto.");

  return {
    name,
    description,
    category,
    price,
    stock,
    images,
    isCustomizable: Boolean(payload.isCustomizable),
    isFeatured: Boolean(payload.isFeatured)
  } satisfies ProductPayload;
}

export async function findProductById(id: string) {
  const products = await readProducts();
  return products.find((product) => product.id === id) || null;
}

export async function findProductBySlug(slug: string) {
  const products = await readProducts();
  return products.find((product) => product.slug === slug) || null;
}

export async function createProduct(payload: Partial<ProductPayload>) {
  const products = await readProducts();
  const data = validateProductPayload(payload);
  const now = new Date().toISOString();
  const product: Product = {
    id: randomUUID(),
    slug: makeUniqueSlug(data.name, products),
    ...data,
    createdAt: now,
    updatedAt: now
  };

  await writeProducts([product, ...products]);
  return product;
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>) {
  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  const data = validateProductPayload(payload);
  const product: Product = {
    ...products[index],
    ...data,
    slug: makeUniqueSlug(data.name, products, id),
    updatedAt: new Date().toISOString()
  };

  products[index] = product;
  await writeProducts(products);
  return product;
}

export async function deleteProduct(id: string) {
  const products = await readProducts();
  const nextProducts = products.filter((product) => product.id !== id);
  if (nextProducts.length === products.length) return false;
  await writeProducts(nextProducts);
  return true;
}
