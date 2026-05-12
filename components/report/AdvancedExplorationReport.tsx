"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ChevronDown,
  UserRound,
  Zap,
  Users,
  Activity,
  Compass,
} from "lucide-react";

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

const part1LabelClass = "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B8A6E8]";
const part1MainTitleClass =
  "mt-2 text-[1.5rem] font-bold leading-[1.2] tracking-[-0.03em] text-white sm:text-[1.6rem]";
const part1SectionTitleClass =
  "flex items-center gap-3 text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[#ECEEF4]";
/** 이전 빌드·캐시 호환용 (part1SectionTitleClass와 동일) */
const part1SectionHeadingClass = part1SectionTitleClass;
const part1BodyClass = "text-[13px] leading-[1.85] text-[#94A3B8]";
const part1CaptionClass = "text-[11px] leading-relaxed text-[#64748B]";

const part1SectionCueClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#A78BFA]/22 bg-[#8B5CF6]/[0.08]";

/** 한 세트의 마이크로 일러스트 — 동일 stroke·캡·파스텔, 섹션별 미묘한 cue만 다름 */
type Part1SectionGlyphKind =
  | "quoteSparkle"
  | "gentleSparkle"
  | "orbitRipple"
  | "sparkleCluster"
  | "softCaution"
  | "compassMinimal";

const GLYPH_SVG_CLASS = "h-4 w-4 text-[#C9C0F0]";

