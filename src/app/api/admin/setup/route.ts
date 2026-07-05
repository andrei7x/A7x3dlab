import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createOrUpdateInitialAdmin } from "@/lib/auth-store";
import { getClientIp } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return request.headers.get("x-admin-setup-token")?.trim() || "";
}

function setupTokenMatches(receivedToken: string) {
  const expectedToken = process.env.ADMIN_SETUP_TOKEN || "";
  if (!expectedToken || !receivedToken) return false;

  const expected = Buffer.from(expectedToken);
  const received = Buffer.from(receivedToken);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({ error: "Setup administrativo desativado." }, { status: 503 });
  }

  if (!setupTokenMatches(readBearerToken(request))) {
    await recordSecurityEvent({
      type: "admin_setup_denied",
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") || undefined
    });

    return NextResponse.json({ error: "Acesso nao autorizado." }, { status: 401 });
  }

  const result = await createOrUpdateInitialAdmin();

  await recordSecurityEvent({
    type: result.created ? "admin_setup_created" : "admin_setup_updated",
    email: result.email,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") || undefined
  });

  return NextResponse.json({
    ok: true,
    created: result.created,
    email: result.email
  });
}
