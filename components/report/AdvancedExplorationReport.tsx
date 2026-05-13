"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";

type AdvancedExplorationReportProps = {
  fallbackName?: string;
  /** 향후 실데이터 연결용 — 현재 UI에서는 사용하지 않음 */
  reportText?: string;
};

function buildDisplayTitle(name: string) {
  if (!name) return "나의";
  return `${name}님의`;
}

function getInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "나";
  return trimmed.slice(0, 1).toUpperCase();
}

const PART_1_SCROLL_IDS = new Set([
  "part1",
  "part1-quote",
  "part1-strengths",
  "part1-caution",
  "part1-signature",
  "part1-next",
]);

const PART_2_SCROLL_IDS = new Set([
  "part2",
  "part2-source",
  "part2-drain",
  "part2-rhythm",
  "part2-flow",
]);

const PART_3_SCROLL_IDS = new Set([
  "part3",
  "part3-pattern",
  "part3-comfort",
  "part3-discomfort",
  "part3-words",
  "part3-balance",
]);

const PART_4_SCROLL_IDS = new Set([
  "part4",
  "part4-rules",
  "part4-dialogue",
  "part4-calm",
  "part4-boundary",
  "part4-close",
]);

const PART_5_SCROLL_IDS = new Set([
  "part5",
  "part5-remember",
  "part5-direction",
  "part5-close",
  "part5-checklist",
]);

const part1LabelClass = "text-[10px] font-semibold tracking-[0.18em] text-[#9F8BCF]";
const part1MainTitleClass =
  "mt-3 whitespace-nowrap text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.035em] text-[#F5F3FA] sm:text-[1.48rem]";
const part1SectionTitleClass =
  "flex items-center gap-3 text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-[#ECEEF4]";
/** 이전 빌드·캐시 호환용 (part1SectionTitleClass와 동일) */
const part1SectionHeadingClass = part1SectionTitleClass;
const part1BodyClass = "text-[14px] leading-[2.02] tracking-[-0.01em] text-[#A7B2C5]";
const part1CaptionClass = "text-[11px] leading-[1.9] tracking-[0.01em] text-[#707C92]";
const part1PanelClass =
  "mt-5 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6";
const part1GroupedPanelClass =
  "mt-8 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-5 py-3";
const part2LabelClass = "text-[10px] font-semibold tracking-[0.18em] text-[#86AFCB]";
const part2MainTitleClass =
  "mt-3 whitespace-nowrap text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.035em] text-[#F4F8FB] sm:text-[1.48rem]";
const part2SubtitleClass = "max-w-[20rem] text-[12px] leading-[1.95] tracking-[0.01em] text-[#84A0B6]";
const part2SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#7DD3FC]/20 bg-[#38BDF8]/[0.08]";
const part2GlyphClass = "h-4 w-4 text-[#B7D7E9]";
const part2PanelClass =
  "mt-5 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6";
const part2GroupedPanelClass =
  "mt-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.015))] px-5 py-3";
const part3LabelClass = "text-[10px] font-semibold tracking-[0.18em] text-[#C693A8]";
const part3MainTitleClass =
  "mt-3 whitespace-nowrap text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.035em] text-[#FAF3F7] sm:text-[1.48rem]";
