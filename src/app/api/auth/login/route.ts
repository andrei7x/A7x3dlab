import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword } from "@/lib/auth-store";
import { setAdminSessionCookie, setPendingMfaCookie } from "@/lib/auth";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit(request, {
    key: "auth:login",
    limit: 8,
    windowMs: 15 * 60 * 1000,
    eventType: "login_rate_limited"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = (await request.json()) as { email?: string; username?: string; password?: string };
  const email = String(body.email || body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = email ? await findUserByEmail(email) : null;
  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    await recordSecurityEvent({
      type: "login_failed",
      email,
      ip: getClientIp(request)
    });
    return NextResponse.json({ error: "Login ou senha inválidos." }, { status: 401 });
  }

  if (user.twoFactor.enabled) {
    const response = NextResponse.json({ ok: true, requiresTwoFactor: true });
    setPendingMfaCookie(response, user);
    return response;
  }

  const response = NextResponse.json({ ok: true, requiresTwoFactor: false });
  setAdminSessionCookie(response, user, false);

  return response;
}
