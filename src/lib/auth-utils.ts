import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRecoveryCode() {
  const first = randomBytes(3).toString("hex").toUpperCase();
  const second = randomBytes(3).toString("hex").toUpperCase();
  return `A7-${first}-${second}`;
}

export function normalizeRecoveryCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
