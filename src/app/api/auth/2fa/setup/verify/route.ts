import { NextResponse } from "next/server";
import { getAdminSessionFromRequest, setAdminSessionCookie } from "@/lib/auth";
import { findUserById, updateAuthStore } from "@/lib/auth-store";
import { createHashedRecoveryCodes, verifyTotpCode } from "@/lib/two-factor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const user = await findUserById(session.sub);
  const pendingSecret = user?.twoFactor.pendingSecret;

  if (!user || !pendingSecret) {
    return NextResponse.json({ error: "Inicie a configuração do 2FA novamente." }, { status: 400 });
  }

  if (!verifyTotpCode(pendingSecret, String(body.code || ""))) {
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const { rawCodes, hashedCodes } = await createHashedRecoveryCodes();
  let updatedUser = user;
  const now = new Date().toISOString();

  await updateAuthStore((store) => {
    const currentUser = store.users.find((item) => item.id === user.id);
    if (!currentUser) return;
    currentUser.twoFactor = {
      enabled: true,
      secret: pendingSecret,
      enabledAt: now,
      recoveryCodes: hashedCodes
    };
    currentUser.updatedAt = now;
    updatedUser = currentUser;
  });

  const response = NextResponse.json({ ok: true, recoveryCodes: rawCodes });
  setAdminSessionCookie(response, updatedUser, true);
  return response;
}
