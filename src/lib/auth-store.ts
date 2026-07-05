import bcrypt from "bcryptjs";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, getSupabaseAdminOrNull } from "@/lib/supabase";
import { validateStrongPassword } from "@/lib/password-policy";

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

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_version: number | null;
  session_version: number | null;
  password_changed_at: string | null;
  two_factor_enabled: boolean | null;
  two_factor_secret: string | null;
  created_at: string;
  updated_at: string;
};

type PasswordResetTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

type RecoveryCodeRow = {
  id: string;
  user_id: string;
  code_hash: string;
  used_at: string | null;
  created_at: string;
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

export async function createOrUpdateInitialAdmin() {
  const supabase = getSupabaseAdmin();
  const email = getInitialAdminEmail();
  const initialPassword = getInitialAdminPassword();
  validateStrongPassword(initialPassword);

  const { data: existingUser, error: existingError } = await supabase
    .from("admin_users")
    .select("id, password_version, session_version")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Supabase admin setup lookup failed: ${existingError.message}`);
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(initialPassword);

  if (existingUser) {
    const { error } = await supabase
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        password_version: Number(existingUser.password_version || 1) + 1,
        session_version: Number(existingUser.session_version || 1) + 1,
        password_changed_at: now,
        updated_at: now
      })
      .eq("id", existingUser.id);

    if (error) throw new Error(`Supabase admin setup update failed: ${error.message}`);
    return { created: false, email };
  }

  const { error } = await supabase.from("admin_users").insert({
    email,
    name: "Administrador A7-3DLAB",
    password_hash: passwordHash,
    password_version: 1,
    session_version: 1,
    password_changed_at: now,
    two_factor_enabled: false,
    two_factor_secret: null,
    updated_at: now
  });

  if (error) throw new Error(`Supabase admin setup insert failed: ${error.message}`);
  return { created: true, email };
}

function mapUserRow(
  row: AdminUserRow,
  resetTokens: PasswordResetTokenRow[],
  recoveryCodes: RecoveryCodeRow[]
): AuthUser {
  const twoFactorEnabled = Boolean(row.two_factor_enabled);
  const twoFactorSecret = row.two_factor_secret || undefined;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    passwordVersion: row.password_version || 1,
    sessionVersion: row.session_version || 1,
    passwordChangedAt: row.password_changed_at || row.updated_at,
    resetTokens: resetTokens.map((token) => ({
      id: token.id,
      tokenHash: token.token_hash,
      createdAt: token.created_at,
      expiresAt: token.expires_at,
      usedAt: token.used_at || undefined
    })),
    twoFactor: {
      enabled: twoFactorEnabled,
      secret: twoFactorEnabled ? twoFactorSecret : undefined,
      pendingSecret: !twoFactorEnabled ? twoFactorSecret : undefined,
      pendingSecretCreatedAt: !twoFactorEnabled && twoFactorSecret ? row.updated_at : undefined,
      enabledAt: twoFactorEnabled ? row.updated_at : undefined,
      recoveryCodes: recoveryCodes.map((code) => ({
        id: code.id,
        codeHash: code.code_hash,
        usedAt: code.used_at || undefined
      }))
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toAdminUserRow(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password_hash: user.passwordHash,
    password_version: user.passwordVersion,
    session_version: user.sessionVersion,
    password_changed_at: user.passwordChangedAt,
    two_factor_enabled: user.twoFactor.enabled,
    two_factor_secret: user.twoFactor.enabled
      ? user.twoFactor.secret || null
      : user.twoFactor.pendingSecret || null,
    updated_at: user.updatedAt || new Date().toISOString()
  };
}

async function readResetTokensForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Supabase password_reset_tokens read failed: ${error.message}`);
  return (data || []) as PasswordResetTokenRow[];
}

async function readRecoveryCodesForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("two_factor_recovery_codes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase two_factor_recovery_codes read failed: ${error.message}`);
  return (data || []) as RecoveryCodeRow[];
}

