"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAppSession } from "@/lib/routing/useAppSession";
import { ROUTES } from "@/constants/routes";

/**
 * 프리미엄 전용 콘텐츠 가드.
 * 추후 결제 연동 시 이 컴포넌트로 프리미엄 페이지만 감싼다.
 */
export default function PremiumGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isPremium, refreshing, isSignedIn } = useAppSession({
    hydrate: false,
  });

  if (refreshing && !isPremium) {
    return (
      fallback ?? (
        <p className="py-8 text-center text-sm text-on-surface-variant">
          확인 중…
        </p>
      )
    );
  }

  if (!isSignedIn || !isPremium) {
    return (
      fallback ?? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 px-5 py-8 text-center">
          <p className="text-sm text-on-surface-variant">
            프리미엄 기능입니다. 결제 후 이용할 수 있어요.
          </p>
          <Link
            href={ROUTES.pricing}
            className="stitch-cta-primary mt-4 inline-block !min-w-0 !px-6 !py-2.5 !text-sm"
          >
            요금제 보기
          </Link>
        </div>
      )
    );
  }

  return <>{children}</>;
}