const part3SubtitleClass = "max-w-[20rem] text-[12px] leading-[1.95] tracking-[0.01em] text-[#B98EA1]";
const part3SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F2B8C6]/18 bg-[#FB7185]/[0.08]";
const part3GlyphClass = "h-4 w-4 text-[#E7C2CC]";
const part3PanelClass =
  "mt-5 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6";
const part3GroupedPanelClass =
  "mt-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.015))] px-5 py-3";
const part4LabelClass = "text-[10px] font-semibold tracking-[0.18em] text-[#8DB5B6]";
const part4MainTitleClass =
  "mt-3 whitespace-nowrap text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.035em] text-[#F4FAF9] sm:text-[1.48rem]";
const part4SubtitleClass = "max-w-[21rem] text-[12px] leading-[1.95] tracking-[0.01em] text-[#8FAEB0]";
const part4SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#8DD3C7]/18 bg-[#5EEAD4]/[0.08]";
const part4GlyphClass = "h-4 w-4 text-[#BFE3DD]";
const part4PanelClass =
  "mt-5 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(94,234,212,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6";
const part4GroupedPanelClass =
  "mt-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.1),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.015))] px-5 py-3";
const part5LabelClass = "text-[10px] font-semibold tracking-[0.18em] text-[#C7B38A]";
const part5MainTitleClass =
  "mt-3 whitespace-nowrap text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.035em] text-[#FBF8F1] sm:text-[1.48rem]";
const part5SubtitleClass = "max-w-[21rem] text-[12px] leading-[1.95] tracking-[0.01em] text-[#B8A789]";
const part5SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E7D2A8]/18 bg-[#F4D58D]/[0.08]";
const part5GlyphClass = "h-4 w-4 text-[#E6D6B5]";
const part5PanelClass =
  "mt-5 rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(244,213,141,0.11),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6";
const part5GroupedPanelClass =
  "mt-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(196,181,253,0.1),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.015))] px-5 py-3";

const part1SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#A78BFA]/22 bg-[#8B5CF6]/[0.08]";

/** 한 세트의 마이크로 일러스트 — 동일 stroke·캡·파스텔, 섹션별 미묘한 cue만 다름 */
type Part1SectionGlyphKind =
  | "quoteSparkle"
  | "gentleSparkle"
  | "orbitRipple"
  | "sparkleCluster"
  | "softCaution"
  | "compassMinimal"
  | "energyBloom"
  | "driftDown"
  | "orbitField"
  | "tideGauge"
  | "bondOrbit"
  | "warmHalo"
  | "softTension"
  | "dualEcho"
  | "balanceOrbit"
  | "speechRipple"
  | "softDialogue"
  | "calmOrbit"
  | "boundaryRing"
  | "openOrbit"
  | "forwardOrbit"
  | "horizonGlow"
  | "checkOrbit";

type NavigatorGlyphKind =
  | "self"
  | "energy"
  | "relationship"
  | "communication"
  | "guidance";

const GLYPH_SVG_CLASS = "h-4 w-4 text-[#C9C0F0]";

const PART2_ENERGY_SOURCES = [
  {
    title: "사람들과 깊게 연결될 때",
    body:
      "아이디어를 나누고 감정을 주고받는 순간, 당신의 에너지는 자연스럽게 살아나요. 대화의 온기가 곧 창의력의 불씨가 됩니다.",
  },
  {
    title: "자연의 숨을 따라 걸을 때",
    body:
      "바람과 나무의 향기를 느끼며 잠시 속도를 늦추면, 마음은 평온을 되찾고 안쪽의 열정도 천천히 다시 돌아와요.",
  },
  {
    title: "창작에 몰입하는 시간",
    body:
      "디자인이나 사회적 프로젝트처럼 아이디어를 손으로 옮기는 시간은 당신에게 큰 만족을 줘요. 몰입할수록 에너지도 더 또렷해집니다.",
  },
] as const;

const PART2_DRAIN_PATTERNS = [
  {
    title: "모든 책임을 한꺼번에 안을 때",
    body:
      "해야 할 일을 모두 품으려는 순간, 당신의 흐름은 빠르게 무거워질 수 있어요. 먼저 우선순위를 나누는 것만으로도 에너지는 조금 가벼워집니다.",
  },
  {
    title: "타인의 감정을 오래 붙들고 있을 때",
    body:
      "누군가의 마음을 세심하게 읽는 일은 당신의 장점이지만, 그 감정을 너무 오래 품고 있으면 정작 내 마음은 뒤로 밀려날 수 있어요.",
  },
  {
    title: "작은 갈등이 오래 남을 때",
    body:
      "사람 사이의 균열은 생각보다 깊은 잔상을 남겨요. 바로 해결하려 하기보다, 한 발 물러서서 호흡을 정리하는 시간이 도움이 됩니다.",
  },
] as const;

const PART2_SUPPORTIVE_RHYTHMS = [
  {
    title: "함께 목표를 만드는 환경",
    body:
      "사람들과 소통하고 협업하는 과정에서 당신의 강점은 더 또렷하게 살아나요. 연결 속에서 에너지가 자연스럽게 순환합니다.",
  },
  {
    title: "감정이 존중되는 분위기",
    body:
      "서로의 마음을 함부로 밀어붙이지 않는 환경일수록 당신은 더 편안하게 성장해요. 안정된 공기는 당신에게 가장 좋은 리듬이 됩니다.",
  },
  {
    title: "혼자 탐구할 수 있는 독립적인 시간",
    body:
      "아이디어를 천천히 파고들고 창작에 잠길 수 있는 고요한 시간이 있어야 에너지의 균형이 돌아옵니다. 혼자 있는 시간도 당신에게는 중요한 충전이에요.",
  },
] as const;

const PART2_ENERGY_FLOW = [
  { label: "사람·관계에 쓰는 에너지", value: 80 },
  { label: "나에게 돌아오는 에너지", value: 40 },
  { label: "혼자 재충전하는 시간", value: 20 },
] as const;

const PART3_COMFORT_CONNECTIONS = [
  {
    title: "감정을 안정적으로 표현하는 사람",
    body:
      "스스로의 마음을 숨기지 않고 차분히 전하는 사람과 함께할 때, 당신도 자연스럽게 긴장을 풀고 깊은 연결을 느껴요.",
  },
  {
    title: "긍정과 유머를 잃지 않는 사람",
    body:
      "가벼운 웃음과 밝은 시선을 가진 사람은 당신의 에너지를 부드럽게 끌어올려 줘요. 함께 있는 시간이 더 따뜻하게 기억됩니다.",
  },
  {
    title: "열린 마음으로 소통하는 사람",
    body:
      "생각과 아이디어를 편견 없이 받아들이는 사람과는 대화 자체가 편안한 흐름이 돼요. 당신의 말도 더 자연스럽게 살아납니다.",
  },
] as const;

const PART3_DISCOMFORT_FLOWS = [
  {
    title: "비판이 먼저 앞서는 대화",
    body:
      "지나치게 부정적이거나 비판적인 태도는 당신의 에너지를 빠르게 소모시켜요. 대화의 공기가 무거워질수록 마음도 쉽게 움츠러들 수 있어요.",
  },
  {
    title: "감정이 닫혀 있는 관계",
    body:
      "감정 표현이 너무 적은 사람과의 소통에서는 서로를 읽기 어려워져요. 이해받지 못한다는 느낌이 쌓이면 관계도 쉽게 멀어질 수 있어요.",
  },
  {
    title: "한쪽 의견만 남는 흐름",
    body:
      "고집이 세고 자신의 의견만 고수하는 사람과의 관계는 당신에게 스트레스로 남기 쉬워요. 생각이 무시되는 순간, 연결감도 빠르게 약해집니다.",
  },
] as const;

const PART3_WORD_PAIRS = [
  {
    hurt: "너는 항상 그렇게 생각해?",
    support: "너의 생각이 정말 흥미롭네.",
  },
  {
    hurt: "왜 이렇게 감정적이야?",
    support: "너의 감정을 이해하려고 해.",
  },
  {
    hurt: "그건 별로야.",
    support: "그 아이디어도 나쁘지 않은 것 같아.",
  },
] as const;

const PART4_COMMUNICATION_PRINCIPLES = [
  {
    title: "감정을 존중하며 듣는 대화",
    body:
      "상대의 말을 서둘러 정리하기보다, 먼저 그 감정이 어떤 결인지 들어보는 태도가 관계를 부드럽게 만들어요.",
  },
  {
    title: "내 마음도 숨기지 않는 솔직함",
    body:
      "감정을 참는 것이 평화를 만드는 건 아니에요. 차분하게 표현된 진심은 오히려 서로를 더 깊이 이해하게 해줘요.",
  },
  {
    title: "불편할 때는 숨 쉴 틈을 만드는 것",
    body:
      "대화가 무거워질수록 잠시 다른 주제로 옮겨가거나 속도를 늦추는 선택이 필요해요. 여백은 관계를 지키는 방식이기도 해요.",
  },
  {
    title: "긍정적인 피드백을 남기는 습관",
    body:
      "상대의 생각이나 감정에 따뜻하게 반응하는 말 한마디는 연결의 밀도를 바꿔요. 관계는 그런 작은 신호로 깊어집니다.",
  },
] as const;

const PART4_DIALOGUE_REFRAINS = [
  {
    context: "친구가 힘들어할 때",
    before: "내가 어떻게 도와줄까?",
    after: "너의 기분을 이해해. 어떤 도움이 필요할까?",
  },
  {
    context: "갈등이 생겼을 때",
    before: "그냥 나 혼자 해결할게.",
    after: "우리 함께 해결책을 찾아보자.",
  },
  {
    context: "상대방이 나를 무시할 때",
    before: "내가 왜 무시당하지?",
    after: "그럴 수도 있겠지만, 내 생각도 중요해.",
  },
] as const;

const PART4_CALMING_FLOWS = [
  {
    title: "한 발 물러서서 바라보기",
    body:
      "감정이 빠르게 올라올 때는 바로 반응하기보다, 상황을 조금 떨어져서 보는 시간이 필요해요. 그 짧은 거리감이 마음을 다시 정리해 줍니다.",
  },
  {
    title: "상대의 기분까지 함께 고려하며 말하기",
    body:
      "솔직함은 중요하지만, 감정이 격한 순간일수록 표현의 속도와 톤을 낮추는 것이 관계를 더 안전하게 지켜줘요.",
  },
  {
    title: "잠시 멈추고 숨을 고르는 선택",
    body:
      "상황이 지나치게 감정적으로 흐를 때는 대화를 잠깐 멈추는 것도 괜찮아요. 깊은 호흡 한 번이 불필요한 상처를 줄여줄 수 있어요.",
  },
] as const;

const PART4_BOUNDARY_SIGNALS = [
  {
    title: "반복해서 상처를 남기는 말과 행동",
    body:
      "상대의 말이나 태도가 계속 마음을 다치게 한다면, 그 관계를 다시 바라볼 필요가 있어요. 참는 것보다 먼저 스스로를 보호해야 해요.",
  },
  {
    title: "내 감정이 계속 소진되고 있다는 느낌",
    body:
      "함께한 뒤마다 지나치게 지치고 공허해진다면, 그 관계는 당신의 에너지를 너무 많이 가져가고 있을 수 있어요.",
  },
  {
    title: "대화가 늘 부정적이고 무거울 때",
    body:
      "만날 때마다 스트레스와 긴장만 남는 관계라면, 거리두기나 정리를 고려하는 것도 건강한 선택이에요. 관계를 지키는 일보다 나를 지키는 일이 먼저일 수 있어요.",
  },
] as const;

const PART5_REMINDERS = [
  {
    title: "너의 창의력과 독창성",
    body:
      "당신의 아이디어와 생각은 예상보다 더 멀리 닿을 수 있어요. 자연스럽게 떠오르는 시선과 감각이 누군가에게는 작은 영감이 되기도 해요.",
  },
  {
    title: "타인의 감정을 이해하는 마음",
    body:
      "감정적으로 민감하다는 것은 쉽게 흔들린다는 뜻만은 아니에요. 누군가의 마음을 깊이 읽고 관계를 다정하게 이어갈 수 있는 힘이기도 해요.",
  },
  {
    title: "스스로를 돌보는 감각",
    body:
      "감정적으로 힘든 순간이 와도, 결국 당신을 가장 오래 지켜주는 것은 자기 관리의 감각이에요. 나를 잘 돌보는 일이 곧 삶의 균형을 지켜줘요.",
  },
] as const;

const PART5_DIRECTIONS = [
  {
    title: "감정을 조금 더 자주 표현해보기",
    body:
      "마음을 다양한 방식으로 나누는 연습은 관계를 억지로 넓히기보다, 지금 있는 연결을 더 깊게 만들어줄 수 있어요.",
  },
  {
    title: "상대의 감정보다 내 마음도 먼저 살피기",
    body:
      "누군가의 기분에 쉽게 닿는 사람일수록, 내 감정이 어디쯤 와 있는지 먼저 확인하는 시간이 필요해요. 그 균형이 당신을 더 편안하게 지켜줄 거예요.",
  },
  {
    title: "새로운 연결을 가볍게 열어두기",
    body:
      "새로운 사람들과의 만남은 거창한 변화가 아니라, 당신의 세계를 조금 더 넓히는 방식일 수 있어요. 가벼운 대화 하나도 충분한 시작이 됩니다.",
  },
] as const;

const PART5_CHECKLIST = [
  "하루에 10분씩 나의 감정을 기록해보기",
  "친구와의 대화에서 긍정적인 피드백 주기",
  "자연 속에서 재충전하는 시간을 가지기",
  "상대방의 감정을 존중하며 경청하기",
  "갈등이 생겼을 때 함께 해결책 찾기",
  "내 감정을 솔직하게 표현하기",
  "불편한 관계에서 한 발 물러서기",
  "감정이 격해질 때 깊은 호흡하기",
] as const;

function Part1SectionGlyph({
  kind,
  className = GLYPH_SVG_CLASS,
}: {
  kind: Part1SectionGlyphKind;
  className?: string;
}) {
  const s = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.35,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (kind) {
    case "quoteSparkle":
      return (
        <svg {...s}>
          <path d="M12 5.5v3M12 15.5v3M5.5 12h3M15.5 12h3" />
          <path d="M8.5 8.5l2 2M13.5 13.5l2 2M8.5 15.5l2-2M13.5 10.5l2-2" opacity={0.55} />
          <path d="M17 6.25c.35.45.35 1.05 0 1.5" opacity={0.65} />
        </svg>
      );
    case "gentleSparkle":
      return (
        <svg {...s}>
          <path d="M12 7v2.5M12 14.5V17M7 12h2.5M14.5 12H17" />
          <path d="M9.25 9.25l1.35 1.35M13.4 13.4l1.35 1.35M9.25 14.75l1.35-1.35M13.4 10.6l1.35-1.35" opacity={0.45} />
          <circle cx="7.25" cy="8" r="0.65" fill="currentColor" stroke="none" opacity={0.35} />
          <circle cx="17" cy="9.25" r="0.55" fill="currentColor" stroke="none" opacity={0.3} />
        </svg>
      );
    case "orbitRipple":
      return (
        <svg {...s}>
          <ellipse cx="12" cy="12" rx="7.5" ry="4.5" transform="rotate(-16 12 12)" opacity={0.9} />
          <ellipse cx="12" cy="12" rx="4.8" ry="2.8" transform="rotate(22 12 12)" opacity={0.45} />
          <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" opacity={0.55} />
        </svg>
      );
    case "sparkleCluster":
      return (
        <svg {...s}>
          <path d="M8 8.5v2M7 9.5h2" />
          <path d="M15.5 7v1.8M14.6 7.9h1.8" opacity={0.75} />
          <path d="M13.5 15v2.2M12.4 16.1h2.2" opacity={0.65} />
          <path d="M10 13l1.1 1.1M11.1 13L10 14.1" opacity={0.4} />
        </svg>
      );
    case "softCaution":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="7.25" opacity={0.95} />
          <circle cx="12" cy="15.85" r="0.85" fill="currentColor" stroke="none" opacity={0.38} />
        </svg>
      );
    case "compassMinimal":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="7.25" opacity={0.95} />
          <path d="M12 12V5.85" />
          <path d="M12 12l3.25 5.65" opacity={0.38} />
          <path d="M12 12l-3.25 5.65" opacity={0.38} />
          <circle cx="12" cy="12" r="0.85" fill="currentColor" stroke="none" opacity={0.35} />
        </svg>
      );
    case "energyBloom":
      return (
        <svg {...s}>
          <path d="M12 5.2v3.3M12 15.5v3.3M5.2 12h3.3M15.5 12h3.3" />
          <path d="M8.1 8.1l1.9 1.9M14 14l1.9 1.9M8.1 15.9 10 14M14 10l1.9-1.9" opacity={0.5} />
          <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" opacity={0.18} />
        </svg>
      );
    case "driftDown":
      return (
        <svg {...s}>
          <path d="M7.5 9.2c1.35-.95 2.88-1.45 4.5-1.45s3.15.5 4.5 1.45" />
          <path d="M8.7 12.4c1-.65 2.12-.98 3.3-.98s2.3.33 3.3.98" opacity={0.62} />
          <path d="M9.7 15.55c.68-.4 1.45-.6 2.3-.6s1.62.2 2.3.6" opacity={0.38} />
        </svg>
      );
    case "orbitField":
      return (
        <svg {...s}>
          <ellipse cx="12" cy="12" rx="7.2" ry="4.1" transform="rotate(-12 12 12)" />
          <ellipse cx="12" cy="12" rx="5.2" ry="7.1" transform="rotate(28 12 12)" opacity={0.42} />
          <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" opacity={0.5} />
        </svg>
      );
    case "tideGauge":
      return (
        <svg {...s}>
          <path d="M5.4 15.8c1.55-1.15 3.22-1.72 5-1.72 1.77 0 3.47.57 5.08 1.72" />
          <path d="M6.7 12.2c1.1-.82 2.38-1.24 3.84-1.24 1.45 0 2.75.42 3.9 1.24" opacity={0.62} />
          <path d="M8 8.7c.72-.52 1.58-.78 2.58-.78 1 0 1.88.26 2.64.78" opacity={0.36} />
        </svg>
      );
    case "bondOrbit":
      return (
        <svg {...s}>
          <path d="M7.6 14.9c1.25-2.05 2.72-3.08 4.4-3.08 1.67 0 3.14 1.03 4.4 3.08" />
          <circle cx="9.2" cy="9.8" r="1.35" fill="currentColor" stroke="none" opacity={0.5} />
          <circle cx="14.8" cy="9.8" r="1.35" fill="currentColor" stroke="none" opacity={0.5} />
          <path d="M6.3 12c1.7-1.45 3.6-2.18 5.7-2.18s4 .73 5.7 2.18" opacity={0.4} />
        </svg>
      );
    case "warmHalo":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="5.9" opacity={0.9} />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity={0.18} />
          <path d="M12 4.9v1.8M12 17.3v1.8M4.9 12h1.8M17.3 12h1.8" opacity={0.48} />
        </svg>
      );
    case "softTension":
      return (
        <svg {...s}>
          <path d="M6.4 10.2c1.45-.95 3-.95 4.6 0s3.15.95 4.6 0" />
          <path d="M6.9 13.35c1.12-.68 2.35-.68 3.68 0 1.34.68 2.57.68 3.69 0" opacity={0.6} />
          <path d="M7.6 16.35c.76-.38 1.57-.38 2.42 0 .86.38 1.67.38 2.43 0" opacity={0.34} />
        </svg>
      );
    case "dualEcho":
      return (
        <svg {...s}>
          <path d="M8.3 9.15c0-1.05.62-1.85 1.7-2.45" />
          <path d="M8.9 12.6c0-.62.32-1.18.95-1.7" opacity={0.58} />
          <path d="M14 9.15c0-1.05.62-1.85 1.7-2.45" />
          <path d="M14.6 12.6c0-.62.32-1.18.95-1.7" opacity={0.58} />
          <circle cx="9.2" cy="16.4" r="0.7" fill="currentColor" stroke="none" opacity={0.45} />
          <circle cx="14.9" cy="16.4" r="0.7" fill="currentColor" stroke="none" opacity={0.45} />
        </svg>
      );
    case "balanceOrbit":
      return (
        <svg {...s}>
          <path d="M12 6.2v11.6" />
          <path d="M7.5 9.2h9" />
          <path d="M8.3 9.4c0 1.55-.63 2.85-1.9 3.9" opacity={0.52} />
          <path d="M15.7 9.4c0 1.55.63 2.85 1.9 3.9" opacity={0.52} />
          <circle cx="12" cy="17.8" r="1.1" fill="currentColor" stroke="none" opacity={0.35} />
        </svg>
      );
    case "speechRipple":
      return (
        <svg {...s}>
          <path d="M6.5 10.1c1.35-1.18 2.94-1.77 4.76-1.77s3.42.59 4.8 1.77" />
          <path d="M8.2 13.05c.96-.76 2.03-1.14 3.21-1.14 1.2 0 2.29.38 3.28 1.14" opacity={0.62} />
          <path d="M9.7 15.8c.55-.34 1.14-.51 1.78-.51.66 0 1.27.17 1.84.51" opacity={0.38} />
        </svg>
      );
    case "softDialogue":
      return (
        <svg {...s}>
          <path d="M8 9.4c.78-1.08 1.85-1.62 3.2-1.62 1.35 0 2.42.54 3.2 1.62" />
          <path d="M7.1 14.8c1.45-1.02 2.95-1.53 4.5-1.53s3.05.51 4.5 1.53" opacity={0.58} />
          <circle cx="9" cy="15.7" r="0.9" fill="currentColor" stroke="none" opacity={0.42} />
          <circle cx="14.9" cy="15.7" r="0.9" fill="currentColor" stroke="none" opacity={0.42} />
        </svg>
      );
    case "calmOrbit":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="6.5" opacity={0.9} />
          <ellipse cx="12" cy="12" rx="3.6" ry="6.3" transform="rotate(30 12 12)" opacity={0.4} />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" opacity={0.28} />
        </svg>
      );
    case "boundaryRing":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="7" opacity={0.92} />
          <circle cx="12" cy="12" r="4.2" opacity={0.45} />
          <path d="M12 5.8v2.1M12 16.1v2.1M5.8 12h2.1M16.1 12h2.1" opacity={0.34} />
        </svg>
      );
    case "openOrbit":
      return (
        <svg {...s}>
          <ellipse cx="12" cy="12" rx="7" ry="4.3" transform="rotate(-14 12 12)" opacity={0.9} />
          <path d="M7.4 15.4c1.18.86 2.58 1.29 4.2 1.29 1.62 0 3.07-.43 4.36-1.29" opacity={0.5} />
          <circle cx="16.9" cy="10" r="0.9" fill="currentColor" stroke="none" opacity={0.38} />
        </svg>
      );
    case "forwardOrbit":
      return (
        <svg {...s}>
          <ellipse cx="11.5" cy="12" rx="6.9" ry="4.1" transform="rotate(-18 11.5 12)" opacity={0.88} />
          <path d="M11.2 12l3-2.3" />
          <path d="M11.2 12l3 2.3" opacity={0.48} />
          <circle cx="11.2" cy="12" r="0.95" fill="currentColor" stroke="none" opacity={0.32} />
        </svg>
      );
    case "horizonGlow":
      return (
        <svg {...s}>
          <path d="M6 15.4c1.7-1.15 3.7-1.72 6-1.72 2.28 0 4.3.57 6.05 1.72" opacity={0.94} />
          <path d="M8.4 10.9c1.05-.72 2.26-1.08 3.6-1.08 1.32 0 2.54.36 3.64 1.08" opacity={0.5} />
          <path d="M12 7.1v1.3" opacity={0.35} />
        </svg>
      );
    case "checkOrbit":
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="6.5" opacity={0.88} />
          <path d="M9.3 12.3l1.8 1.8 3.6-4" opacity={0.7} />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <path d="M12 6v3M12 15v3M6 12h3M15 12h3" />
        </svg>
      );
  }
}

