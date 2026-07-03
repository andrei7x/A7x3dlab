"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    setBusy(false);
    setMessage(data.message || "Se o e-mail estiver cadastrado, enviaremos um link.");
  }

  return (
    <section className="grid min-h-[72vh] place-items-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-[#d8dee8] bg-white p-6 shadow-xl shadow-slate-200/60"
      >
        <p className="text-sm font-black uppercase text-[#1668e8]">Recuperação</p>
        <h1 className="mt-2 text-3xl font-black">Esqueci minha senha</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          Informe o e-mail administrativo. Se ele existir, enviaremos um link seguro e temporário.
        </p>
        <div className="mt-6 grid gap-4">
          <label className="admin-label">
            E-mail
            <input
              className="admin-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          {message ? <p className="rounded-lg bg-[#eefbf5] px-4 py-3 text-sm font-bold text-[#128a52]">{message}</p> : null}
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:bg-[#262a33] disabled:opacity-60"
          >
            <Mail size={18} />
            {busy ? "Enviando..." : "Enviar link"}
          </button>
          <Link href="/login" className="text-sm font-black text-[#1668e8] hover:text-[#0d54c5]">
            Voltar ao login
          </Link>
        </div>
      </form>
    </section>
  );
}
