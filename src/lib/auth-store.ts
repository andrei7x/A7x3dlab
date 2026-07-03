import { promises as fs } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { validateStrongPassword } from "@/lib/password-policy";

const authFile = path.join(process.cwd(), "src", "data", "auth.json");
const BCRYPT_ROUNDS = 12;

export type ResetTokenRecord = {
  id: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
};

export type RecoveryCodeRecord = {
  id: string;
  codeHash: string;
  usedAt?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordVersion: number;
  sessionVersion: number;
  passwordChangedAt: string;
  resetTokens: ResetTokenRecord[];
  twoFactor: {
    enabled: boolean;
    secret?: string;
    pendingSecret?: string;
    pendingSecretCreatedAt?: string;
    enabledAt?: string;
    recoveryCodes: RecoveryCodeRecord[];
  };
  createdAt: string;
  updatedAt: string;
};

export type AuthStore = {
  users: AuthUser[];
};

function getInitialAdminEmail() {
  return (process.env.AUTH_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@a7-3dlab.local")
    .trim()
    .toLowerCase();
}

function getInitialAdminPassword() {
  return process.env.AUTH_INITIAL_ADMIN_PASSWORD || "A7-Admin-2026!";
}

async function hashPassword(password: string) {
  // Passwords are never persisted as plain text; bcrypt stores a salted, slow hash.
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createPasswordHash(password: string) {
  validateStrongPassword(password);
  return hashPassword(password);
}

async function createInitialStore(): Promise<AuthStore> {
  const initialPassword = getInitialAdminPassword();
  validateStrongPassword(initialPassword);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: "admin",
        email: getInitialAdminEmail(),
        name: "Administrador A7-3DLAB",
        passwordHash: await hashPassword(initialPassword),
        passwordVersion: 1,
        sessionVersion: 1,
        passwordChangedAt: now,
        resetTokens: [],
        twoFactor: {
          enabled: false,
          recoveryCodes: []
        },
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(authFile), { recursive: true });

  try {
    await fs.access(authFile);
  } catch {
    const store = await createInitialStore();
    await fs.writeFile(authFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

export async function readAuthStore() {
  await ensureStore();
  const raw = await fs.readFile(authFile, "utf8");
  return JSON.parse(raw) as AuthStore;
}

export async function writeAuthStore(store: AuthStore) {
  await fs.mkdir(path.dirname(authFile), { recursive: true });
  await fs.writeFile(authFile, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function updateAuthStore(mutator: (store: AuthStore) => void | Promise<void>) {
  const store = await readAuthStore();
  await mutator(store);
  await writeAuthStore(store);
  return store;
}

export function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    twoFactorEnabled: user.twoFactor.enabled,
    passwordChangedAt: user.passwordChangedAt
  };
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const store = await readAuthStore();
  return store.users.find((user) => user.email === normalizedEmail) || null;
}

export async function findUserById(id: string) {
  const store = await readAuthStore();
  return store.users.find((user) => user.id === id) || null;
}
