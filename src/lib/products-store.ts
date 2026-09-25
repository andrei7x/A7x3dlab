import { randomUUID } from "node:crypto";
import { CATEGORIES, Product, ProductPayload } from "@/lib/types";
import { getSupabaseAdmin, getSupabaseAdminOrNull } from "@/lib/supabase";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_PRODUCT_IMAGES = 5;
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductPayload["category"];
  price: number | string;
  images: string[] | null;
  stock: number | null;
  is_customizable: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
};

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

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    price: Number(row.price),
    images: row.images || [],
    stock: row.stock || 0,
    isCustomizable: Boolean(row.is_customizable),
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toProductRow(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    images: product.images,
    stock: product.stock,
    is_customizable: product.isCustomizable,
    is_featured: product.isFeatured,
    created_at: product.createdAt,
    updated_at: product.updatedAt
  };
}

export async function readProducts() {
  const supabase = getSupabaseAdminOrNull();
  if (!supabase) return [] as Product[];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase products read failed: ${error.message}`);
  return ((data || []) as ProductRow[]).map(mapProductRow);
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
  if (images.length > MAX_PRODUCT_IMAGES) throw new Error("Adicione no máximo 5 fotos por produto.");

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

export async function uploadProductImage(file: File) {
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error("A imagem deve ter até 3 MB. Tente outra foto ou reduza o tamanho.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!({ "image/jpeg": isJpeg, "image/png": isPng, "image/webp": isWebp }[file.type])) {
    throw new Error("O arquivo selecionado não é uma imagem válida.");
  }

  const path = `product-uploads/${randomUUID()}.${extension}`;
  const { error } = await getSupabaseAdmin().storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

  if (error) throw new Error(`Não foi possível enviar a imagem: ${error.message}`);
  const { data } = getSupabaseAdmin().storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const [, contentType, base64] = match;
  const extension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : contentType === "image/gif"
          ? "gif"
          : "jpg";

  return {
    contentType,
    extension,
    buffer: Buffer.from(base64, "base64")
  };
}

async function uploadProductImages(productId: string, images: string[]) {
  const supabase = getSupabaseAdmin();
  const uploadedImages: string[] = [];

  for (const image of images) {
    const decoded = decodeDataUrl(image);

    if (!decoded) {
      uploadedImages.push(image);
      continue;
    }

    const path = `${productId}/${randomUUID()}.${decoded.extension}`;
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, decoded.buffer, {
        contentType: decoded.contentType,
        cacheControl: "31536000",
        upsert: false
      });

    if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    uploadedImages.push(data.publicUrl);
  }

  return uploadedImages;
}

export async function findProductById(id: string) {
  const supabase = getSupabaseAdminOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Supabase product read failed: ${error.message}`);
  return data ? mapProductRow(data as ProductRow) : null;
}

export async function findProductBySlug(slug: string) {
  const supabase = getSupabaseAdminOrNull();
  if (!supabase) return null;

  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Supabase product read failed: ${error.message}`);
  return data ? mapProductRow(data as ProductRow) : null;
}

export async function createProduct(payload: Partial<ProductPayload>) {
  const supabase = getSupabaseAdmin();
  const products = await readProducts();
  const data = validateProductPayload(payload);
  const now = new Date().toISOString();
  const id = randomUUID();
  const product: Product = {
    id,
    slug: makeUniqueSlug(data.name, products),
    ...data,
    images: await uploadProductImages(id, data.images),
    createdAt: now,
    updatedAt: now
  };

  const { data: inserted, error } = await supabase
    .from("products")
    .insert(toProductRow(product))
    .select("*")
    .single();

  if (error) throw new Error(`Supabase product create failed: ${error.message}`);
  return mapProductRow(inserted as ProductRow);
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>) {
  const supabase = getSupabaseAdmin();
  const products = await readProducts();
  const existingProduct = products.find((product) => product.id === id);
  if (!existingProduct) return null;

  const data = validateProductPayload(payload);
  const product: Product = {
    ...existingProduct,
    ...data,
    images: await uploadProductImages(id, data.images),
    slug: makeUniqueSlug(data.name, products, id),
    updatedAt: new Date().toISOString()
  };

  const { data: updated, error } = await supabase
    .from("products")
    .update(toProductRow(product))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Supabase product update failed: ${error.message}`);
  return mapProductRow(updated as ProductRow);
}

export async function deleteProduct(id: string) {
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from("products")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(`Supabase product delete failed: ${error.message}`);
  return Boolean(count);
}
