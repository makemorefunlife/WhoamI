import { createClient } from "@supabase/supabase-js";

/**
 * 서버 API에서만 사용: 서비스 롤 키로 Supabase 클라이언트 생성.
 * 호출부에서 env 유효성 검사 후 url·serviceKey를 넘긴다.
 */
export function createServiceRoleClient(url: string, serviceKey: string) {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