function Part1SectionGlyph({ kind }: { kind: Part1SectionGlyphKind }) {
  const s = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    className: GLYPH_SVG_CLASS,
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
}: {
  id?: string;
  glyph: Part1SectionGlyphKind;
  children: ReactNode;
}) {
  return (
    <h3 id={id} className={part1SectionTitleClass}>
      <span className={part1SectionCueClass} aria-hidden>
        <Part1SectionGlyph kind={glyph} />
      </span>
      <span>{children}</span>
    </h3>
  );
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

  /** 첫 항목 "나" = PART 1 본문 앵커. 나머지는 PART 1 내부 하위 구간(향후 PART 2+와 매핑 예정). */
  const navItems = [
    { id: "part1", label: "나", icon: UserRound, chapter: "PART 1" },
    { id: "part1-strengths", label: "에너지", icon: Zap },
    { id: "part1-caution", label: "관계", icon: Users },
    { id: "part1-signature", label: "소통", icon: Activity },
    { id: "part1-next", label: "앞으로", icon: Compass },
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

      <div className="sticky top-[4.7rem] z-[30] mx-auto w-full max-w-lg">
        <div className="rounded-lg border border-[#8B5CF6]/12 bg-[#070B18]/94 px-1 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.28)] backdrop-blur-md">
          <div className="flex items-stretch justify-between gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const isPrimary = item.id === "part1";
              const isActive = isPrimary ? navPrimaryActive : false;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.id === "part1" ? "PART 1 — 나" : undefined}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => scrollToSection(item.id)}
                  className={[
                    "shrink-0 rounded-md px-1 py-1 text-[9px] transition-colors",
                    isActive ? "bg-[#8B5CF6]/14 text-[#F1F5F9]" : "text-[#64748B] hover:text-[#94A3B8]",
                  ].join(" ")}
                >
                  <span className="flex min-w-[48px] flex-col items-center gap-0.5">
                    {"chapter" in item && item.chapter ? (
                      <span className="text-[7px] font-medium uppercase tracking-[0.12em] text-[#64748B]">
                        {item.chapter}
                      </span>
                    ) : null}
                    <span
                      className={[
                        "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                        isActive ? "border-[#A78BFA]/35 bg-[#8B5CF6]/10 text-[#E8E0FF]" : "border-transparent text-[#64748B]",
                      ].join(" ")}
                    >
                      <item.icon className="h-3 w-3" strokeWidth={1.35} />
                    </span>
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section id="part1" className="scroll-mt-28 mx-auto w-full max-w-lg border-t border-white/[0.06] pt-5">
        <div className="rounded-[22px] border border-white/[0.08] bg-[#070B18]/90 p-4 sm:p-5">
          <header className="border-b border-[#8B5CF6]/10 pb-7">
            <p className={part1LabelClass}>PART 1</p>
            <h2 className={part1MainTitleClass}>
              <span className="block">나는 누굴까?</span>
              <span className="mt-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                WHO AM I?
              </span>
            </h2>
          </header>

          <section id="part1-quote" className="mt-14 scroll-mt-28" aria-labelledby="part1-quote-heading">
            <div className="rounded-2xl border border-[#8B5CF6]/18 bg-[#0c1022]/90 px-5 py-7 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
              <div className="mb-5 flex items-center gap-3">
                <span className={part1SectionCueClass} aria-hidden>
                  <Part1SectionGlyph kind="quoteSparkle" />
                </span>
                <h3 id="part1-quote-heading" className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em] text-[#ECEEF4]">
                  당신을 닮은 한 문장
                </h3>
              </div>
              <p className="font-serif text-[2.75rem] leading-none text-[#A78BFA]" aria-hidden>
                &ldquo;
              </p>
              <p className="-mt-1 text-[1.125rem] font-medium leading-[1.75] tracking-[-0.015em] text-[#E8EDF5] sm:text-[1.2rem]">
                너는 자유로운 바람처럼,
                <br />
                새로운 가능성을 탐색하는 존재야.
              </p>
              <p className={`mt-6 ${part1CaptionClass}`}>
                새로운 생각과 가능성을 발견할 때 가장 너다워져요.
              </p>
            </div>
          </section>

          <section className="mt-16" aria-labelledby="part1-outer-heading">
            <Part1SectionTitle id="part1-outer-heading" glyph="gentleSparkle">
              겉으로 보이는 모습
            </Part1SectionTitle>
            <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className={part1BodyClass}>
                사람들과의 연결 속에서 자연스럽게 분위기를 이끄는 타입이에요.
              </p>
              <button
                type="button"
                className={`mt-4 ml-auto flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#94A3B8]`}
                onClick={() => setOpenOuter((v) => !v)}
              >
                {openOuter ? "접기" : "더보기"}
                <ChevronDown
                  className={["h-3.5 w-3.5 transition", openOuter ? "rotate-180" : ""].join(" ")}
                  strokeWidth={1.35}
                />
              </button>
              {openOuter && (
                <p className={`mt-3 border-t border-white/[0.06] pt-3 ${part1BodyClass}`}>
                  사람들과의 소통을 즐기고, 활발하게 활동하는 모습이 드러납니다. 친구들과의 대화에서 리더십을
                  발휘하고, 새로운 사람들과의 만남에서도 주도적으로 이야기를 이끌어가는 모습이 있습니다.
                </p>
              )}
            </div>
          </section>

          <section className="mt-16" aria-labelledby="part1-inner-heading">
            <Part1SectionTitle id="part1-inner-heading" glyph="orbitRipple">
              내면의 흐름
            </Part1SectionTitle>
            <div className="mt-5 rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className={part1BodyClass}>
                겉은 밝지만, 내면은 생각보다 깊고 민감한 편이에요. 감정을 오래 품고 혼자 정리하려는 경향도
                있어요.
              </p>
              <button
                type="button"
                className={`mt-4 ml-auto flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#94A3B8]`}
                onClick={() => setOpenInner((v) => !v)}
              >
                {openInner ? "접기" : "더보기"}
                <ChevronDown
                  className={["h-3.5 w-3.5 transition", openInner ? "rotate-180" : ""].join(" ")}
                  strokeWidth={1.35}
                />
              </button>
              {openInner && (
                <p className={`mt-3 border-t border-white/[0.06] pt-3 ${part1BodyClass}`}>
                  타인의 감정을 잘 이해하고 지지하려는 모습이 강합니다. 다만 때로는 감정에 쉽게 영향을 받거나,
                  속으로 복잡한 마음을 오래 품을 수 있습니다.
                </p>
              )}
            </div>
          </section>

          <section id="part1-strengths" className="mt-16 scroll-mt-28 border-t border-white/[0.06] pt-12">
            <Part1SectionTitle glyph="sparkleCluster">당신의 강점</Part1SectionTitle>
            <div className="mt-5 flex flex-col gap-3">
              <article className="rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4 shadow-[0_0_24px_rgba(139,92,246,0.04)]">
                <div className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-[#94A3B8]/35 bg-transparent ring-1 ring-[#A78BFA]/15"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-semibold text-[#E2E8F0]">창의적인 사고</p>
                    <p className={`mt-2 ${part1BodyClass}`}>
                      직관적으로 문제를 바라보며 새로운 해결책을 제안하는 힘이 있어요.
                    </p>
                  </div>
                </div>
              </article>
              <article className="rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4 shadow-[0_0_24px_rgba(139,92,246,0.04)]">
                <div className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-[#94A3B8]/35 bg-transparent ring-1 ring-[#A78BFA]/15"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-semibold text-[#E2E8F0]">감정적 이해</p>
                    <p className={`mt-2 ${part1BodyClass}`}>
                      타인의 감정을 깊이 이해하고, 공감하며 지지하는 능력이 뛰어나요.
                    </p>
                  </div>
                </div>
              </article>
              <article className="rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4 shadow-[0_0_24px_rgba(139,92,246,0.04)]">
                <div className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-[#94A3B8]/35 bg-transparent ring-1 ring-[#A78BFA]/15"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-semibold text-[#E2E8F0]">안정감 제공</p>
                    <p className={`mt-2 ${part1BodyClass}`}>
                      주변에 편안함과 신뢰를 주고, 깊은 관계를 맺는 데 강점이 있어요.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section id="part1-caution" className="mt-16 scroll-mt-28" aria-labelledby="part1-caution-heading">
            <Part1SectionTitle id="part1-caution-heading" glyph="softCaution">
              조심하면 좋은 감정 흐름
            </Part1SectionTitle>
            <article className="mt-5 rounded-xl border border-[#8B5CF6]/14 bg-[#0a0d18]/95 p-4 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.06)]">
              <p className={part1BodyClass}>
                스트레스와 감정의 영향을 쉽게 받는 편이에요. 감정에 휩쓸리기 전에, 스스로를 챙기는 시간이
                필요해요.
              </p>
              <button
                type="button"
                className={`mt-4 ml-auto flex items-center gap-1 ${part1CaptionClass} font-medium hover:text-[#94A3B8]`}
                onClick={() => setOpenCaution((v) => !v)}
              >
                {openCaution ? "접기" : "더보기"}
                <ChevronDown
                  className={["h-3.5 w-3.5 transition", openCaution ? "rotate-180" : ""].join(" ")}
                  strokeWidth={1.35}
                />
              </button>
              {openCaution && (
                <p className={`mt-3 border-t border-white/[0.06] pt-3 ${part1BodyClass}`}>
                  작은 일에도 부담을 느끼거나, 감정적으로 흔들릴 수 있습니다. 타인의 감정에 지나치게 영향을
                  받지 않도록 자기 관리가 필요합니다. 감정을 숨기기보다 적절하게 표현하는 연습도 도움이 됩니다.
                </p>
              )}
            </article>
          </section>

          <section id="part1-signature" className="mt-16 scroll-mt-28 border-t border-white/[0.06] pt-12">
            <Part1SectionTitle glyph="compassMinimal">가장 나다운 순간</Part1SectionTitle>
            <div className="mt-5 flex flex-col gap-3">
              <article className="rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4">
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.08] px-1.5 text-[9px] font-semibold tracking-wider text-[#C4B5FD]">
                  01
                </span>
                <p className={`mt-3 ${part1BodyClass}`}>
                  친구들과의 대화 속에서
                  <br />
                  아이디어를 나누며 이야기를 이끌어갈 때
                </p>
              </article>
              <article className="rounded-xl border border-white/[0.08] bg-[#080c18]/95 p-4">
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.08] px-1.5 text-[9px] font-semibold tracking-wider text-[#C4B5FD]">
                  02
                </span>
                <p className={`mt-3 ${part1BodyClass}`}>
                  친구가 힘들어할 때
                  <br />
                  위로하고 함께 시간을 내며 기분을 전환시켜줄 때
                </p>
              </article>
            </div>
          </section>

          <article
            id="part1-next"
            className="mt-16 scroll-mt-28 rounded-xl border border-[#8B5CF6]/16 bg-[#0a0d18] p-5 shadow-[0_0_28px_rgba(139,92,246,0.05)]"
          >
            <p className={`${part1CaptionClass} font-semibold uppercase tracking-[0.14em] text-[#8B7AB8]`}>
              다음 탐험
            </p>
            <p className="mt-2 text-[0.9375rem] font-semibold text-[#ECEEF4]">나의 에너지와 환경</p>
            <p className={`mt-2 ${part1BodyClass}`}>
              에너지가 어디에서 충전되고, 어디에서 소진되는지 이어서 살펴볼게요.
            </p>
            <ChevronDown className="mt-4 h-4 w-4 text-[#A78BFA]/45" strokeWidth={1.35} aria-hidden />
          </article>
        </div>
      </section>
    </div>
  );
}
