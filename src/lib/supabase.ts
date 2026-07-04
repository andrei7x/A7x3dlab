import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabasePublicEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function hasSupabaseAdminEnv() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function createSupabasePublicClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public envs are missing.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabasePublic = hasSupabasePublicEnv() ? createSupabasePublicClient() : null;

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be used in the browser.");
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase server envs are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
}

export function getSupabaseAdminOrNull() {
  return hasSupabaseAdminEnv() ? getSupabaseAdmin() : null;
}
