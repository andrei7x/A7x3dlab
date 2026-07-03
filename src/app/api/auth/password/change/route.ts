import { NextResponse } from "next/server";
import { getAdminSessionFromRequest, setAdminSessionCookie } from "@/lib/auth";
import { createPasswordHash, findUserById, updateAuthStore, verifyPassword } from "@/lib/auth-store";
import { sendPasswordChangedEmail } from "@/lib/email";
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
    key: "auth:password:change",
    limit: 6,
    windowMs: 10 * 60 * 1000,
    eventType: "password_change_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ error: "A nova senha e a confirmação não conferem." }, { status: 400 });
  }

  const user = await findUserById(session.sub);
  if (!user || !(await verifyPassword(String(body.currentPassword || ""), user.passwordHash))) {
    await recordSecurityEvent({
      type: "password_change_current_password_failed",
      userId: session.sub,
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Senha atual inválida." }, { status: 401 });
  }

  const passwordHash = await createPasswordHash(String(body.newPassword || ""));
  let updatedUser = user;
  const now = new Date().toISOString();

  await updateAuthStore((store) => {
    const currentUser = store.users.find((item) => item.id === user.id);
    if (!currentUser) return;
    currentUser.passwordHash = passwordHash;
    currentUser.passwordVersion += 1;
    currentUser.sessionVersion += 1;
    currentUser.passwordChangedAt = now;
    currentUser.resetTokens = [];
    currentUser.updatedAt = now;
    updatedUser = currentUser;
  });

  await sendPasswordChangedEmail(updatedUser.email);

  const response = NextResponse.json({ ok: true });
  setAdminSessionCookie(response, updatedUser, updatedUser.twoFactor.enabled);
  return response;
}
