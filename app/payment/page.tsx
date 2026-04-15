"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import TossPaymentFlow from "@/components/TossPaymentFlow";

function PaymentFallback() {
  return (
    <SpaceBackground>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5">
        <p className="text-sm text-[var(--space-text-muted)]">불러오는 중…</p>
      </div>
    </SpaceBackground>
  );
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId") || "";

  if (!reportId) {
    return (
      <SpaceBackground>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-12">
          <GlassCard className="w-full max-w-md space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--space-border)] bg-[var(--space-card)]">
              <Sparkles className="h-7 w-7 text-[#8eb8ff]" strokeWidth={1.5} />
            </div>
            <p className="text-sm leading-relaxed text-[var(--space-text-muted)]">
              결제할 탐사 기록이 없어요. 무료 결과 화면 하단에서
              &apos;지금 분석하기&apos;를 눌러 주세요.
            </p>
            <Link
              href="/"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[var(--space-border)] bg-white/[0.06] py-3 text-sm font-medium text-[var(--space-text)] transition hover:bg-white/[0.09]"
            >
              홈으로
            </Link>
          </GlassCard>
        </div>
      </SpaceBackground>
    );
  }

  return (
    <SpaceBackground>
      <div className="relative z-10 min-h-screen px-5 py-10 pb-16">
        <div className="mx-auto max-w-md space-y-6">
          <header className="space-y-1 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
              Deep report
            </p>
            <h1 className="text-balance text-xl font-semibold leading-relaxed text-[var(--space-text)] sm:text-2xl">
              <span className="block">지금까지 본 건 현재의 흐름이었어.</span>
              <span className="mt-2 block sm:mt-2.5">
                이제 진짜 &apos;내면의 나&apos;를 만나봐.
              </span>
            </h1>
          </header>

          <div className="rounded-2xl border border-[var(--space-border)] bg-[var(--space-card)]/55 px-4 py-4 sm:px-5">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--space-text-muted)]">
              유료 통합 리포트 구성
            </p>
            <div className="flex flex-col items-center gap-2 text-[13px] leading-snug text-[var(--space-text)] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-1 sm:gap-y-1 sm:text-sm">
              <span className="font-medium">18문항 세부 해석</span>
              <ArrowRight
                className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-white/35 sm:hidden">→</span>
              <span className="font-medium">사주 기질</span>
              <ArrowRight
                className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-white/35 sm:hidden">→</span>
              <span className="font-medium">점성학 맥락</span>
              <ArrowRight
                className="hidden h-4 w-4 shrink-0 text-[#8B7CFF] sm:inline"
                strokeWidth={2}
                aria-hidden
              />
              <span className="text-white/35 sm:hidden">→</span>
              <span className="font-semibold text-[#FFD6A5]">최종 통합 리포트</span>
            </div>
            <p className="mt-3 text-center text-xs leading-relaxed text-[var(--space-text-muted)]">
              세 가지 층이 한 흐름으로 엮여, 지금의 너와 타고난 기질이 만나는
              한 편의 리포트로 전달돼요.
            </p>
          </div>

          <GlassCard className="!bg-[rgba(12,18,32,0.72)] !shadow-[0_24px_80px_rgba(0,0,0,0.45)] space-y-8">
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--space-text)]">
                <Wand2 className="h-4 w-4 text-[#8eb8ff]" strokeWidth={1.75} />
                포함 내용
              </h2>
              <ul className="space-y-3 text-[15px] leading-relaxed text-[var(--space-text-muted)]">
                <li className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                    strokeWidth={2}
                  />
                  <span>
                    방금 진행한 설문을 기반으로, 현재의 너를 더 깊이
                    분석하고
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                    strokeWidth={2}
                  />
                  <span>
                    사주와 점성학으로 타고난 기질까지 통합한 &apos;진짜
                    나&apos; 리포트를 제공
                  </span>
                </li>
                <li className="flex gap-3">
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                    strokeWidth={2}
                  />
                  <span>
                    앞으로 추가되는 모든 분석 툴도 추가 비용 없이 이용 가능
                  </span>
                </li>
              </ul>
            </section>

            <section
              className="rounded-2xl border border-[#FFD6A5]/25 bg-gradient-to-br from-[#FFD6A5]/[0.09] to-[#8B7CFF]/[0.06] p-5"
              aria-labelledby="benefit-title"
            >
              <h2
                id="benefit-title"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#FFD6A5]"
              >
                <Gift className="h-4 w-4" strokeWidth={1.75} />
                특별 혜택
              </h2>
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--space-text)]">
                <li className="flex gap-2">
                  <Users
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#8eb8ff]"
                    strokeWidth={1.75}
                  />
                  <span>친구 1명 초대권</span>
                </li>
                <li className="pl-6 text-[13px] text-[var(--space-text-muted)]">
                  초대 링크를 보내면 상대방도 무료로 개인 분석을 받고, 나와의
                  관계 분석 리포트까지 제공
                </li>
              </ul>
            </section>

            <div className="border-t border-[var(--space-border)] pt-6">
              <TossPaymentFlow requireReportId variant="product" />
            </div>
          </GlassCard>

          <p className="text-center text-xs text-[var(--space-text-muted)]">
            <Link
              href={`/result?id=${encodeURIComponent(reportId)}`}
              className="underline underline-offset-2 transition hover:text-[var(--space-text)]"
            >
              결과 화면으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </SpaceBackground>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
