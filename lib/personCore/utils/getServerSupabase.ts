import type { SupabaseClient } from "@supabase/supabase-js";
import { PersonCoreError } from "../errors";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

/** PersonCore 서비스 — service role 전용 Supabase */
export function getPersonCoreSupabase(): SupabaseClient {
  const client = createServerSupabaseClient();
  if (!client) {
    throw new PersonCoreError(
      "supabase_unconfigured",
      "서버 Supabase 설정이 필요합니다.",
    );
  }
  return client;
}
