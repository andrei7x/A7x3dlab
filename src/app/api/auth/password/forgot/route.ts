import { NextResponse } from "next/server";
import { storeConfig } from "@/lib/config";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth-utils";
import { findUserByEmail, updateAuthStore } from "@/lib/auth-store";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GENERIC_MESSAGE = {
  ok: true,
  message: "Se o e-mail estiver cadastrado, enviaremos um link de redefinição."
};

function resetTokenTtlMs() {
  return Number(process.env.AUTH_RESET_TOKEN_TTL_MINUTES || 30) * 60 * 1000;
}

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    key: "auth:password:forgot",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    eventType: "password_reset_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(GENERIC_MESSAGE);
  }

  const body = (await request.json()) as { email?: string };
  const email = String(body.email || "").trim().toLowerCase();
  const user = email ? await findUserByEmail(email) : null;

  if (!user) {
    await recordSecurityEvent({
      type: "password_reset_requested_unknown_email",
      email,
      ip: getClientIp(request)
    });
    return NextResponse.json(GENERIC_MESSAGE);
  }

  const rawToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);
  const now = Date.now();
  const expiresAt = new Date(now + resetTokenTtlMs()).toISOString();

  await updateAuthStore((store) => {
    const currentUser = store.users.find((item) => item.id === user.id);
    if (!currentUser) return;

    // Only the hash is stored; the raw reset token exists once inside the e-mail link.
    currentUser.resetTokens = [
      {
        id: crypto.randomUUID(),
        tokenHash,
        createdAt: new Date(now).toISOString(),
        expiresAt
      },
      ...currentUser.resetTokens.filter((token) => !token.usedAt).slice(0, 4)
    ];
    currentUser.updatedAt = new Date(now).toISOString();
  });

  const resetUrl = `${storeConfig.siteUrl}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  return NextResponse.json(GENERIC_MESSAGE);
}
