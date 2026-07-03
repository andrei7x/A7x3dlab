import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { createTotpQrCodeDataUrl, createTotpSecret, createTotpUri } from "@/lib/two-factor";
import { findUserById, updateAuthStore } from "@/lib/auth-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  const user = await findUserById(session.sub);
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (user.twoFactor.enabled) {
    return NextResponse.json({ error: "2FA já está ativo." }, { status: 400 });
  }

  const secret = createTotpSecret();
  const now = new Date().toISOString();

  await updateAuthStore((store) => {
    const currentUser = store.users.find((item) => item.id === user.id);
    if (!currentUser) return;
    currentUser.twoFactor.pendingSecret = secret;
    currentUser.twoFactor.pendingSecretCreatedAt = now;
    currentUser.updatedAt = now;
  });

  return NextResponse.json({
    secret,
    otpauthUri: createTotpUri(user, secret),
    qrCodeDataUrl: await createTotpQrCodeDataUrl(user, secret)
  });
}