async function mapUserRowWithRelations(supabase: SupabaseClient, row: AdminUserRow) {
  const [resetTokens, recoveryCodes] = await Promise.all([
    readResetTokensForUser(supabase, row.id),
    readRecoveryCodesForUser(supabase, row.id)
  ]);

  return mapUserRow(row, resetTokens, recoveryCodes);
}

export async function readAuthStore() {
  const supabase = getSupabaseAdminOrNull();
  if (!supabase) return { users: [] } satisfies AuthStore;

  const { data: userRows, error: usersError } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });

  if (usersError) throw new Error(`Supabase admin_users read failed: ${usersError.message}`);
  if (!userRows?.length) return { users: [] };

  const userIds = userRows.map((user) => user.id);
  const { data: tokenRows, error: tokensError } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .in("user_id", userIds);

  if (tokensError) throw new Error(`Supabase password_reset_tokens read failed: ${tokensError.message}`);

  const { data: recoveryRows, error: recoveryError } = await supabase
    .from("two_factor_recovery_codes")
    .select("*")
    .in("user_id", userIds);

  if (recoveryError) throw new Error(`Supabase two_factor_recovery_codes read failed: ${recoveryError.message}`);

  return {
    users: (userRows as AdminUserRow[]).map((user) =>
      mapUserRow(
        user,
        ((tokenRows || []) as PasswordResetTokenRow[]).filter((token) => token.user_id === user.id),
        ((recoveryRows || []) as RecoveryCodeRow[]).filter((code) => code.user_id === user.id)
      )
    )
  } satisfies AuthStore;
}

export async function writeAuthStore(store: AuthStore) {
  const supabase = getSupabaseAdminOrNull();
  if (!supabase) throw new Error("Supabase is not configured for auth persistence.");
  if (store.users.length === 0) return;

  const userRows = store.users.map(toAdminUserRow);
  const { error: usersError } = await supabase.from("admin_users").upsert(userRows);
  if (usersError) throw new Error(`Supabase admin_users write failed: ${usersError.message}`);

  const userIds = store.users.map((user) => user.id);
  const { error: deleteTokensError } = await supabase
    .from("password_reset_tokens")
    .delete()
    .in("user_id", userIds);
  if (deleteTokensError) {
    throw new Error(`Supabase password_reset_tokens delete failed: ${deleteTokensError.message}`);
  }

  const tokenRows = store.users.flatMap((user) =>
    user.resetTokens.map((token) => ({
      id: token.id,
      user_id: user.id,
      token_hash: token.tokenHash,
      expires_at: token.expiresAt,
      used_at: token.usedAt || null,
      created_at: token.createdAt
    }))
  );

  if (tokenRows.length > 0) {
    const { error } = await supabase.from("password_reset_tokens").insert(tokenRows);
    if (error) throw new Error(`Supabase password_reset_tokens write failed: ${error.message}`);
  }

  const { error: deleteCodesError } = await supabase
    .from("two_factor_recovery_codes")
    .delete()
    .in("user_id", userIds);
  if (deleteCodesError) {
    throw new Error(`Supabase two_factor_recovery_codes delete failed: ${deleteCodesError.message}`);
  }

  const recoveryRows = store.users.flatMap((user) =>
    user.twoFactor.recoveryCodes.map((code) => ({
      id: code.id,
      user_id: user.id,
      code_hash: code.codeHash,
      used_at: code.usedAt || null
    }))
  );

  if (recoveryRows.length > 0) {
    const { error } = await supabase.from("two_factor_recovery_codes").insert(recoveryRows);
    if (error) throw new Error(`Supabase two_factor_recovery_codes write failed: ${error.message}`);
  }
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
  if (!normalizedEmail) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw new Error(`Supabase public.admin_users email lookup failed: ${error.message}`);
  if (!data) return null;

  return mapUserRowWithRelations(supabase, data as AdminUserRow);
}

export async function findUserById(id: string) {
  if (!id) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Supabase public.admin_users id lookup failed: ${error.message}`);
  if (!data) return null;

  return mapUserRowWithRelations(supabase, data as AdminUserRow);
}
