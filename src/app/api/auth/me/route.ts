import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAdminSessionFromRequest(request);

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session?.user || null,
    twoFactorVerified: Boolean(session?.mfa)
  });
}
