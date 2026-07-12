"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseUrl } from "@/lib/supabase/env";

function loggingEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_FIRST_ENTRY === "1"
  );
}

type Props = {
  scope: string;
  extra?: Record<string, unknown>;
};

/**
 * 로컬 vs 프로덕션 첫 진입 비교용 클라이언트 로그.
 * 프로덕션에서 켜려면 Vercel에 NEXT_PUBLIC_DEBUG_FIRST_ENTRY=1 설정.
 */
export default function FirstEntryDiagnostics({ scope, extra }: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!loggingEnabled()) return;

    const href = window.location.href;
    const inviteTokenQuery =
      new URLSearchParams(window.location.search).get("token");
    let inviteTokenLocalStorage: string | null = null;
    let reportIdLocalStorage: string | null = null;
    try {
      inviteTokenLocalStorage = localStorage.getItem("inviteToken");
      reportIdLocalStorage = localStorage.getItem("reportId");
    } catch {
      inviteTokenLocalStorage = "(localStorage_read_error)";
      reportIdLocalStorage = "(localStorage_read_error)";
    }

    const supabaseUrl = getSupabaseUrl() ?? "(missing)";

    console.info("[WhoamI:first-entry]", {
      scope,
      activeRendered: scope,
      pathname,
      href,
      clerk: {
        isLoaded,
        isSignedIn,
        userId: userId ?? null,
      },
      inviteTokenQuery,
      inviteTokenLocalStorage,
      reportIdLocalStorage,
      supabaseUrlPrefix: supabaseUrl.slice(0, 48),
      ...extra,
      ts: new Date().toISOString(),
    });
  }, [scope, pathname, isLoaded, isSignedIn, userId, extra]);

  return null;
}
