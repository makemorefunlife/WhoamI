"use client";

import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
} from "@clerk/nextjs";

/** 홈 CTA — Clerk 공식 control 컴포넌트로 로드/실패 분기 */
export default function HomeClerkGate({
  children,
  failedFallback,
}: {
  children: React.ReactNode;
  failedFallback: React.ReactNode;
}) {
  return (
    <>
      <ClerkLoading>
        <div className="mt-8 text-sm text-white/55 sm:mt-10" aria-live="polite">
          불러오는 중…
        </div>
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
      <ClerkFailed>{failedFallback}</ClerkFailed>
    </>
  );
}
