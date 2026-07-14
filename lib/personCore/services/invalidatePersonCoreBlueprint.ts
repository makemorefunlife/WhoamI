import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerError } from "@/lib/security/safeLog";
import { getPersonCoreSupabase } from "../utils/getServerSupabase";

/**
 * `person_core_blueprints` — report_id 기준 스냅샷 DELETE (명시적 무효화).
 */
export async function invalidatePersonCoreBlueprint(
  reportId: string,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const rid = reportId.trim();
  if (!rid) return false;

  const client = supabase ?? getPersonCoreSupabase();
  const { error } = await client
    .from("person_core_blueprints")
    .delete()
    .eq("report_id", rid);

  if (error) {
    logServerError("personCore.invalidate", error, "db_update_failed");
    return false;
  }

  return true;
}
