import { NextResponse } from "next/server";
import { getAdminSessionFromRequest, setAdminSessionCookie } from "@/lib/auth";
import { findUserById, updateAuthStore, verifyPassword } from "@/lib/auth-store";
import { consumeRecoveryCode, verifyTotpCode } from "@/lib/two-factor";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit(request, {
    key: "auth:2fa:disable",
    limit: 6,
    windowMs: 10 * 60 * 1000,
    eventType: "two_factor_disable_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = (await request.json()) as { password?: string; code?: string; recoveryCode?: string };
  const user = await findUserById(session.sub);

  if (!user || !(await verifyPassword(String(body.password || ""), user.passwordHash))) {
    await recordSecurityEvent({
      type: "two_factor_disable_password_failed",
      userId: session.sub,
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Senha atual inválida." }, { status: 401 });
  }

  let verified = false;
  let updatedUser = user;

  await updateAuthStore(async (store) => {
    const currentUser = store.users.find((item) => item.id === user.id);
    if (!currentUser?.twoFactor.secret) return;

    verified =
      verifyTotpCode(currentUser.twoFactor.secret, String(body.code || "")) ||
      (body.recoveryCode ? await consumeRecoveryCode(currentUser, body.recoveryCode) : false);

    if (!verified) return;

    currentUser.twoFactor = {
      enabled: false,
      recoveryCodes: []
    };
    currentUser.sessionVersion += 1;
    currentUser.updatedAt = new Date().toISOString();
    updatedUser = currentUser;
  });

  if (!verified) {
    await recordSecurityEvent({
      type: "two_factor_disable_code_failed",
      userId: session.sub,
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Código 2FA inválido." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response, updatedUser, false);
  return response;
}
