"use client";

/**
 * Friend Premium — FriendReportViewModel renderer.
 *
 * Editorial redesign ported from the Lovable "Inner Compass Reports" concept
 * project (/friend-concept route) at the user's explicit request — full
 * production-data migration onto that design, replacing the previous
 * dark card-based `RelationshipReportLayout` rendering for the Friend domain
 * only. Work/Family/Marriage domains and their SectionRenderer.tsx files are
 * untouched.
 *
 * Fonts: reuses the same Noto Sans KR / Noto Serif KR web-font substitution
 * already established for the Romantic V4 dev prototype
 * (app/dev/romantic-v4-content-prototype/page.tsx) — the `rel-*`/`v4-*`
 * design tokens these fonts hook into already live in app/globals.css.
 */
import { useEffect, useState } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import type { FriendReportViewModel } from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick } from "@/lib/relationship/friend/friendCopy";
import {
  DimensionsSection,
  FriendHero,
  HiddenFlowSection,
  ManualSection,
  RiskSection,
  SignalsSection,
  SocialDnaSection,
  WhyYouMeUsChapter,
} from "@/components/relationship/friend/editorial/FriendEditorialSections";

const relSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-sans-var",
});
const relSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-serif-var",
});

type NavItem = { id: string; label: string };

/** ViewModel 전체를 새 에디토리얼 레이아웃으로 조립 — Friend production 진입점. */
export function FriendReportViewModelView({
  vm,
  viewerIsReportA,
}: {
  vm: FriendReportViewModel;
  kindLabel?: string;
  viewerIsReportA: boolean;
}) {
  const { locale } = useLocale();
  const ctx = { vm, viewerIsReportA, locale };

  const types = new Set(vm.sections.map((s) => s.type));
  const navItems: NavItem[] = [
    { id: "overview", label: pick(locale, "Overview", "한눈에 보기") },
    ...(types.has("why_you_me_us")
      ? [{ id: "why_you_me_us", label: pick(locale, "Why us", "서로를 선택한 이유") }]
      : []),
    ...(types.has("compare_table") || types.has("psych_radar")
      ? [{ id: "part1", label: pick(locale, "Our differences", "우리 차이") }]
      : []),
    ...(types.has("social_dna") ? [{ id: "part2", label: "Social DNA" }] : []),
    ...(types.has("hidden_flow") || types.has("soulmate")
      ? [{ id: "part3", label: pick(locale, "Hidden flow", "숨은 흐름") }]
      : []),
    ...(types.has("breakup_guide") ? [{ id: "part4", label: pick(locale, "Guardrails", "방어벽") }] : []),
    ...(types.has("de_escalation") || types.has("prescription")
      ? [{ id: "part5", label: pick(locale, "Manual", "사용설명서") }]
      : []),
  ];

  const [active, setActive] = useState(navItems[0]?.id ?? "overview");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    for (const item of navItems) {
      const el = document.getElementById(item.id);
      if (el) io.observe(el);
    }
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems.map((n) => n.id).join(",")]);

  const activeIndex = Math.max(0, navItems.findIndex((s) => s.id === active));

  return (
    <div
      className={`min-h-screen bg-rel-bg font-rel-sans text-rel-ink antialiased ${relSans.variable} ${relSerif.variable}`}
      lang={locale === "en-US" ? "en" : "ko"}
    >
      <div className="sticky top-0 z-30 border-b border-rel-line bg-rel-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[820px] items-center justify-between gap-4 px-5 py-2.5 sm:px-8">
          <span className="min-w-0 truncate font-rel-sans text-[11.5px] tracking-[0.06em] text-rel-ink-soft">
            <span className="mr-2 text-rel-deep">{String(activeIndex + 1).padStart(2, "0")}</span>
            {navItems[activeIndex]?.label}
          </span>
          <nav className="hidden shrink-0 gap-4 sm:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`font-rel-sans text-[11px] tracking-[0.06em] transition-colors ${
                  item.id === active ? "text-rel-deep" : "text-rel-ink-mute hover:text-rel-ink-soft"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="h-[2px] w-full bg-rel-line">
          <div
            className="h-full bg-rel-deep transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <main>
        <FriendHero {...ctx} />
        <SignalsSection {...ctx} />
        <WhyYouMeUsChapter {...ctx} />
        <DimensionsSection {...ctx} />
        <SocialDnaSection {...ctx} />
        <HiddenFlowSection {...ctx} />
        <RiskSection {...ctx} />
        <ManualSection {...ctx} />
      </main>

      <footer className="border-t border-rel-line">
        <div className="mx-auto max-w-[820px] px-5 py-12 sm:px-8">
          <p className="font-rel-sans text-[11.5px] leading-[1.9] text-rel-ink-mute">
            {pick(
              locale,
              "This report is an interpretation based on both people's answers — meant to help you understand each other a little better, not to define who you are.",
              "이 리포트는 두 사람의 응답을 바탕으로 한 해석이며, 사람을 규정하기 위한 것이 아니라 서로를 조금 더 잘 이해하기 위한 참고 자료입니다.",
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
