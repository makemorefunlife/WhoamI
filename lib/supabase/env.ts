/**
 * Supabase env — 클라이언트 번들에서는 `process.env.NEXT_PUBLIC_*`를
 * 정적 참조해야 Next.js가 값을 인라인합니다. 동적 `process.env[name]`은
 * 브라우저에서 undefined가 됩니다.
 */

function pickNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** 브라우저·공개 클라이언트용 URL */
export function getSupabaseUrl(): string | undefined {
  return pickNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    typeof window === "undefined" ? process.env.SUPABASE_URL : undefined,
  );
}

/** 서버 API 전용 service role key */
export function getSupabaseServiceRoleKey(): string | undefined {
  return pickNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type ServerSupabaseConfig = {
  url: string;
  serviceKey: string;
};

export function getServerSupabaseConfig(): ServerSupabaseConfig | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export function getMissingServerSupabaseEnvKeys(): string[] {
  const missing: string[] = [];
  if (!getSupabaseUrl()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!getSupabaseServiceRoleKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return missing;
}

