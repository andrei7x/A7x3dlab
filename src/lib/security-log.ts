import { getSupabaseAdminOrNull } from "@/lib/supabase";

type SecurityEvent = {
  type: string;
  email?: string;
  ip?: string;
  detail?: string;
  userId?: string;
  userAgent?: string;
};

export async function recordSecurityEvent(event: SecurityEvent) {
  const supabase = getSupabaseAdminOrNull();
  const entry = {
    type: event.type,
    user_id: event.userId || null,
    email: event.email || null,
    ip: event.ip || null,
    user_agent: event.userAgent || null
  };

  if (!supabase) {
    console.warn("[security-event]", { ...entry, detail: event.detail || null });
    return;
  }

  const { error } = await supabase.from("security_events").insert(entry);
  if (error) {
    console.warn("[security-event:failed]", error.message, { ...entry, detail: event.detail || null });
  }
}
