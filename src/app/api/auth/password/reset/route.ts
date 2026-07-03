import { NextResponse } from "next/server";
import { hashOpaqueToken } from "@/lib/auth-utils";
import { createPasswordHash, updateAuthStore } from "@/lib/auth-store";
import { sendPasswordChangedEmail } from "@/lib/email";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    key: "auth:password:reset",
    limit: 8,
    windowMs: 15 * 60 * 1000,
    eventType: "password_reset_submit_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = (await request.json()) as {
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ error: "A nova senha e a confirmação não conferem." }, { status: 400 });
  }

  const tokenHash = hashOpaqueToken(String(body.token || ""));
  const passwordHash = await createPasswordHash(String(body.newPassword || ""));
  let changedEmail = "";
  let resetOk = false;
  const now = new Date().toISOString();

  await updateAuthStore((store) => {
    for (const user of store.users) {
      const token = user.resetTokens.find(
        (item) => item.tokenHash === tokenHash && !item.usedAt && item.expiresAt > now
      );

      if (!token) continue;

      token.usedAt = now;
      user.passwordHash = passwordHash;
      user.passwordVersion += 1;
      user.sessionVersion += 1;
      user.passwordChangedAt = now;
      user.resetTokens = user.resetTokens.map((item) =>
        item.id === token.id ? token : { ...item, usedAt: item.usedAt || now }
      );
      user.updatedAt = now;
      changedEmail = user.email;
      resetOk = true;
      break;
    }
  });

  if (!resetOk) {
    await recordSecurityEvent({
      type: "password_reset_invalid_token",
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
  }

  await sendPasswordChangedEmail(changedEmail);
  return NextResponse.json({ ok: true });
}
