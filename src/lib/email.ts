import { promises as fs } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { storeConfig } from "@/lib/config";

const devEmailsFile = path.join(process.cwd(), "src", "data", "dev-emails.json");

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

async function storeDevEmail(message: MailMessage) {
  await fs.mkdir(path.dirname(devEmailsFile), { recursive: true });

  let messages: Array<MailMessage & { createdAt: string }> = [];
  try {
    messages = JSON.parse(await fs.readFile(devEmailsFile, "utf8"));
  } catch {
    messages = [];
  }

  messages.unshift({ ...message, createdAt: new Date().toISOString() });
  await fs.writeFile(devEmailsFile, `${JSON.stringify(messages.slice(0, 25), null, 2)}\n`, "utf8");
}

export async function sendMail(message: MailMessage) {
  if (!smtpConfigured()) {
    await storeDevEmail(message);
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
    subject: "Redefinição de senha A7-3DLAB",
    text: `Use este link para redefinir sua senha da ${storeConfig.name}: ${resetUrl}\n\nO link expira em breve. Se você não solicitou, ignore esta mensagem.`,
    html: `<p>Use este link para redefinir sua senha da <strong>${storeConfig.name}</strong>:</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>O link expira em breve. Se você não solicitou, ignore esta mensagem.</p>`
  });
}

export async function sendPasswordChangedEmail(to: string) {
  return sendMail({
    to,
    subject: "Senha alterada na A7-3DLAB",
    text: `Sua senha da ${storeConfig.name} foi alterada. Se você não reconhece esta ação, acesse a loja e redefina sua senha imediatamente.`,
    html: `<p>Sua senha da <strong>${storeConfig.name}</strong> foi alterada.</p><p>Se você não reconhece esta ação, acesse a loja e redefina sua senha imediatamente.</p>`
  });
}
