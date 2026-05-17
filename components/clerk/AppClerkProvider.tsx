"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { useMemo } from "react";

/**
 * 로컬 개발: 광고 차단 등으로 clerk.accounts.dev 스크립트가 막힐 때
 * middleware frontendApiProxy + proxyUrl 로 같은 출처(/__clerk) 경유.
 */
function resolveClerkProxyUrl(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/?$/, "/");

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    return `${window.location.origin}/__clerk/`;
  }

  return undefined;
}

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const proxyUrl = useMemo(() => resolveClerkProxyUrl(), []);

  return (
    <ClerkProvider afterSignOutUrl="/" ui={ui} proxyUrl={proxyUrl}>
      {children}
    </ClerkProvider>
  );
}
