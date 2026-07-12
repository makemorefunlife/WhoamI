import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getMissingBrowserSupabaseEnvKeys,
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

/** 브라우저에서 호출 시점에 env를 읽어 Supabase 클라이언트를 생성합니다. */
export function getSupabaseBrowserClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    const missing = getMissingBrowserSupabaseEnvKeys();
    throw new Error(
      missing.length > 0
        ? `Supabase client env missing: ${missing.join(", ")}`
        : "Supabase client env is not configured",
    );
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

/** @deprecated getSupabaseBrowserClient() 사용 권장 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
