"use client";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginPageProps = {
  nextUrl: string;
};

export function LoginPage({ nextUrl }: LoginPageProps) {
  const [email, setEmail] = useState("admin@a7-3dlab.local");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível entrar.");
      return;
    }

    if (data.requiresTwoFactor) {
      setRequiresTwoFactor(true);
      return;
    }

    window.location.href = nextUrl;
  }

  async function handleTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, recoveryCode })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Código inválido.");
      return;
    }

    window.location.href = nextUrl;
  }

  return (
    <section className="grid min-h-[72vh] place-items-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#d8dee8] bg-white p-6 shadow-xl shadow-slate-200/60">
        <p className="text-sm font-black uppercase text-[#1668e8]">Painel administrativo</p>
        <h1 className="mt-2 text-3xl font-black">{requiresTwoFactor ? "Confirmar 2FA" : "Entrar"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">
          {requiresTwoFactor
            ? "Informe o código de 6 dígitos do aplicativo autenticador ou use um código de recuperação."
            : "Acesse com o e-mail administrativo da loja."}
        </p>

        {!requiresTwoFactor ? (
          <form onSubmit={handleLogin} className="mt-6 grid gap-4">
            <label className="admin-label">
              E-mail
              <input
                className="admin-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label className="admin-label">
              Senha
              <input
                className="admin-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            {message ? <p className="text-sm font-bold text-red-600">{message}</p> : null}
            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:bg-[#262a33] disabled:opacity-60"
            >
              <KeyRound size={18} />
              {busy ? "Entrando..." : "Acessar"}
            </button>
            <Link href="/esqueci-senha" className="text-sm font-black text-[#1668e8] hover:text-[#0d54c5]">
              Esqueci minha senha
            </Link>
          </form>
        ) : (
          <form onSubmit={handleTwoFactor} className="mt-6 grid gap-4">
            <label className="admin-label">
              Código do autenticador
              <input
                className="admin-input"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
              />
            </label>
            <label className="admin-label">
              Código de recuperação
              <input
                className="admin-input"
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value)}
                placeholder="A7-XXXXXX-XXXXXX"
              />
            </label>
            {message ? <p className="text-sm font-bold text-red-600">{message}</p> : null}
            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1668e8] px-5 py-3 font-black text-white hover:bg-[#0d54c5] disabled:opacity-60"
            >
              <ShieldCheck size={18} />
              {busy ? "Verificando..." : "Confirmar acesso"}
            </button>
          </form>
        )}

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#667085] hover:text-[#1668e8]"
        >
          Voltar para loja
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
