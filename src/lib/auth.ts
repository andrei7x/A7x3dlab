import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthUser, findUserById, sanitizeUser } from "@/lib/auth-store";

export const ADMIN_COOKIE_NAME = "a7_admin_session";
export const PENDING_MFA_COOKIE_NAME = "a7_pending_mfa";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const PENDING_MFA_MAX_AGE_SECONDS = 60 * 5;

type SessionPayload = {
  sid: string;
  sub: string;
  email: string;
  mfa: boolean;
  sessionVersion: number;
  exp: number;
  iat: number;
};

type PendingMfaPayload = {
  sub: string;
  sessionVersion: number;
  exp: number;
  iat: number;
};

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "dev-only-change-this-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function createSignedToken<T extends object>(payload: T) {
  const encodedPayload = toBase64Url(
    JSON.stringify(payload)
  );

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySignedToken<T>(token?: string | null) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as T & { exp?: number };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAdminSession(user: AuthUser, mfaVerified: boolean) {
  const now = Date.now();
  return createSignedToken<SessionPayload>({
    sid: crypto.randomUUID(),
    sub: user.id,
    email: user.email,
    mfa: mfaVerified,
    sessionVersion: user.sessionVersion,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000
  });
}

export function createPendingMfaSession(user: AuthUser) {
  const now = Date.now();
  return createSignedToken<PendingMfaPayload>({
    sub: user.id,
    sessionVersion: user.sessionVersion,
    iat: now,
    exp: now + PENDING_MFA_MAX_AGE_SECONDS * 1000
  });
}

export async function verifyAdminSession(token?: string | null) {
  const session = verifySignedToken<SessionPayload>(token);
  if (!session?.sub) return null;

  const user = await findUserById(session.sub);
  if (!user || user.sessionVersion !== session.sessionVersion) return null;
  if (user.twoFactor.enabled && !session.mfa) return null;

  return {
    ...session,
    user: sanitizeUser(user)
  };
}

export async function verifyPendingMfaSession(token?: string | null) {
  const pending = verifySignedToken<PendingMfaPayload>(token);
  if (!pending?.sub) return null;

  const user = await findUserById(pending.sub);
  if (!user || user.sessionVersion !== pending.sessionVersion || !user.twoFactor.enabled) {
    return null;
  }

  return { pending, user };
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function getAdminSessionFromCookieToken(token?: string | null) {
  return verifyAdminSession(token);
}

export function getAdminSessionFromRequest(request: Request) {
  return verifyAdminSession(getCookieValue(request.headers.get("cookie"), ADMIN_COOKIE_NAME));
}

export async function isAdminRequest(request: Request) {
  return Boolean(await getAdminSessionFromRequest(request));
}

export function getPendingMfaFromRequest(request: Request) {
  return verifyPendingMfaSession(getCookieValue(request.headers.get("cookie"), PENDING_MFA_COOKIE_NAME));
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/"
  };
}

export function setAdminSessionCookie(response: NextResponse, user: AuthUser, mfaVerified: boolean) {
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(user, mfaVerified), cookieOptions(SESSION_MAX_AGE_SECONDS));
  response.cookies.set(PENDING_MFA_COOKIE_NAME, "", cookieOptions(0));
}

export function setPendingMfaCookie(response: NextResponse, user: AuthUser) {
  response.cookies.set(PENDING_MFA_COOKIE_NAME, createPendingMfaSession(user), cookieOptions(PENDING_MFA_MAX_AGE_SECONDS));
  response.cookies.set(ADMIN_COOKIE_NAME, "", cookieOptions(0));
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, "", cookieOptions(0));
  response.cookies.set(PENDING_MFA_COOKIE_NAME, "", cookieOptions(0));
}

export { SESSION_MAX_AGE_SECONDS };
