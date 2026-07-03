import { NextResponse } from "next/server";
import { getPendingMfaFromRequest, setAdminSessionCookie } from "@/lib/auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";
import { updateAuthStore } from "@/lib/auth-store";
import { consumeRecoveryCode, verifyTotpCode } from "@/lib/two-factor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    key: "auth:2fa:verify",
    limit: 8,
    windowMs: 10 * 60 * 1000,
    eventType: "two_factor_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const pending = await getPendingMfaFromRequest(request);
  if (!pending) {
    return NextResponse.json({ error: "Sessão de 2FA expirada. Faça login novamente." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string; recoveryCode?: string };
  const code = String(body.code || "");
  const recoveryCode = String(body.recoveryCode || "");
  let verifiedUser = pending.user;
  let verified = false;

  await updateAuthStore(async (store) => {
    const user = store.users.find((item) => item.id === pending.user.id);
    if (!user?.twoFactor.secret) return;

    verified =
      verifyTotpCode(user.twoFactor.secret, code) ||
      (recoveryCode ? await consumeRecoveryCode(user, recoveryCode) : false);

    if (verified) {
      user.updatedAt = new Date().toISOString();
      verifiedUser = user;
    }
  });

  if (!verified) {
    await recordSecurityEvent({
      type: "two_factor_failed",
      userId: pending.user.id,
      email: pending.user.email,
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Código inválido." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response, verifiedUser, true);
  return response;
}
