import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

/** 서버 API 전용 Supabase (service role — RLS bypass) */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createServiceRoleClient(url, serviceKey);
}
