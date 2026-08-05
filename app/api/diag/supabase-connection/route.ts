import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createRouteSupabaseClient,
  supabaseConfigErrorResponse,
} from "@/lib/supabase/serverClient";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/supabase/env";
import {
  auditSupabaseEnvConfig,
  formatSupabaseEnvAudit,
} from "@/lib/security/supabaseEnvAudit";
import {
  probeSupabaseConnection,
  formatSupabaseConnectionProbeResult,
} from "@/lib/security/supabaseConnectionProbe";

export const runtime = "nodejs";

// The project ref the report_create_insert_failed incident expects
// Production to be using: https://gncjslondpvysjaytagd.supabase.co
const EXPECTED_SUPABASE_PROJECT_REF = "gncjslondpvysjaytagd";

/**
 * Read-only, authenticated diagnostic: audits the configured Supabase
 * URL/service-role key (structural facts + non-secret JWT claims only —
 * never the raw key) and runs one harmless head-count probe query.
 * Added to diagnose report_create_unknown_db_error after production
 * evidence showed the Supabase client's fallback empty-code error shape,
 * which points at a connection/config problem rather than a schema or
 * constraint violation. No schema, RLS, Clerk, Upstash, entitlement, or
 * Romantic changes.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const envAudit = auditSupabaseEnvConfig(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    EXPECTED_SUPABASE_PROJECT_REF,
  );
  console.error(
    "[diag-supabase-env]",
    ...formatSupabaseEnvAudit(envAudit),
    `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
  );

  const supabase = createRouteSupabaseClient();
  if (!supabase) return supabaseConfigErrorResponse();

  const probe = await probeSupabaseConnection(supabase);
  console.error(
    "[diag-supabase-probe]",
    ...formatSupabaseConnectionProbeResult(probe),
    `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
  );

  return NextResponse.json({
    envAudit,
    probe,
  });
}
