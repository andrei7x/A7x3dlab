"use client";

import { KeyRound, QrCode, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PasswordStrength } from "@/components/PasswordStrength";

type UserState = {
  email: string;
  name: string;
  twoFactorEnabled: boolean;
  passwordChangedAt: string;
};

export function SecurityPage() {
  const [user, setUser] = useState<UserState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableRecoveryCode, setDisableRecoveryCode] = useState("");

  async function loadUser() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();

    if (!data.authenticated) {
      window.location.href = "/login?next=/seguranca";
      return;
    }

    setUser(data.user);
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/password/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível trocar a senha.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Senha alterada. Sessões antigas foram invalidadas.");
    await loadUser();
  }

  async function startTwoFactor() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/auth/2fa/setup/start", { method: "POST" });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível iniciar o 2FA.");
      return;
    }

    setSetup({ qrCodeDataUrl: data.qrCodeDataUrl, secret: data.secret });
  }

  async function verifyTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/2fa/setup/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: setupCode })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Código inválido.");
      return;
    }

    setRecoveryCodes(data.recoveryCodes || []);
    setSetup(null);
    setSetupCode("");
    setMessage("2FA ativado. Guarde os códigos de recuperação em local seguro.");
    await loadUser();
  }

  async function disableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: disablePassword,
        code: disableCode,
        recoveryCode: disableRecoveryCode
      })
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível desativar o 2FA.");
      return;
    }

    setDisablePassword("");
    setDisableCode("");
    setDisableRecoveryCode("");
    setRecoveryCodes([]);
    setMessage("2FA desativado.");
    await loadUser();
  }

  if (!user) {
    return (
      <section className="section-shell py-20">
        <div className="rounded-lg border border-[#d8dee8] bg-white p-10 font-black">
          Carregando segurança...
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="section-shell grid gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#1668e8]">Minha conta</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Segurança da conta</h1>
            <p className="mt-2 text-[#667085]">{user.email}</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border border-[#d8dee8] bg-white px-4 py-3 font-black hover:border-[#1668e8] hover:text-[#1668e8]"
          >
            Voltar ao painel
          </Link>
        </div>

        {message ? (
          <p className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold text-[#344054]">
            {message}
          </p>
        ) : null}

        <form onSubmit={changePassword} className="rounded-lg border border-[#d8dee8] bg-white p-5">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <KeyRound size={22} />
            Trocar senha
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="admin-label md:col-span-2">
              Senha atual
              <input
                className="admin-input"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
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
            <div className="md:col-span-2">
              <PasswordStrength password={newPassword} />
            </div>
          </div>
          <button
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1668e8] px-5 py-3 font-black text-white hover:bg-[#0d54c5] disabled:opacity-60"
          >
            <KeyRound size={18} />
            {busy ? "Salvando..." : "Alterar senha"}
          </button>
        </form>

        <section className="rounded-lg border border-[#d8dee8] bg-white p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black">
                <ShieldCheck size={22} />
                Dupla autenticação
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Status: {user.twoFactorEnabled ? "ativo por aplicativo autenticador" : "desativado"}
              </p>
            </div>
            {!user.twoFactorEnabled ? (
              <button
                type="button"
                onClick={startTwoFactor}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101217] px-5 py-3 font-black text-white hover:bg-[#262a33] disabled:opacity-60"
              >
                <QrCode size={18} />
                Ativar 2FA
              </button>
            ) : null}
          </div>

          {setup ? (
            <form onSubmit={verifyTwoFactor} className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
              <div className="rounded-lg border border-[#d8dee8] bg-[#f7f8fb] p-4">
                <img src={setup.qrCodeDataUrl} alt="QR Code 2FA" className="mx-auto size-56" />
              </div>
              <div className="grid content-start gap-4">
                <p className="text-sm leading-6 text-[#667085]">
                  Escaneie o QR Code no Google Authenticator, Microsoft Authenticator ou Authy. Código manual:
                </p>
                <code className="break-all rounded-lg bg-[#f1f3f7] p-3 text-sm font-black">{setup.secret}</code>
                <label className="admin-label">
                  Código de 6 dígitos
                  <input
                    className="admin-input"
                    value={setupCode}
                    onChange={(event) => setSetupCode(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                </label>
                <button
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1668e8] px-5 py-3 font-black text-white hover:bg-[#0d54c5] disabled:opacity-60"
                >
                  <ShieldCheck size={18} />
                  Confirmar e ativar
                </button>
              </div>
            </form>
          ) : null}

          {recoveryCodes.length > 0 ? (
            <div className="mt-6 rounded-lg border border-[#d8dee8] bg-[#f7f8fb] p-4">
              <p className="font-black">Códigos de recuperação</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {recoveryCodes.map((code) => (
                  <code key={code} className="rounded-lg bg-white p-2 text-sm font-black">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          ) : null}

          {user.twoFactorEnabled ? (
            <form onSubmit={disableTwoFactor} className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="admin-label">
                Senha atual
                <input
                  className="admin-input"
                  value={disablePassword}
                  onChange={(event) => setDisablePassword(event.target.value)}
                  type="password"
                  required
                />
              </label>
              <label className="admin-label">
                Código 2FA
                <input
                  className="admin-input"
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
              <label className="admin-label">
                Código de recuperação
                <input
                  className="admin-input"
                  value={disableRecoveryCode}
                  onChange={(event) => setDisableRecoveryCode(event.target.value)}
                />
              </label>
              <button
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-3 font-black text-red-600 hover:bg-red-50 disabled:opacity-60 md:col-span-3"
              >
                <ShieldOff size={18} />
                Desativar 2FA
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </section>
  );
}
