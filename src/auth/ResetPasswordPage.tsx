"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { PasswordStrength } from "@/components/PasswordStrength";

type ResetPasswordPageProps = {
  token: string;
};

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword, confirmPassword })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível redefinir a senha.");
      return;
    }

    setSuccess(true);
    setMessage("Senha redefinida. Você já pode entrar com a nova senha.");
  }

  return (
    <section className="grid min-h-[72vh] place-items-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-[#d8dee8] bg-white p-6 shadow-xl shadow-slate-200/60"
      >
        <p className="text-sm font-black uppercase text-[#1668e8]">Nova senha</p>
        <h1 className="mt-2 text-3xl font-black">Redefinir senha</h1>
        <div className="mt-6 grid gap-4">
          <label className="admin-label">
            Nova senha
            <input
              className="admin-input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          <PasswordStrength password={newPassword} />
          <label className="admin-label">
            Confirmar nova senha
            <input
              className="admin-input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          {message ? (
            <p className={`rounded-lg px-4 py-3 text-sm font-bold ${success ? "bg-[#eefbf5] text-[#128a52]" : "bg-red-50 text-red-600"}`}>
              {message}
            </p>
          ) : null}
          {!success ? (
            <button
              disabled={busy || !token}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1668e8] px-5 py-3 font-black text-white hover:bg-[#0d54c5] disabled:opacity-60"
            >
              <KeyRound size={18} />
              {busy ? "Salvando..." : "Redefinir senha"}
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:bg-[#262a33]"
            >
              Ir para login
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}
