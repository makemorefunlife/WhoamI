import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMissingServerSupabaseEnvKeys,
  getServerSupabaseConfig,
} from "@/lib/supabase/env";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const SERVER_SUPABASE_CONFIG_ERROR = "서버 Supabase 설정이 필요합니다.";

/** 서버 API 전용 Supabase (service role — RLS bypass) */
export function createServerSupabaseClient(): SupabaseClient | null {
  const config = getServerSupabaseConfig();
  if (!config) return null;
  return createServiceRoleClient(config.url, config.serviceKey);
}

/** API 라우트 공통 — env 누락 시 500 응답 */
export function supabaseConfigErrorResponse(): NextResponse {
  const missing = getMissingServerSupabaseEnvKeys();
  if (missing.length > 0) {
    console.error("[supabase] missing server env:", missing.join(", "));
  }
  return NextResponse.json(
    { error: SERVER_SUPABASE_CONFIG_ERROR },
    { status: 500 },
  );
}

/** API 라우트 공통 — 설정 OK면 클라이언트, 아니면 null */
export function createRouteSupabaseClient(): SupabaseClient | null {
  return createServerSupabaseClient();
}
