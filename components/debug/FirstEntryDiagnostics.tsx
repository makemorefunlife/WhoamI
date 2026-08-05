"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { maskId } from "@/lib/security/safeLog";
import { maskInviteToken } from "@/lib/security/inviteToken";

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

type AuthProbe = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null | undefined;
};

/**
 * 로컬 vs 프로덕션 첫 진입 비교용 클라이언트 로그.
 * 프로덕션에서 켜려면 Vercel에 NEXT_PUBLIC_DEBUG_FIRST_ENTRY=1 설정.
 * PII / tokens / full IDs are never logged.
 */
export default function FirstEntryDiagnostics(props: Props) {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!hasClerkKey) {
    return (
      <FirstEntryDiagnosticsInner
        {...props}
        auth={{ isLoaded: false, isSignedIn: false, userId: null }}
      />
    );
  }
  return <FirstEntryDiagnosticsWithClerk {...props} />;
}

function FirstEntryDiagnosticsWithClerk(props: Props) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  return (
    <FirstEntryDiagnosticsInner
      {...props}
      auth={{ isLoaded, isSignedIn, userId }}
    />
  );
}

function FirstEntryDiagnosticsInner({
  scope,
  extra,
  auth,
}: Props & { auth: AuthProbe }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, userId } = auth;

  useEffect(() => {
    if (!loggingEnabled()) return;

    const inviteTokenQuery = new URLSearchParams(window.location.search).get(
      "token",
    );
    let inviteTokenLocalStorage: string | null = null;
    let reportIdLocalStorage: string | null = null;
    try {
      inviteTokenLocalStorage = localStorage.getItem("inviteToken");
      reportIdLocalStorage = localStorage.getItem("reportId");
    } catch {
      inviteTokenLocalStorage = null;
      reportIdLocalStorage = null;
    }

    const supabaseUrl = getSupabaseUrl() ?? "";
    const host = (() => {
      try {
        return supabaseUrl ? new URL(supabaseUrl).host.slice(0, 24) : "(missing)";
      } catch {
        return "(invalid)";
      }
    })();

    console.info("[WhoamI:first-entry]", {
      scope,
      pathname,
      clerk: {
        isLoaded,
        isSignedIn,
        userId: userId ? maskId(userId) : null,
      },
      inviteTokenQuery: inviteTokenQuery
        ? maskInviteToken(inviteTokenQuery)
        : null,
      inviteTokenLocalStorage: inviteTokenLocalStorage
        ? maskInviteToken(inviteTokenLocalStorage)
        : null,
      reportIdLocalStorage: reportIdLocalStorage
        ? maskId(reportIdLocalStorage)
        : null,
      supabaseHostPrefix: host,
      extraKeys: extra ? Object.keys(extra) : [],
      ts: new Date().toISOString(),
    });
  }, [scope, pathname, isLoaded, isSignedIn, userId, extra]);

  return null;
}
