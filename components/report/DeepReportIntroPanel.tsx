import { ArrowRight, Check, Wand2 } from "lucide-react";
import GlowButton from "@/components/space/GlowButton";

export default function DeepReportIntroPanel({
  onContinue,
  onBackToResult,
}: {
  onContinue: () => void;
  onBackToResult: () => void;
}) {
  return (
    <div className="space-y-6 px-0.5 py-1 sm:space-y-7">
      <header className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--space-sub)]">
          Deep report
        </p>
        <h2 className="text-balance text-lg font-semibold leading-relaxed text-[var(--space-text)] sm:text-xl">
          <span className="block">지금까지 본 건 현재의 흐름이었어.</span>
          <span className="mt-2 block sm:mt-2.5">
            이제 진짜 &apos;내면의 나&apos;를 만나봐.
          </span>
        </h2>
      </header>

      <div className="rounded-2xl border border-[var(--space-border)] bg-[var(--space-card)]/55 px-4 py-4 sm:px-5">
        <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--space-text-muted)]">
          핵심 리포트가 이어지는 방식
        </p>
        <div className="flex flex-col items-center gap-2 text-[13px] leading-snug text-[var(--space-text)] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-1 sm:gap-y-1 sm:text-sm">
          <span className="font-medium">기존 설문</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-medium">추가 설문(준비중)</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#67B7FF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-medium">행동 패턴·기질</span>
          <ArrowRight
            className="hidden h-4 w-4 shrink-0 text-[#8B7CFF] sm:inline"
            strokeWidth={2}
            aria-hidden
          />
          <span className="text-white/35 sm:hidden">→</span>
          <span className="font-semibold text-[#FFD6A5]">통합 핵심 리포트</span>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-[var(--space-text-muted)]">
          설문으로 읽힌 지금의 흐름과, 출생 맥락에서 정리되는 행동 패턴·기질이
          한 줄기로 엮여 하나의 리포트로 전달돼요.
        </p>
      </div>

      <div className="space-y-8 border-t border-[var(--space-border)] pt-6">
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--space-text)]">
            <Wand2 className="h-4 w-4 text-[#8eb8ff]" strokeWidth={1.75} />
            포함 내용
          </h3>
          <ul className="space-y-3 text-[15px] leading-relaxed text-[var(--space-text-muted)]">
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>방금 진행한 설문을 바탕으로 한 심화 분석</span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                행동 패턴과 타고난 기질을 한데 모은 통합 핵심 리포트
              </span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                1년간 분기별·월별 업데이트
                <span className="mt-1.5 block text-[13px] text-white/55">
                  · 분기별 행동 가이드
                  <br />· 월별 변화에 따른 관계 방향 조언
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <Check
                className="mt-0.5 h-5 w-5 shrink-0 text-[#67B7FF]"
                strokeWidth={2}
              />
              <span>
                앞으로 더해지는 개인 분석 도구 업데이트는 추가 비용 없이 이용
              </span>
            </li>
          </ul>
        </section>

        <div className="rounded-2xl border border-[#ffd6a5]/25 bg-gradient-to-br from-[#ffd6a5]/[0.08] to-transparent px-4 py-4 sm:px-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--space-text)]">
            가격 및 환불 정책
          </h3>
          <p className="text-lg font-semibold tracking-tight text-[#ffe8cc] sm:text-xl">
            ₩9,900 / 1년
          </p>
          <p className="mt-0.5 text-xs text-[var(--space-text-muted)]">
            일회성 결제
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--space-text-muted)]">
            <li className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd4a8]"
                strokeWidth={2}
              />
              <span>안전한 결제</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#8fd4a8]"
                strokeWidth={2}
              />
              <span>결제 후 7일 이내 미사용 시 전액 환불</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <GlowButton
            type="button"
            variant="primary"
            className="w-full !min-h-[52px] text-[0.9375rem] font-semibold"
            onClick={onContinue}
          >
            지금 바로 핵심 리포트 받기
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            onClick={onBackToResult}
            className="w-full !min-h-[46px] text-sm font-medium"
          >
            결과 화면으로 돌아가기
          </GlowButton>
        </div>
      </div>
    </div>
  );
}
