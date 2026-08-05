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
import {
  compareRawFetchAndSupabaseJs,
  formatRawFetchProbeResult,
} from "@/lib/security/rawSupabaseFetchProbe";

export const runtime = "nodejs";

// The project ref the report_create_insert_failed incident expects
// Production to be using: https://gncjslondpvysjaytagd.supabase.co
const EXPECTED_SUPABASE_PROJECT_REF = "gncjslondpvysjaytagd";

/**
 * Read-only, authenticated diagnostic: audits the configured Supabase
 * URL/service-role key (structural facts + non-secret JWT claims only —
 * never the raw key), runs the supabase-js head-count probe, and — since
 * that probe failed with the same empty-code fallback shape as the
 * original incident even against a proven-correct URL/key pair — also
 * runs a raw fetch() probe that bypasses supabase-js entirely, to recover
 * the underlying network error's cause (DNS/TCP/TLS/timeout) that
 * supabase-js's error wrapper discards. No schema, RLS, Clerk, Upstash,
 * entitlement, or Romantic changes.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  const envAudit = auditSupabaseEnvConfig(
    url,
    key,
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

  let comparison: Awaited<ReturnType<typeof compareRawFetchAndSupabaseJs>> | null =
    null;
  if (url && key) {
    comparison = await compareRawFetchAndSupabaseJs(url, key, probe);
    console.error(
      "[diag-supabase-raw-fetch]",
      ...formatRawFetchProbeResult(comparison.rawFetch),
      `verdict=${comparison.verdict}`,
      `region=${process.env.VERCEL_REGION ?? "none"}`,
      `sha=${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}`,
    );
  }

  return NextResponse.json({
    envAudit,
    probe,
    rawFetch: comparison?.rawFetch ?? null,
    verdict: comparison?.verdict ?? null,
    region: process.env.VERCEL_REGION ?? null,
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  });
}
