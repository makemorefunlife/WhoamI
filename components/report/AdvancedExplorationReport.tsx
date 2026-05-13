"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  | "tideGauge";

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
          <circle cx="12" cy="12" r="6.2" fill="none" stroke={color} strokeWidth="1.35" opacity={accentOpacity} />
          <circle cx="12" cy="12" r="1.35" fill={color} opacity={active ? 0.9 : 0.65} />
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
          <path d="M7.5 15.2c1.2-2 3-3 4.5-3s3.3 1 4.5 3" fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round" opacity={accentOpacity} />
          <circle cx="9" cy="10" r="1.45" fill={color} opacity={active ? 0.84 : 0.62} />
          <circle cx="15" cy="10" r="1.45" fill={color} opacity={active ? 0.84 : 0.62} />
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
  const [openOuter, setOpenOuter] = useState(false);
  const [openInner, setOpenInner] = useState(false);
  const [openCaution, setOpenCaution] = useState(false);

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
    { id: "part3", part: "Part 3", label: "관계", glyph: "relationship", enabled: false },
    { id: "part4", part: "Part 4", label: "소통팁", glyph: "communication", enabled: false },
    { id: "part5", part: "Part 5", label: "조언", glyph: "guidance", enabled: false },
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

      <div className="h-[4.75rem]" aria-hidden />
      <div className="fixed left-1/2 top-3 z-[60] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 sm:w-[calc(100%-3rem)]">
        <div className="rounded-lg border border-[#8B5CF6]/12 bg-[#070B18]/94 px-1 py-1 shadow-[0_6px_20px_rgba(0,0,0,0.34)] backdrop-blur-md">
          <div className="flex items-stretch justify-between gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const isActive =
                item.id === "part1"
                  ? navPrimaryActive
                  : item.id === "part2"
                    ? navPart2Active
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

      <section id="part1" className="scroll-mt-28 mx-auto w-full max-w-lg px-1 pt-8">
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
    </div>
  );
}
