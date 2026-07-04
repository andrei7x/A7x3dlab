import nodemailer from "nodemailer";
import { storeConfig } from "@/lib/config";

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

export async function sendMail(message: MailMessage) {
  if (!smtpConfigured()) {
    console.info("[dev-email]", {
      to: message.to,
      subject: message.subject,
      text: message.text
    });
    return { delivered: false, devMode: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    ...message
  });

  return { delivered: true, devMode: false };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendMail({
    to,
    subject: "Redefinicao de senha A7-3DLAB",
    text: `Use este link para redefinir sua senha da ${storeConfig.name}: ${resetUrl}\n\nO link expira em breve. Se voce nao solicitou, ignore esta mensagem.`,
    html: `<p>Use este link para redefinir sua senha da <strong>${storeConfig.name}</strong>:</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>O link expira em breve. Se voce nao solicitou, ignore esta mensagem.</p>`
  });
}

export async function sendPasswordChangedEmail(to: string) {
  return sendMail({
    to,
    subject: "Senha alterada na A7-3DLAB",
    text: `Sua senha da ${storeConfig.name} foi alterada. Se voce nao reconhece esta acao, acesse a loja e redefina sua senha imediatamente.`,
    html: `<p>Sua senha da <strong>${storeConfig.name}</strong> foi alterada.</p><p>Se voce nao reconhece esta acao, acesse a loja e redefina sua senha imediatamente.</p>`
  });
}