function Part1SectionTitle({
  id,
  glyph,
  children,
  cueClassName = part1SectionCueClass,
  glyphClassName = GLYPH_SVG_CLASS,
}: {
  id?: string;
  glyph: Part1SectionGlyphKind;
  children: ReactNode;
  cueClassName?: string;
  glyphClassName?: string;
}) {
  return (
    <h3 id={id} className={part1SectionTitleClass}>
      <span className={cueClassName} aria-hidden>
        <Part1SectionGlyph kind={glyph} className={glyphClassName} />
      </span>
      <span>{children}</span>
    </h3>
  );
}

function NavigatorGlyph({ kind, active }: { kind: NavigatorGlyphKind; active: boolean }) {
  const color = active ? "#ECE7FF" : "#A7B2C5";
  const accentOpacity = active ? 0.88 : 0.58;

  switch (kind) {
    case "self":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <circle cx="12" cy="8.2" r="2.2" fill={color} opacity={active ? 0.9 : 0.7} />
          <path
            d="M8.4 17.2c.9-2.45 2.1-3.65 3.6-3.65s2.7 1.2 3.6 3.65"
            fill="none"
            stroke={color}
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity={accentOpacity}
          />
          <path
            d="M10 11.9c.55.35 1.22.52 2 .52.78 0 1.45-.17 2-.52"
            fill="none"
            stroke={color}
            strokeWidth="1.05"
            strokeLinecap="round"
            opacity={active ? 0.56 : 0.38}
          />
        </svg>
      );
    case "energy":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <path d="M12 5.5v3M12 15.5v3M5.5 12h3M15.5 12h3" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" opacity={accentOpacity} />
          <path d="M8.8 8.8l1.5 1.5M13.7 13.7l1.5 1.5M8.8 15.2l1.5-1.5M13.7 10.3l1.5-1.5" fill="none" stroke={color} strokeWidth="1.15" strokeLinecap="round" opacity={active ? 0.62 : 0.42} />
        </svg>
      );
    case "relationship":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <circle cx="12" cy="7.8" r="1.85" fill={color} opacity={active ? 0.88 : 0.68} />
          <circle cx="8" cy="10.1" r="1.5" fill={color} opacity={active ? 0.7 : 0.52} />
          <circle cx="16" cy="10.1" r="1.5" fill={color} opacity={active ? 0.7 : 0.52} />
          <path
            d="M9.55 16.9c.62-1.75 1.42-2.62 2.45-2.62 1.02 0 1.84.87 2.45 2.62"
            fill="none"
            stroke={color}
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity={accentOpacity}
          />
          <path
            d="M4.9 16.3c.58-1.48 1.35-2.22 2.3-2.22.92 0 1.65.65 2.18 1.95M19.1 16.3c-.58-1.48-1.35-2.22-2.3-2.22-.92 0-1.65.65-2.18 1.95"
            fill="none"
            stroke={color}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={active ? 0.58 : 0.4}
          />
        </svg>
      );
    case "communication":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <path d="M6.5 9.5c1.7-1.5 3.5-2.2 5.5-2.2s3.8.7 5.5 2.2" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" opacity={accentOpacity} />
          <path d="M8.5 13c1.1-.85 2.3-1.3 3.5-1.3s2.4.45 3.5 1.3" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity={active ? 0.7 : 0.46} />
          <circle cx="12" cy="16.5" r="1.1" fill={color} opacity={active ? 0.88 : 0.62} />
        </svg>
      );
    case "guidance":
      return (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
          <circle cx="12" cy="12" r="6.1" fill="none" stroke={color} strokeWidth="1.35" opacity={accentOpacity} />
          <path d="M12 12V6.9" fill="none" stroke={color} strokeWidth="1.25" strokeLinecap="round" opacity={accentOpacity} />
          <path d="M12 12l2.8 4.65" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity={active ? 0.68 : 0.46} />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdvancedExplorationReport({
  fallbackName,
  reportText: _reportText,
}: AdvancedExplorationReportProps) {
  const { user } = useUser();
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("part1");
  const [pinNavigator, setPinNavigator] = useState(false);
  const [navigatorHeight, setNavigatorHeight] = useState(0);
  const [openOuter, setOpenOuter] = useState(false);
  const [openInner, setOpenInner] = useState(false);
  const [openCaution, setOpenCaution] = useState(false);
  const part1Ref = useRef<HTMLElement | null>(null);
  const navigatorRef = useRef<HTMLDivElement | null>(null);

  const userName = useMemo(() => {
    return (
      user?.fullName?.trim() ||
      user?.firstName?.trim() ||
      user?.username?.trim() ||
      fallbackName?.trim() ||
      ""
    );
  }, [fallbackName, user?.firstName, user?.fullName, user?.username]);

  const navItems = [
    { id: "part1", part: "Part 1", label: "나", glyph: "self", enabled: true },
    { id: "part2", part: "Part 2", label: "에너지", glyph: "energy", enabled: true },
    { id: "part3", part: "Part 3", label: "관계", glyph: "relationship", enabled: true },
    { id: "part4", part: "Part 4", label: "소통팁", glyph: "communication", enabled: true },
    { id: "part5", part: "Part 5", label: "앞으로", glyph: "guidance", enabled: true },
  ] as const;

  const nameLead = buildDisplayTitle(userName);
  const avatarUrl = user?.imageUrl?.trim() ?? "";

  useEffect(() => {
    const onScroll = () => {
      if (!hasUserScrolled) setHasUserScrolled(true);
      setShowScrollCue(window.scrollY < 24);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasUserScrolled]);

  useEffect(() => {
    const readHeaderOffsetPx = () => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      const rawOffset = rootStyles.getPropertyValue("--app-header-offset").trim();
      const rootFontSize = Number.parseFloat(rootStyles.fontSize || "16") || 16;

      if (rawOffset.endsWith("rem")) {
        return Number.parseFloat(rawOffset) * rootFontSize;
      }
      if (rawOffset.endsWith("px")) {
        return Number.parseFloat(rawOffset);
      }
      return 12;
    };

    const updateNavigatorState = () => {
      const part1Top = part1Ref.current?.getBoundingClientRect().top;
      const navHeight = navigatorRef.current?.getBoundingClientRect().height ?? 0;
      setNavigatorHeight(navHeight);
      if (typeof part1Top !== "number") return;

      const headerOffset = readHeaderOffsetPx();
      setPinNavigator(part1Top <= headerOffset + navHeight + 8);
    };

    updateNavigatorState();
    window.addEventListener("scroll", updateNavigatorState, { passive: true });
    window.addEventListener("resize", updateNavigatorState);

    let resizeObserver: ResizeObserver | null = null;
    if (navigatorRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateNavigatorState());
      resizeObserver.observe(navigatorRef.current);
    }

    return () => {
      window.removeEventListener("scroll", updateNavigatorState);
      window.removeEventListener("resize", updateNavigatorState);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    const ids = [
      "part1",
      "part1-quote",
      "part1-strengths",
      "part1-caution",
      "part1-signature",
      "part1-next",
      "part2",
      "part2-source",
      "part2-drain",
      "part2-rhythm",
      "part2-flow",
      "part3",
      "part3-pattern",
      "part3-comfort",
      "part3-discomfort",
      "part3-words",
      "part3-balance",
      "part4",
      "part4-rules",
      "part4-dialogue",
      "part4-calm",
      "part4-boundary",
      "part4-close",
      "part5",
      "part5-remember",
      "part5-direction",
      "part5-close",
      "part5-checklist",
    ];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.2, 0.4, 0.6] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navPrimaryActive = PART_1_SCROLL_IDS.has(activeSection);
  const navPart2Active = PART_2_SCROLL_IDS.has(activeSection);
  const navPart3Active = PART_3_SCROLL_IDS.has(activeSection);
  const navPart4Active = PART_4_SCROLL_IDS.has(activeSection);
  const navPart5Active = PART_5_SCROLL_IDS.has(activeSection);

  return (
    <div className="space-y-5">
      <section className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-gradient-to-b from-[#091127] via-[#070D1E] to-[#050816] px-4 pb-3 pt-4 shadow-[0_12px_32px_rgba(2,7,20,0.38)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-16 w-16 rounded-full bg-[#22D3EE]/6 blur-2xl" />
        </div>

        <div className="relative z-[1] flex flex-col">
          <div className="flex w-full items-center justify-center gap-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${userName || "사용자"} 프로필`}
                className="h-6 w-6 shrink-0 rounded-full border border-white/20 object-cover opacity-90"
              />
            ) : (
              <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] text-[10px] font-medium text-[#F8FAFC]/90">
                {getInitial(userName)}
              </div>
            )}
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">DEEP REPORT</p>
          </div>

          <div className="mt-3 flex flex-row items-start justify-between gap-3 sm:mt-4 sm:gap-5">
            <div className="min-w-0 flex-1 pt-0.5 text-left">
              <p className="text-[12px] font-medium text-[#94A3B8]">{nameLead}</p>
              <h2 className="mt-1 text-[1.2rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[1.28rem]">
                심화 탐사 리포트
              </h2>
              <p className="mt-2 max-w-[14.5rem] text-[11px] leading-relaxed text-[#64748B] sm:max-w-[16rem]">
                답변을 바탕으로 성향과 에너지 흐름을 정리했어요.
              </p>
            </div>
            <div className="w-[38%] max-w-[7.5rem] shrink-0 sm:max-w-[8.5rem]">
              <svg viewBox="0 0 320 260" className="h-auto w-full" aria-hidden>
                <defs>
                  <radialGradient id="heroPlanetGrad" cx="35%" cy="26%" r="72%">
                    <stop offset="0%" stopColor="#BFA8FF" />
                    <stop offset="55%" stopColor="#8C79D6" />
                    <stop offset="100%" stopColor="#6F60B4" />
                  </radialGradient>
                </defs>
                <g transform="rotate(-10 160 166)">
                  <path d="M42 166 A118 25 0 0 0 278 166" fill="none" stroke="rgba(221,199,255,0.38)" strokeWidth="2.5" />
                </g>
                <g transform="rotate(-7 160 156)">
                  <path d="M51 156 A109 20 0 0 0 269 156" fill="none" stroke="rgba(237,224,255,0.45)" strokeWidth="2" />
                </g>
                <circle cx="160" cy="154" r="76" fill="url(#heroPlanetGrad)" />
                <circle cx="126" cy="136" r="14" fill="rgba(109,92,174,0.45)" />
                <circle cx="184" cy="170" r="16" fill="rgba(109,92,174,0.42)" />
                <circle cx="146" cy="189" r="9" fill="rgba(109,92,174,0.36)" />
                <g transform="rotate(-10 160 166)">
                  <path d="M42 166 A118 25 0 0 1 278 166" fill="none" stroke="rgba(221,199,255,0.6)" strokeWidth="2.5" />
                </g>
                <g transform="rotate(-7 160 156)">
                  <path d="M51 156 A109 20 0 0 1 269 156" fill="none" stroke="rgba(237,224,255,0.72)" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>

          <div
            className={[
              "mt-4 pb-1 text-center transition-all duration-300 sm:mt-5",
              !hasUserScrolled || showScrollCue ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
            ].join(" ")}
          >
            <p className="text-[10px] font-medium tracking-[0.12em] text-[#94A3B8]">스크롤하여 리포트 보기</p>
            <ChevronDown
              className="mx-auto mt-0.5 h-4 w-4 animate-bounce text-[#A78BFA]/70 [animation-duration:1.6s]"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </section>

      <div className="mt-4 px-1">
        {pinNavigator ? <div style={{ height: navigatorHeight || undefined }} aria-hidden /> : null}
        <div
          className={[
            "transition-[top,opacity] duration-300",
            pinNavigator
              ? "fixed inset-x-0 z-[80] px-1 sm:px-1.5"
              : "",
          ].join(" ")}
          style={pinNavigator ? { top: "var(--app-header-offset, 0.75rem)" } : undefined}
        >
          <div
            ref={navigatorRef}
            className="mx-auto w-full max-w-lg rounded-lg border border-[#8B5CF6]/12 bg-[#070B18]/94 px-1 py-1 shadow-[0_6px_20px_rgba(0,0,0,0.34)] backdrop-blur-md"
          >
            <div className="flex items-stretch justify-between gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const isActive =
                  item.id === "part1"
                    ? navPrimaryActive
                    : item.id === "part2"
                      ? navPart2Active
                      : item.id === "part3"
                        ? navPart3Active
                        : item.id === "part4"
                          ? navPart4Active
                        : item.id === "part5"
                          ? navPart5Active
                      : false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.enabled}
                    aria-current={isActive ? "true" : undefined}
                    onClick={item.enabled ? () => scrollToSection(item.id) : undefined}
                    className={[
                      "relative shrink-0 rounded-md px-1 py-1 text-[9px] transition-colors",
                      item.enabled ? "" : "cursor-default",
                      isActive ? "bg-[#8B5CF6]/14 text-[#F1F5F9]" : "text-[#64748B]",
                      item.enabled && !isActive ? "hover:text-[#94A3B8]" : "",
                    ].join(" ")}
                  >
                    <span className="flex min-w-[58px] flex-col items-center gap-1">
                      <span className="text-[7px] font-medium tracking-[0.12em] text-[#64748B]">
                        {item.part}
                      </span>
                      <span
                        className={[
                          "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                          isActive
                            ? "border-[#BBA6FF]/40 bg-[#8B5CF6]/18 shadow-[0_0_20px_rgba(139,92,246,0.18)]"
                            : "border-white/[0.06] bg-white/[0.04]",
                          !item.enabled ? "opacity-55" : "",
                        ].join(" ")}
                      >
                        <NavigatorGlyph kind={item.glyph} active={isActive} />
                      </span>
                      <span
                        className={[
                          "text-[9px] font-medium tracking-[-0.01em]",
                          isActive ? "text-[#E8E0FF]" : "text-[#7C899E]",
                          !item.enabled ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span
                      className={[
                        "pointer-events-none absolute inset-x-2 bottom-0.5 h-px rounded-full transition-opacity",
                        isActive ? "bg-[#C4B5FD]/80 opacity-100" : "opacity-0",
                      ].join(" ")}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section id="part1" ref={part1Ref} className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pt-8">
        <header className="space-y-3">
          <p className={part1LabelClass}>Part 1</p>
          <h2 className={part1MainTitleClass}>나는 어떤 사람인가</h2>
        </header>

        <section id="part1-quote" className="mt-14 scroll-mt-28" aria-labelledby="part1-quote-heading">
          <div className="flex items-center gap-3">
            <span className={part1SectionCueClass} aria-hidden>
              <Part1SectionGlyph kind="quoteSparkle" />
            </span>
            <h3 id="part1-quote-heading" className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[#ECEEF4]">
              한 문장으로 표현한 당신
            </h3>
          </div>
          <div className={part1PanelClass}>
            <p className="mt-6 max-w-[22rem] text-[1rem] font-medium leading-[1.8] tracking-[-0.015em] text-[#F3F0F9] sm:text-[1.08rem]">
              &quot;너는 자유로운 바람처럼, 새로운 가능성을 탐색하는 존재야.&quot;
            </p>
            <p className="mt-5 max-w-[20rem] text-[12px] leading-[1.95] tracking-[0.01em] text-[#75819A]">
              새로운 생각과 가능성을 발견할 때, 가장 너다운 표정이 자연스럽게 드러나요.
            </p>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="part1-outer-heading">
          <Part1SectionTitle id="part1-outer-heading" glyph="gentleSparkle">
            겉으로 보이는 모습
          </Part1SectionTitle>
          <div className={part1PanelClass}>
            <p className={part1BodyClass}>
              사람들과의 연결 속에서 자연스럽게 분위기를 이끄는 타입이에요. 먼저 다가가고, 흐름을 정리하고,
              어색한 공기를 부드럽게 풀어내는 힘이 있어요.
            </p>
            {openOuter && (
              <p className={`mt-5 max-w-[31rem] ${part1BodyClass}`}>
                사람들과의 소통을 즐기고, 활발하게 활동하는 모습이 드러납니다. 친구들과의 대화에서 리더십을
                발휘하고, 새로운 사람들과의 만남에서도 주도적으로 이야기를 이끌어가는 모습이 있습니다.
              </p>
            )}
            <button
              type="button"
              className={`mt-5 inline-flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#9BA7BA]`}
              onClick={() => setOpenOuter((v) => !v)}
            >
              {openOuter ? "접기" : "조금 더 읽기"}
              <ChevronDown
                className={["h-3.5 w-3.5 transition", openOuter ? "rotate-180" : ""].join(" ")}
                strokeWidth={1.35}
              />
            </button>
          </div>
        </section>

        <section className="mt-20" aria-labelledby="part1-inner-heading">
          <Part1SectionTitle id="part1-inner-heading" glyph="orbitRipple">
            내면의 흐름
          </Part1SectionTitle>
          <div className={part1PanelClass}>
            <p className="max-w-[31rem] text-[14px] leading-[2.05] tracking-[-0.01em] text-[#B1BCD0]">
              겉은 밝지만, 내면은 생각보다 깊고 민감한 편이에요. 감정을 오래 품고 혼자 정리하려는 경향도
              있어요. 누군가를 쉽게 지나치지 못하고, 작은 여운도 오래 마음속에 남겨 두는 편입니다.
            </p>
            {openInner && (
              <p className={`mt-5 max-w-[30rem] ${part1BodyClass}`}>
                타인의 감정을 잘 이해하고 지지하려는 모습이 강합니다. 다만 때로는 감정에 쉽게 영향을 받거나,
                속으로 복잡한 마음을 오래 품을 수 있습니다.
              </p>
            )}
            <button
              type="button"
              className={`mt-5 inline-flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#9BA7BA]`}
              onClick={() => setOpenInner((v) => !v)}
            >
              {openInner ? "접기" : "조금 더 읽기"}
              <ChevronDown
                className={["h-3.5 w-3.5 transition", openInner ? "rotate-180" : ""].join(" ")}
                strokeWidth={1.35}
              />
            </button>
          </div>
        </section>

        <section id="part1-strengths" className="mt-20 scroll-mt-28">
          <Part1SectionTitle glyph="sparkleCluster">당신의 강점</Part1SectionTitle>
          <div className={part1GroupedPanelClass}>
            <article className="flex gap-4 py-5">
              <span
                className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#9FB1CA]/35 bg-transparent"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EDF0F7]">창의적인 사고</p>
                <p className="mt-2 max-w-[18rem] text-[12px] leading-[1.85] tracking-[0.02em] text-[#7E8AA0]">
                  익숙한 틀을 조금 비껴 바라보는 감각
                </p>
                <p className={`mt-3 max-w-[28rem] ${part1BodyClass}`}>
                  직관적으로 문제를 바라보며, 익숙한 방식 바깥에서 새로운 해결책을 제안하는 힘이 있어요.
                </p>
              </div>
            </article>
            <article className="flex gap-4 border-t border-white/[0.05] py-5">
              <span
                className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#9FB1CA]/35 bg-transparent"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EDF0F7]">감정적 이해</p>
                <p className="mt-2 max-w-[18rem] text-[12px] leading-[1.85] tracking-[0.02em] text-[#7E8AA0]">
                  사람의 마음 결을 먼저 읽어내는 힘
                </p>
                <p className={`mt-3 max-w-[28rem] ${part1BodyClass}`}>
                  타인의 감정을 깊이 이해하고, 공감하며 지지하는 능력이 뛰어나요. 사람들은 당신 곁에서 쉽게
                  마음을 놓게 됩니다.
                </p>
              </div>
            </article>
            <article className="flex gap-4 border-t border-white/[0.05] py-5">
              <span
                className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#9FB1CA]/35 bg-transparent"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EDF0F7]">안정감 제공</p>
                <p className="mt-2 max-w-[18rem] text-[12px] leading-[1.85] tracking-[0.02em] text-[#7E8AA0]">
                  흔들리는 흐름 안에서도 중심을 남기는 결
                </p>
                <p className={`mt-3 max-w-[28rem] ${part1BodyClass}`}>
                  주변에 편안함과 신뢰를 주고, 깊은 관계를 맺는 데 강점이 있어요. 복잡한 상황에서도 중심을 잃지
                  않게 하는 결이 있습니다.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section id="part1-caution" className="mt-20 scroll-mt-28" aria-labelledby="part1-caution-heading">
          <Part1SectionTitle id="part1-caution-heading" glyph="softCaution">
            조심하면 좋은 감정 흐름
          </Part1SectionTitle>
          <article className={part1PanelClass}>
            <p className="max-w-[31rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#AFB8C9]">
              스트레스와 감정의 영향을 쉽게 받는 편이에요. 감정에 휩쓸리기 전에, 스스로를 챙기는 시간이
              필요해요.
            </p>
            {openCaution && (
              <p className={`mt-5 max-w-[30rem] ${part1BodyClass}`}>
                작은 일에도 부담을 느끼거나, 감정적으로 흔들릴 수 있습니다. 타인의 감정에 지나치게 영향을
                받지 않도록 자기 관리가 필요합니다. 감정을 숨기기보다 적절하게 표현하는 연습도 도움이 됩니다.
              </p>
            )}
            <button
              type="button"
              className={`mt-5 inline-flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#9BA7BA]`}
              onClick={() => setOpenCaution((v) => !v)}
            >
              {openCaution ? "접기" : "조금 더 읽기"}
              <ChevronDown
                className={["h-3.5 w-3.5 transition", openCaution ? "rotate-180" : ""].join(" ")}
                strokeWidth={1.35}
              />
            </button>
          </article>
        </section>

        <section id="part1-signature" className="mt-20 scroll-mt-28">
          <Part1SectionTitle glyph="compassMinimal">가장 나다운 순간</Part1SectionTitle>
          <div className={part1PanelClass}>
            <div className="space-y-7">
              <article className="flex gap-4">
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#9FB1CA]/35 bg-transparent"
                  aria-hidden
                />
                <p className="max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#C7D1DF]">
                  친구들과의 대화 속에서
                  <br />
                  아이디어를 나누며 이야기를 이끌어갈 때
                </p>
              </article>
              <article className="flex gap-4 border-t border-white/[0.05] pt-7">
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#9FB1CA]/35 bg-transparent"
                  aria-hidden
                />
                <p className="max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#C7D1DF]">
                  친구가 힘들어할 때
                  <br />
                  위로하고 함께 시간을 내며 기분을 전환시켜줄 때
                </p>
              </article>
            </div>
          </div>
        </section>

        <article id="part1-next" className="mt-20 scroll-mt-28 pb-4">
          <p className={`${part1CaptionClass} font-semibold uppercase tracking-[0.16em] text-[#8F7BBE]`}>
            다음 탐험
          </p>
          <p className="mt-3 text-[1rem] font-semibold tracking-[-0.015em] text-[#ECEEF4]">나의 에너지와 환경</p>
          <p className="mt-3 max-w-[23rem] text-[13px] leading-[1.95] text-[#8592A6]">
            에너지가 어디에서 충전되고, 어디에서 소진되는지 이어서 천천히 살펴볼게요.
          </p>
          <ChevronDown className="mt-4 h-4 w-4 text-[#A78BFA]/35" strokeWidth={1.35} aria-hidden />
        </article>
      </section>

      <section id="part2" className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pt-16">
        <header className="space-y-3 border-t border-white/[0.06] pt-14">
          <p className={part2LabelClass}>Part 2</p>
          <h2 className={part2MainTitleClass}>나의 에너지와 환경</h2>
          <p className={part2SubtitleClass}>
            어디에서 충전되고,
            <br />
            어디에서 소진되는지 살펴볼게요.
          </p>
        </header>

        <section id="part2-source" className="mt-14 scroll-mt-28" aria-labelledby="part2-source-heading">
          <Part1SectionTitle
            id="part2-source-heading"
            glyph="energyBloom"
            cueClassName={part2SectionCueClass}
            glyphClassName={part2GlyphClass}
          >
            나에게 힘을 주는 순간
          </Part1SectionTitle>
          <div className={part2GroupedPanelClass}>
            {PART2_ENERGY_SOURCES.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#AED5E8]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EEF5FB]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B2C8D6]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part2-drain" className="mt-20 scroll-mt-28" aria-labelledby="part2-drain-heading">
          <Part1SectionTitle
            id="part2-drain-heading"
            glyph="driftDown"
            cueClassName={part2SectionCueClass}
            glyphClassName={part2GlyphClass}
          >
            나를 지치게 하는 흐름
          </Part1SectionTitle>
          <div className={part2GroupedPanelClass}>
            {PART2_DRAIN_PATTERNS.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#AED5E8]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#E9F2F8]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.04] tracking-[-0.01em] text-[#A7BCCD]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part2-rhythm" className="mt-20 scroll-mt-28" aria-labelledby="part2-rhythm-heading">
          <Part1SectionTitle
            id="part2-rhythm-heading"
            glyph="orbitField"
            cueClassName={part2SectionCueClass}
            glyphClassName={part2GlyphClass}
          >
            잘 맞는 환경과 리듬
          </Part1SectionTitle>
          <div className={part2PanelClass}>
            <div className="space-y-7">
              {PART2_SUPPORTIVE_RHYTHMS.map((entry, index) => (
                <article
                  key={entry.title}
                  className={[
                    "flex gap-4",
                    index > 0 ? "border-t border-white/[0.05] pt-7" : "",
                  ].join(" ")}
                >
                  <span
                    className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#AED5E8]/35 bg-transparent"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EAF4FA]">{entry.title}</p>
                    <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B4C9D6]">
                      {entry.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="part2-flow" className="mt-20 scroll-mt-28" aria-labelledby="part2-flow-heading">
          <Part1SectionTitle
            id="part2-flow-heading"
            glyph="tideGauge"
            cueClassName={part2SectionCueClass}
            glyphClassName={part2GlyphClass}
          >
            나의 에너지 흐름
          </Part1SectionTitle>
          <div className={part2PanelClass}>
            <div className="space-y-5">
              {PART2_ENERGY_FLOW.map((item) => (
                <article key={item.label} className="space-y-2">
                  <div className="flex items-end justify-between gap-4">
                    <p className="text-[0.92rem] font-medium tracking-[-0.01em] text-[#EAF4FA]">{item.label}</p>
                    <span className="text-[12px] font-semibold tracking-[0.02em] text-[#9CC7DC]">{item.value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-[#67B7FF]/75 via-[#8BD3FF]/55 to-[#C4B5FD]/40"
                      style={{ width: `${item.value}%` }}
                    >
                      <span className="absolute right-0 top-1/2 h-4 w-10 -translate-y-1/2 rounded-full bg-[#7DD3FC]/45 blur-md" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-[30rem] text-[13px] leading-[1.95] tracking-[0.01em] text-[#8EABBE]">
              사람들과의 관계에 많은 에너지를 쓰는 편이라, 즐거움도 크지만 스스로에게 되돌아오는 충전은 상대적으로 적을 수 있어요.
              자연 속에서 쉬거나 예술 활동에 몰입하는 시간을 조금 더 늘릴수록, 당신의 리듬은 더 안정되고 부드럽게 이어질 거예요.
            </p>
          </div>
        </section>
      </section>

      <section id="part3" className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pt-16">
        <header className="space-y-3 border-t border-white/[0.06] pt-14">
          <p className={part3LabelClass}>Part 3</p>
          <h2 className={part3MainTitleClass}>관계와 나</h2>
          <p className={part3SubtitleClass}>
            사람들과 연결될 때,
            <br />
            내 마음은 어떤 흐름을 가지는지 살펴볼게요.
          </p>
        </header>

        <section id="part3-pattern" className="mt-14 scroll-mt-28" aria-labelledby="part3-pattern-heading">
          <Part1SectionTitle
            id="part3-pattern-heading"
            glyph="bondOrbit"
            cueClassName={part3SectionCueClass}
            glyphClassName={part3GlyphClass}
          >
            관계에서 반복되는 패턴
          </Part1SectionTitle>
          <div className={part3PanelClass}>
            <p className="max-w-[30rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#D4B7C2]">
              당신은 관계 안에서 긍정적인 에너지를 나누고, 가능하면 더 깊은 연결로 이어가고 싶어 해요.
              그래서 대화 속에서도 상대의 기분을 누구보다 먼저 눈치채고, 그 마음을 먼저 보듬으려는 쪽에 가까워요.
            </p>
            <p className="mt-5 max-w-[29rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#C3A3B1]">
              하지만 그렇게 상대를 먼저 챙기다 보면, 정작 자신의 감정은 뒤로 밀릴 때가 있어요.
              오래 이어지는 관계를 위해서는 솔직하게 마음을 드러내고, 내 감정도 같은 무게로 놓는 균형이 필요해요.
            </p>
          </div>
        </section>

        <section id="part3-comfort" className="mt-20 scroll-mt-28" aria-labelledby="part3-comfort-heading">
          <Part1SectionTitle
            id="part3-comfort-heading"
            glyph="warmHalo"
            cueClassName={part3SectionCueClass}
            glyphClassName={part3GlyphClass}
          >
            편안함을 느끼는 연결
          </Part1SectionTitle>
          <div className={part3GroupedPanelClass}>
            {PART3_COMFORT_CONNECTIONS.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#E6B9C8]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#FAEFF4]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#D6B7C4]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part3-discomfort" className="mt-20 scroll-mt-28" aria-labelledby="part3-discomfort-heading">
          <Part1SectionTitle
            id="part3-discomfort-heading"
            glyph="softTension"
            cueClassName={part3SectionCueClass}
            glyphClassName={part3GlyphClass}
          >
            불편함을 느끼는 흐름
          </Part1SectionTitle>
          <div className={part3GroupedPanelClass}>
            {PART3_DISCOMFORT_FLOWS.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#E6B9C8]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#F6EAF0]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.04] tracking-[-0.01em] text-[#CBAEBC]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part3-words" className="mt-20 scroll-mt-28" aria-labelledby="part3-words-heading">
          <Part1SectionTitle
            id="part3-words-heading"
            glyph="dualEcho"
            cueClassName={part3SectionCueClass}
            glyphClassName={part3GlyphClass}
          >
            상처가 되는 말과 힘이 되는 말
          </Part1SectionTitle>
          <div className="mt-7 space-y-8">
            <article className="rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#D79CAD]">상처가 되기 쉬운 말</p>
              <div className="mt-5 space-y-5">
                {PART3_WORD_PAIRS.map((pair, index) => (
                  <div
                    key={pair.hurt}
                    className={[
                      "max-w-[24rem]",
                      index > 0 ? "border-t border-white/[0.05] pt-5" : "",
                    ].join(" ")}
                  >
                    <p className="text-[15px] font-medium leading-[1.9] tracking-[-0.015em] text-[#F8EBF0]">
                      &ldquo;{pair.hurt}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[26px] bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.1),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-[#DEAFC0]">힘이 되는 말</p>
              <div className="mt-5 space-y-5">
                {PART3_WORD_PAIRS.map((pair, index) => (
                  <div
                    key={pair.support}
                    className={[
                      "max-w-[24rem]",
                      index > 0 ? "border-t border-white/[0.05] pt-5" : "",
                    ].join(" ")}
                  >
                    <p className="text-[15px] font-medium leading-[1.9] tracking-[-0.015em] text-[#FBF0F5]">
                      &ldquo;{pair.support}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section id="part3-balance" className="mt-20 scroll-mt-28" aria-labelledby="part3-balance-heading">
          <Part1SectionTitle
            id="part3-balance-heading"
            glyph="balanceOrbit"
            cueClassName={part3SectionCueClass}
            glyphClassName={part3GlyphClass}
          >
            관계 안에서 필요한 균형
          </Part1SectionTitle>
          <div className={part3PanelClass}>
            <p className="max-w-[30rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#D2B4C0]">
              당신은 관계를 소중히 여기는 만큼, 상대의 마음을 먼저 살피는 편이에요.
            </p>
            <p className="mt-5 max-w-[29rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#C3A4B1]">
              하지만 오래 지속되는 연결을 위해서는 당신의 감정도 같은 무게로 놓이는 시간이 필요해요.
              솔직한 표현은 관계를 가볍게 만들기보다, 오히려 더 깊고 안정적으로 이어지게 해줄 거예요.
            </p>
          </div>
        </section>
      </section>

      <section id="part4" className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pt-16">
        <header className="space-y-3 border-t border-white/[0.06] pt-14">
          <p className={part4LabelClass}>Part 4</p>
          <h2 className={part4MainTitleClass}>관계를 더 편하게</h2>
          <p className={part4SubtitleClass}>
            조금 더 편안하고 건강하게 연결되기 위한 흐름을 살펴볼게요.
          </p>
        </header>

        <section id="part4-rules" className="mt-14 scroll-mt-28" aria-labelledby="part4-rules-heading">
          <Part1SectionTitle
            id="part4-rules-heading"
            glyph="speechRipple"
            cueClassName={part4SectionCueClass}
            glyphClassName={part4GlyphClass}
          >
            나만의 소통 규칙
          </Part1SectionTitle>
          <div className={part4GroupedPanelClass}>
            {PART4_COMMUNICATION_PRINCIPLES.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#B6DBD4]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EFF7F5]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B7CCC8]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part4-dialogue" className="mt-20 scroll-mt-28" aria-labelledby="part4-dialogue-heading">
          <Part1SectionTitle
            id="part4-dialogue-heading"
            glyph="softDialogue"
            cueClassName={part4SectionCueClass}
            glyphClassName={part4GlyphClass}
          >
            상황 속의 대화 흐름
          </Part1SectionTitle>
          <div className="mt-7 space-y-6">
            {PART4_DIALOGUE_REFRAINS.map((entry) => (
              <article key={entry.context} className={part4PanelClass}>
                <p className="text-[0.92rem] font-semibold tracking-[-0.015em] text-[#EDF8F5]">{entry.context}</p>
                <div className="mt-5 space-y-4">
                  <div className="max-w-[24rem]">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8FB0AA]">이전에는</p>
                    <p className="mt-2 text-[14px] leading-[1.92] tracking-[-0.01em] text-[#D6E7E1]">
                      &ldquo;{entry.before}&rdquo;
                    </p>
                  </div>
                  <div className="max-w-[24rem] border-t border-white/[0.05] pt-4">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-[#A7D1C5]">이제는</p>
                    <p className="mt-2 text-[14px] leading-[1.92] tracking-[-0.01em] text-[#F2FBF8]">
                      &ldquo;{entry.after}&rdquo;
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part4-calm" className="mt-20 scroll-mt-28" aria-labelledby="part4-calm-heading">
          <Part1SectionTitle
            id="part4-calm-heading"
            glyph="calmOrbit"
            cueClassName={part4SectionCueClass}
            glyphClassName={part4GlyphClass}
          >
            감정이 격해질 때 필요한 흐름
          </Part1SectionTitle>
          <div className={part4PanelClass}>
            <div className="space-y-7">
              {PART4_CALMING_FLOWS.map((entry, index) => (
                <article
                  key={entry.title}
                  className={[
                    "flex gap-4",
                    index > 0 ? "border-t border-white/[0.05] pt-7" : "",
                  ].join(" ")}
                >
                  <span
                    className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#B6DBD4]/35 bg-transparent"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EEF8F6]">{entry.title}</p>
                    <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B8CDCA]">
                      {entry.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="part4-boundary" className="mt-20 scroll-mt-28" aria-labelledby="part4-boundary-heading">
          <Part1SectionTitle
            id="part4-boundary-heading"
            glyph="boundaryRing"
            cueClassName={part4SectionCueClass}
            glyphClassName={part4GlyphClass}
          >
            관계를 정리하거나 거리두어야 할 때
          </Part1SectionTitle>
          <div className={part4GroupedPanelClass}>
            {PART4_BOUNDARY_SIGNALS.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#B6DBD4]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#EEF8F6]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B7CCCA]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part4-close" className="mt-20 scroll-mt-28" aria-labelledby="part4-close-heading">
          <Part1SectionTitle
            id="part4-close-heading"
            glyph="openOrbit"
            cueClassName={part4SectionCueClass}
            glyphClassName={part4GlyphClass}
          >
            관계 안에서 잊지 말아야 할 것
          </Part1SectionTitle>
          <div className={part4PanelClass}>
            <p className="max-w-[30rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#C3D6D2]">
              당신은 관계를 오래 지켜가고 싶은 마음이 큰 사람이에요.
            </p>
            <p className="mt-5 max-w-[29rem] text-[14px] leading-[2.02] tracking-[-0.01em] text-[#B1C6C2]">
              하지만 건강한 연결은 참는 것만으로 유지되지 않아요. 서로의 감정이 편안하게 머물 수 있는 관계 안에서,
              당신도 조금 더 자연스럽고 안전해질 수 있어요.
            </p>
          </div>
        </section>
      </section>

      <section id="part5" className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pb-8 pt-20">
        <header className="space-y-3 border-t border-white/[0.06] pt-16">
          <p className={part5LabelClass}>Part 5</p>
          <h2 className={part5MainTitleClass}>앞으로의 나</h2>
          <p className={part5SubtitleClass}>
            지금까지의 흐름을 안고,
            <br />
            앞으로의 나를 천천히 바라볼게요.
          </p>
        </header>

        <section id="part5-remember" className="mt-16 scroll-mt-28" aria-labelledby="part5-remember-heading">
          <Part1SectionTitle
            id="part5-remember-heading"
            glyph="sparkleCluster"
            cueClassName={part5SectionCueClass}
            glyphClassName={part5GlyphClass}
          >
            기억하면 좋을 세 가지
          </Part1SectionTitle>
          <div className={part5GroupedPanelClass}>
            {PART5_REMINDERS.map((entry, index) => (
              <article
                key={entry.title}
                className={[
                  "flex gap-4 py-5",
                  index > 0 ? "border-t border-white/[0.05]" : "",
                ].join(" ")}
              >
                <span
                  className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#DFCDA9]/35 bg-transparent"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#FAF6ED]">{entry.title}</p>
                  <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.05] tracking-[-0.01em] text-[#CFC3AE]">
                    {entry.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="part5-direction" className="mt-24 scroll-mt-28" aria-labelledby="part5-direction-heading">
          <Part1SectionTitle
            id="part5-direction-heading"
            glyph="forwardOrbit"
            cueClassName={part5SectionCueClass}
            glyphClassName={part5GlyphClass}
          >
            한 걸음 더 나가기 위한 방향
          </Part1SectionTitle>
          <div className={part5PanelClass}>
            <div className="space-y-7">
              {PART5_DIRECTIONS.map((entry, index) => (
                <article
                  key={entry.title}
                  className={[
                    "flex gap-4",
                    index > 0 ? "border-t border-white/[0.05] pt-7" : "",
                  ].join(" ")}
                >
                  <span
                    className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#DFCDA9]/35 bg-transparent"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold tracking-[-0.015em] text-[#FBF7EE]">{entry.title}</p>
                    <p className="mt-3 max-w-[28rem] text-[14px] leading-[2.04] tracking-[-0.01em] text-[#C9BEAA]">
                      {entry.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="part5-close" className="mt-28 scroll-mt-28" aria-labelledby="part5-close-heading">
          <Part1SectionTitle
            id="part5-close-heading"
            glyph="horizonGlow"
            cueClassName={part5SectionCueClass}
            glyphClassName={part5GlyphClass}
          >
            마무리
          </Part1SectionTitle>
          <div className="mt-8 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(244,213,141,0.14),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.014))] px-5 py-9">
            <p className="max-w-[25rem] text-[1.03rem] font-medium leading-[1.95] tracking-[-0.02em] text-[#FBF7EF] sm:text-[1.1rem]">
              당신은 이미 자신의 창의력과 감정의 결로, 주변의 공기를 조금 더 따뜻하게 만드는 사람이에요.
            </p>
            <p className="mt-7 max-w-[28rem] text-[14px] leading-[2.12] tracking-[-0.01em] text-[#D3C7B3]">
              앞으로도 그 고유한 에너지를 잃지 않으면서, 사람들과의 관계를 소중히 여기고 스스로를 돌보는 마음까지 함께 가져가면 좋아요.
            </p>
            <p className="mt-7 max-w-[27rem] text-[14px] leading-[2.12] tracking-[-0.01em] text-[#BDAF98]">
              가끔은 멈추고 쉬어가도 괜찮아요. 당신의 감정과 필요를 다정하게 살피는 시간이, 앞으로의 삶을 조금 더 편안하고 풍요롭게 만들어줄 거예요.
            </p>
          </div>
        </section>

        <section id="part5-checklist" className="mt-24 scroll-mt-28" aria-labelledby="part5-checklist-heading">
          <Part1SectionTitle
            id="part5-checklist-heading"
            glyph="checkOrbit"
            cueClassName={part5SectionCueClass}
            glyphClassName={part5GlyphClass}
          >
            오늘의 나를 위한 체크리스트
          </Part1SectionTitle>
          <div className={part5PanelClass}>
            <p className="max-w-[28rem] text-[13px] leading-[1.95] tracking-[0.01em] text-[#B9AD99]">
              오늘을 완벽하게 채우기보다, 마음이 닿는 것 하나만 골라 지나가도 충분해요.
            </p>
            <div className="mt-7 space-y-4">
              {PART5_CHECKLIST.map((item, index) => (
                <div
                  key={item}
                  className={[
                    "flex gap-4",
                    index > 0 ? "border-t border-white/[0.05] pt-4" : "",
                  ].join(" ")}
                >
                  <span
                    className="mt-1.5 inline-flex h-4 w-4 shrink-0 rounded-full border border-[#D7C59F]/38 bg-transparent"
                    aria-hidden
                  />
                  <p className="max-w-[27rem] text-[14px] leading-[1.96] tracking-[-0.01em] text-[#E0D5C1]">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[12px] leading-[1.9] tracking-[0.01em] text-[#A79781]">
              하나만 해내도, 오늘의 당신은 충분해요.
            </p>
          </div>
        </section>
      </section>
    </div>
  );
}
