"use client";

import { Edit3, ImagePlus, LogOut, PackagePlus, Save, ShieldCheck, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CATEGORIES, Category, Product, ProductPayload } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

type FormState = {
  id?: string;
  name: string;
  description: string;
  category: Category;
  price: string;
  images: string[];
  stock: string;
  isCustomizable: boolean;
  isFeatured: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "Decoração",
  price: "",
  images: [],
  stock: "0",
  isCustomizable: false,
  isFeatured: false
};

export function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const editing = useMemo(() => Boolean(form.id), [form.id]);

  useEffect(() => {
    async function bootstrap() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const session = await response.json();

      if (!session.authenticated) {
        window.location.href = "/login?next=/admin";
        return;
      }

      await loadProducts();
      setCheckingAuth(false);
    }

    bootstrap();
  }, []);

  async function loadProducts() {
    const response = await fetch("/api/products", { cache: "no-store" });
    setProducts(await response.json());
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProducts([]);
    setForm(emptyForm);
    window.location.href = "/login";
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const dataUrls = await Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );

    setForm((current) => ({ ...current, images: [...current.images, ...dataUrls] }));
  }

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: String(product.price),
      images: product.images,
      stock: String(product.stock),
      isCustomizable: product.isCustomizable,
      isFeatured: product.isFeatured
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`Excluir "${product.name}"?`);
    if (!confirmed) return;

    setBusy(true);
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    setBusy(false);

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || "Não foi possível excluir.");
      return;
    }

    setMessage("Produto excluído.");
    await loadProducts();
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const payload: ProductPayload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      images: form.images,
      stock: Number(form.stock),
      isCustomizable: form.isCustomizable,
      isFeatured: form.isFeatured
    };

    const response = await fetch(editing ? `/api/products/${form.id}` : "/api/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível salvar.");
      return;
    }

    setMessage(editing ? "Produto atualizado." : "Produto cadastrado.");
    setForm(emptyForm);
    await loadProducts();
  }

  if (checkingAuth) {
    return (
      <section className="section-shell py-20">
        <div className="rounded-lg border border-[#d8dee8] bg-white p-10 font-black">
          Carregando painel...
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="section-shell grid gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#1668e8]">Admin</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Produtos da loja</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/seguranca"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 py-3 font-black hover:border-[#1668e8] hover:text-[#1668e8]"
            >
              <ShieldCheck size={18} />
              Segurança
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8dee8] bg-white px-4 py-3 font-black hover:border-red-300 hover:text-red-600"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>

        <form onSubmit={submitProduct} className="rounded-lg border border-[#d8dee8] bg-white p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <PackagePlus size={22} />
              {editing ? "Editar produto" : "Cadastrar produto"}
            </h2>
            {editing ? (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#d8dee8] px-3 py-2 text-sm font-black"
              >
                <X size={16} />
                Cancelar
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="admin-label">
              Nome
              <input
                className="admin-input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                minLength={3}
                required
              />
            </label>
            <label className="admin-label">
              Categoria
              <select
                className="admin-input"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label md:col-span-2">
              Descrição
              <textarea
                className="admin-input min-h-28 resize-y"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                minLength={12}
                required
              />
            </label>
            <label className="admin-label">
              Preço
              <input
                className="admin-input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </label>
            <label className="admin-label">
              Quantidade disponível
              <input
                className="admin-input"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                required
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="admin-label">
              Fotos
              <span className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#98a2b3] bg-[#f7f8fb] px-4 py-7 text-[#344054] hover:border-[#1668e8] hover:text-[#1668e8]">
                <ImagePlus size={20} />
                Selecionar imagens
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </span>
            </label>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {form.images.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border">
                    <img src={image} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          images: current.images.filter((_, imageIndex) => imageIndex !== index)
                        }))
                      }
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white text-red-600 shadow"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border border-[#d8dee8] p-4 font-bold">
              <input
                type="checkbox"
                checked={form.isCustomizable}
                onChange={(event) => setForm({ ...form, isCustomizable: event.target.checked })}
                className="size-5"
              />
              Produto personalizado
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-[#d8dee8] p-4 font-bold">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
                className="size-5"
              />
              Produto em destaque
            </label>
          </div>

          {message ? (
            <p className="mt-5 rounded-lg bg-[#f7f8fb] px-4 py-3 text-sm font-bold text-[#344054]">{message}</p>
          ) : null}

          <button
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1668e8] px-5 py-3 font-black text-white hover:bg-[#0d54c5] disabled:opacity-60"
          >
            <Save size={18} />
            {busy ? "Salvando..." : editing ? "Salvar edição" : "Cadastrar"}
          </button>
        </form>

        <div className="grid gap-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="grid gap-4 rounded-lg border border-[#d8dee8] bg-white p-4 md:grid-cols-[110px_1fr_auto] md:items-center"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="aspect-square w-full rounded-lg object-cover md:w-[110px]"
              />
              <div>
                <p className="text-xs font-black uppercase text-[#1668e8]">{product.category}</p>
                <h3 className="mt-1 text-xl font-black">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-[#667085]">{product.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-lg bg-[#f1f3f7] px-2 py-1">{formatCurrency(product.price)}</span>
                  <span className="rounded-lg bg-[#eefbf5] px-2 py-1 text-[#128a52]">
                    {product.stock} em estoque
                  </span>
                  <span className="rounded-lg bg-[#efe9ff] px-2 py-1 text-[#5b2ab7]">
                    {product.isCustomizable ? "Personalizado" : "Produto pronto"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editProduct(product)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d8dee8] px-4 py-2 font-black hover:border-[#1668e8] hover:text-[#1668e8]"
                >
                  <Edit3 size={17} />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => deleteProduct(product)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#ffd0d0] px-4 py-2 font-black text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
