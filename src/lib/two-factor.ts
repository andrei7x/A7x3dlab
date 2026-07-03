import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { storeConfig } from "@/lib/config";
import { AuthUser, RecoveryCodeRecord } from "@/lib/auth-store";
import { createRecoveryCode, normalizeRecoveryCode } from "@/lib/auth-utils";

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_ROUNDS = 12;

export function createTotpSecret() {
  return generateSecret({ length: 20 });
}

export function createTotpUri(user: AuthUser, secret: string) {
  return generateURI({
    issuer: storeConfig.name,
    label: user.email,
    secret,
    digits: 6,
    period: 30
  });
}

export async function createTotpQrCodeDataUrl(user: AuthUser, secret: string) {
  return QRCode.toDataURL(createTotpUri(user, secret), {
    margin: 1,
    width: 240
  });
}

export function verifyTotpCode(secret: string, token: string) {
  const normalizedToken = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedToken)) return false;

  const result = verifySync({
    secret,
    token: normalizedToken,
    digits: 6,
    period: 30,
    epochTolerance: 30
  });

  return result.valid;
}

export async function createHashedRecoveryCodes() {
  const rawCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () => createRecoveryCode());
  const hashedCodes: RecoveryCodeRecord[] = await Promise.all(
    rawCodes.map(async (code) => ({
      id: crypto.randomUUID(),
      codeHash: await bcrypt.hash(normalizeRecoveryCode(code), RECOVERY_CODE_ROUNDS)
    }))
  );

  return { rawCodes, hashedCodes };
}

export async function consumeRecoveryCode(user: AuthUser, code: string) {
  const normalizedCode = normalizeRecoveryCode(code);
  if (!normalizedCode) return false;

  for (const recoveryCode of user.twoFactor.recoveryCodes) {
    if (recoveryCode.usedAt) continue;

    const matches = await bcrypt.compare(normalizedCode, recoveryCode.codeHash);
    if (matches) {
      recoveryCode.usedAt = new Date().toISOString();
      return true;
    }
  }

  return false;
}
