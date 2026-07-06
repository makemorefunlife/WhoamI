"use client";

import { useState } from "react";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlassCard from "@/components/space/GlassCard";
import GlowButton from "@/components/space/GlowButton";
import {
  ArrowRight,
  Brain,
  GitCompare,
  MessageCircle,
  Scale,
  Sparkles,
} from "lucide-react";

const DECISION_CARDS = [
  {
    id: "quick",
    title: "빠른 선택",
    desc: "A vs B — 지금 당장 고민되는 두 옵션",
    icon: GitCompare,
    color: "text-[#6bb5ff]",
    border: "border-[#6bb5ff]/30",
  },
  {
    id: "values",
    title: "가치 정렬",
    desc: "내 축(에너지·연결·안정)과 맞는지 점검",
    icon: Brain,
    color: "text-[#a78bfa]",
    border: "border-[#a78bfa]/30",
  },
  {
    id: "relationship",
    title: "관계 맥락",
    desc: "상대와의 리듬을 고려한 결정",
    icon: MessageCircle,
    color: "text-[#f472b6]",
    border: "border-[#f472b6]/30",
  },
] as const;

const SAMPLE_PROMPTS = [
  "이직할까, 지금 자리에 남을까?",
  "연락을 먼저 할까, 기다릴까?",
  "이번 주말 약속 — 가도 될까?",
];

export default function DecisionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");

  return (
    <SpaceBackground showProbe={false}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(52,211,153,0.1),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(107,181,255,0.08),transparent_50%)]"
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20">
        <header className="text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6ee7b7]">
            <Scale className="h-3.5 w-3.5" />
            Decision AI
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
            결정 도우미
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
            선택장애를 위한 대화형 코치 UI입니다.
            <br />
            지금은 뼈대만 — 곧 블루프린트·관계 데이터와 연결됩니다.
          </p>
        </header>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {DECISION_CARDS.map((card) => {
            const Icon = card.icon;
            const active = selected === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                className={[
                  "rounded-2xl border bg-white/[0.03] p-4 text-left transition duration-200",
                  "hover:-translate-y-0.5 hover:bg-white/[0.05]",
                  active
                    ? `${card.border} ring-1 ring-white/10`
                    : "border-white/10",
                ].join(" ")}
              >
                <Icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.75} />
                <p className="mt-3 text-sm font-semibold text-white">
                  {card.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {card.desc}
                </p>
              </button>
            );
          })}
        </div>

        <GlassCard className="mt-8 !p-0 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-medium text-white/90">
              <Sparkles className="h-4 w-4 text-[#6ee7b7]" />
              무엇을 결정하고 싶어요?
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition hover:border-white/20 hover:text-white/90"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 퇴사 제안을 받았는데, 지금 옮기는 게 맞을까?"
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/35 focus:border-[#34d399]/40 focus:outline-none focus:ring-1 focus:ring-[#34d399]/25"
            />

            <GlowButton
              type="button"
              variant="primary"
              className="w-full text-sm font-semibold"
              onClick={() => {
                alert(
                  "Decision AI는 준비 중이에요. 곧 블루프린트 데이터와 연결됩니다.",
                );
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                분석 시작하기
                <ArrowRight className="h-4 w-4" />
              </span>
            </GlowButton>
          </div>

          <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#34d399]/15 text-xs">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/60">
                {selected
                  ? `「${DECISION_CARDS.find((c) => c.id === selected)?.title}」 모드로 답변을 준비할게요. 질문을 입력하고 시작해 보세요.`
                  : "위에서 결정 유형을 고른 뒤, 고민을 적어 주세요."}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </SpaceBackground>
  );
}
