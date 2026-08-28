"use client";

/**
 * Friend Premium — FriendReportViewModel renderer.
 *
 * 9-chapter IA following the Romantic report's editorial hierarchy:
 * - Unnumbered Top Overview ("◤ 한눈에 보는 우리 우정") with 3 score cards
 * - Renders Chapters 1 through 9 sequentially using standard ChapterSection headers.
 */
import { useEffect, useState } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import type { FriendReportViewModel } from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pick } from "@/lib/relationship/friend/friendCopy";
import {
  FriendshipOverviewSection,
  Chapter02WhyUs,
  Chapter03Roles,
  Chapter04Tempo,
  Chapter05Teamwork,
  Chapter06CounselingGroup,
  Chapter07ConflictRepair,
  Chapter08Boundaries,
  Chapter09Distance,
  Chapter10Playbook,
  FriendHero,
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

/** ViewModel 전체를 9개 챕터 + 탑 한눈에 보기 에디토리얼 레이아웃으로 조립 — Friend production 진입점. */
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

  const navItems: NavItem[] = [
    { id: "overview_cards", label: pick(locale, "Overview", "한눈에 보기") },
    { id: "ch02_why_us", label: pick(locale, "Ch 1 · Why Us", "Ch 1 · 끌리는 이유") },
    { id: "ch03_roles", label: pick(locale, "Ch 2 · Friendship Roles", "Ch 2 · 어떤 친구인가") },
    { id: "ch04_tempo", label: pick(locale, "Ch 3 · Daily Tempo", "Ch 3 · 소통 템포") },
    { id: "ch05_teamwork", label: pick(locale, "Ch 4 · Play Teamwork", "Ch 4 · 함께 놀 때") },
    { id: "ch06_counseling_group", label: pick(locale, "Ch 5 · Counseling & Group", "Ch 5 · 고민 & 다자간") },
    { id: "ch07_conflict_repair", label: pick(locale, "Ch 6 · Conflict Repair", "Ch 6 · 갈등과 회복") },
    { id: "ch08_boundaries", label: pick(locale, "Ch 7 · Expectations", "Ch 7 · 기대의 경계") },
    { id: "ch09_distance_durability", label: pick(locale, "Ch 8 · Distance & Durability", "Ch 8 · 우정의 거리감") },
    { id: "ch10_playbook", label: pick(locale, "Ch 9 · Manual & Prescriptions", "Ch 9 · 사용설명서") },
  ];

  const [active, setActive] = useState(navItems[0]?.id ?? "overview_cards");
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

      <main>
        <FriendHero {...ctx} />
        <FriendshipOverviewSection {...ctx} />
        <Chapter02WhyUs {...ctx} />
        <Chapter03Roles {...ctx} />
        <Chapter04Tempo {...ctx} />
        <Chapter05Teamwork {...ctx} />
        <Chapter06CounselingGroup {...ctx} />
        <Chapter07ConflictRepair {...ctx} />
        <Chapter08Boundaries {...ctx} />
        <Chapter09Distance {...ctx} />
        <Chapter10Playbook {...ctx} />
      </main>

      <footer className="border-t border-rel-line">
        <div className="mx-auto max-w-[880px] px-5 py-12 sm:px-8">
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
