"use client";

import GlowButton from "@/components/space/GlowButton";
import GlassCard from "@/components/space/GlassCard";
import { Check, Sparkles, Zap } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    price: "무료",
    period: "",
    tagline: "나를 이해하는 첫 걸음",
    accent: "border-white/12",
    glow: "",
    features: [
      "v2 설문 10문항 · 블루프린트",
      "6축 라이트 분석",
      "관계 기본 스냅샷",
      "결정 도우미 체험",
    ],
    cta: "지금 시작하기",
    href: "/",
    highlighted: false,
  },
  {
    id: "plus",
    name: "Explorer",
    price: "₩9,900",
    period: "/월",
    tagline: "관계까지 깊게 파고들기",
    accent: "border-[#8b9cff]/40",
    glow: "shadow-[0_0_40px_rgba(139,156,255,0.15)]",
    features: [
      "Starter 전체 포함",
      "관계 5탭 심화 리포트",
      "연인 탭 AI 스토리 확장",
      "우선 분석 큐",
    ],
    cta: "곧 출시",
    href: "/pricing",
    highlighted: true,
  },
  {
    id: "pro",
    name: "Navigator",
    price: "₩19,900",
    period: "/월",
    tagline: "결정까지 AI가 함께",
    accent: "border-[#34d399]/35",
    glow: "shadow-[0_0_40px_rgba(52,211,153,0.12)]",
    features: [
      "Explorer 전체 포함",
      "Decision AI 무제한",
      "개인 심화 에세이",
      "팀·가족 번들 할인",
    ],
    cta: "곧 출시",
    href: "/pricing",
    highlighted: false,
  },
] as const;

export default function PricingCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      {PLANS.map((plan) => (
        <article
          key={plan.id}
          className={[
            "relative flex flex-col overflow-hidden rounded-[24px] border bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1",
            plan.accent,
            plan.glow,
            plan.highlighted ? "ring-1 ring-[#8b9cff]/30" : "",
          ].join(" ")}
        >
          {plan.highlighted ? (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#8b9cff]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#a5b4fc]">
              <Zap className="h-3 w-3" />
              Popular
            </span>
          ) : null}

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            {plan.name}
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {plan.price}
            </span>
            {plan.period ? (
              <span className="text-sm text-white/45">{plan.period}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            {plan.tagline}
          </p>

          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <GlowButton
              href={plan.href}
              variant={plan.highlighted ? "primary" : "secondary"}
              className="w-full text-sm font-semibold"
            >
              {plan.cta}
            </GlowButton>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PricingHero() {
  return (
    <GlassCard className="!border-white/10 !bg-white/[0.03] text-center">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#CBB38E]">
        <Sparkles className="h-3.5 w-3.5" />
        Pricing
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
        나 · 관계 · 결정
        <br />
        <span className="text-white/55">필요한 만큼만 골라 쓰세요</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/55">
        무료로 시작하고, 관계 심화·Decision AI는 준비되는 대로 순차 오픈됩니다.
        결제 연동 전까지는 UI만 미리 볼 수 있어요.
      </p>
    </GlassCard>
  );
}
