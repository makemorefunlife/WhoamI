"use client";

import Image from "next/image";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StitchHomeCta from "@/components/landing/stitch/StitchHomeCta";
import StitchPersonalRadar from "@/components/landing/stitch/StitchPersonalRadar";
import Logo from "@/components/brand/Logo";
import { ROUTES } from "@/constants/routes";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  readStoredReportId,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
import { useAppSession } from "@/lib/routing/useAppSession";
import { useHydrated } from "@/lib/hooks/useHydrated";

import StitchRelationshipRadar from "@/components/landing/stitch/StitchRelationshipRadar";
import StitchDecisionJournalPreview from "@/components/landing/stitch/StitchDecisionJournalPreview";

const EYEBROW_CLASS =
  "mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald";

type Props = {
  resumeLoading: boolean;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
};

function useScrollReveal() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-stitch-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("stitch-reveal-visible");
          }
        }
      },
      { threshold: 0.08 },
    );

    for (const el of sections) {
      el.classList.add("stitch-reveal");
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return mainRef;
}

function renderFormattedText(text?: string, highlightSubstr?: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(Aha It['’]s me!?|AHA IT['’]S ME!?)/gi);
    return (
      <span key={lIdx} className={lIdx > 0 ? "block mt-1" : "block"}>
        {parts.map((part, pIdx) => {
          if (/^Aha It['’]s me!?$/i.test(part.trim())) {
            return (
              <span key={pIdx} className="font-bold text-primary">
                {part}
              </span>
            );
          }
          if (highlightSubstr && part.includes(highlightSubstr)) {
            const subParts = part.split(highlightSubstr);
            return subParts.map((sp, sIdx) => (
              <span key={sIdx}>
                {sp}
                {sIdx < subParts.length - 1 ? (
                  <span className="font-semibold text-primary">
                    {highlightSubstr}
                  </span>
                ) : null}
              </span>
            ));
          }
          return part;
        })}
      </span>
    );
  });
}

export default function StitchLandingPage({
  resumeLoading,
  creatingReport,
  onOpenStartChoice,
}: Props) {
  const router = useRouter();
  const mainRef = useScrollReveal();
  const { locale, messages, href: localize } = useLocale();
  const { reportId: sessionReportId } = useAppSession({ hydrate: false });
  const hydrated = useHydrated();
  const [storedReportId, setStoredReportId] = useState("");

  useEffect(() => {
    setStoredReportId(readStoredReportId());
  }, []);

  const reportId = hydrated
    ? sessionReportId?.trim() || storedReportId
    : "";

  const reportCards = [
    {
      img: "/landing/relationships/lovers.png",
      eyebrow: "Lovers",
      title: messages.landing.reportsLoverTitle,
      desc: messages.landing.reportsLoverDesc,
    },
    {
      img: "/landing/relationships/couple.png",
      eyebrow: "Couples",
      title: messages.landing.reportsCoupleTitle,
      desc: messages.landing.reportsCoupleDesc,
    },
    {
      img: "/landing/relationships/family.png",
      eyebrow: "Family",
      title: messages.landing.reportsFamilyTitle,
      desc: messages.landing.reportsFamilyDesc,
    },
    {
      img: "/landing/relationships/colleagues.png",
      eyebrow: "Colleagues",
      title: messages.landing.reportsColleagueTitle,
      desc: messages.landing.reportsColleagueDesc,
    },
    {
      img: "/landing/relationships/friends.png",
      eyebrow: "Friends",
      title: messages.landing.reportsFriendTitle,
      desc: messages.landing.reportsFriendDesc,
    },
  ];

  const philosophyQuestions = [
    {
      text: messages.landing.philosophyPoint1,
      highlight: messages.landing.philosophyPoint1Highlight,
    },
    {
      text: messages.landing.philosophyPoint2,
      highlight: messages.landing.philosophyPoint2Highlight,
    },
    {
      text: messages.landing.philosophyPoint3,
      highlight: messages.landing.philosophyPoint3Highlight,
    },
  ];

  return (
    <div className="stitch-landing overflow-x-hidden">
      <main
        ref={mainRef}
        className="relative mx-auto max-w-[1200px] overflow-hidden px-edge-margin-mobile pb-12 pt-6 md:px-edge-margin-desktop md:pb-20 md:pt-10"
      >
        <section
          data-stitch-reveal
          className="stitch-hero-panel relative mx-auto flex w-full max-w-4xl flex-col items-center overflow-hidden rounded-extra-extra-large stitch-reveal-visible"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-emerald-soft/80 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent-rose-soft blur-2xl" aria-hidden />
          <div className="relative w-full min-h-[min(500px,85dvh)] md:min-h-[380px]">
            <div className="flex min-h-[inherit] flex-col justify-center items-center p-8 md:p-14 text-center">
              <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
                <div className="mb-4 flex justify-center">
                  <Logo size={42} href={localize("/")} priority />
                </div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  AHA IT&apos;S ME
                </p>
                {/* 메인 타이틀 (H1) */}
                <h1 className="stitch-headline mb-4 whitespace-pre-line text-balance text-[2rem] leading-[1.25] font-normal break-keep sm:text-3xl md:text-4xl lg:text-[2.65rem] text-primary">
                  {messages.landing.heroTitle}
                </h1>

                {/* 서브 타이틀 (H2) */}
                <h2 className="mb-5 whitespace-pre-line text-center text-lg font-semibold text-primary/95 break-keep sm:text-xl md:text-2xl max-w-xl">
                  {messages.landing.heroSubtitle}
                </h2>

                {/* 본문 카피 1 (간결하게 압축) */}
                <p className="mb-4 whitespace-pre-line text-center text-base sm:text-lg leading-relaxed text-on-surface-variant/90 break-keep max-w-xl font-normal">
                  {messages.landing.heroBody1 || messages.landing.heroSubtitleLine1}
                </p>

                {/* 본문 카피 2 (캡션 스타일, 작은 폰트와 부드러운 톤, margin-top: 20px) */}
                <div className="mt-5 mb-8 whitespace-pre-line text-center text-xs sm:text-sm leading-relaxed text-on-surface-variant/70 break-keep max-w-xl">
                  {renderFormattedText(messages.landing.heroBody2 || messages.landing.heroHook)}
                </div>

                {/* CTA 버튼 (시작하기 →) */}
                <StitchHomeCta
                  resumeLoading={resumeLoading}
                  creatingReport={creatingReport}
                  onOpenStartChoice={onOpenStartChoice}
                />
              </div>
            </div>
          </div>
        </section>

        {/* PRINCIPLES Section (4-Step Process Flow with Icon Images & Connecting Arrows) */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap text-left"
        >
          <div className="mb-6 text-left">
            <span className={EYEBROW_CLASS}>
              {messages.landing.frameworkEyebrow || "PRINCIPLES"}
            </span>
            <h2 className="stitch-headline text-2xl font-bold leading-tight text-primary sm:text-3xl text-left">
              {messages.landing.frameworkHeadline}
            </h2>
          </div>

          <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 sm:p-8 shadow-sm text-left">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
              {/* Card 01 */}
              <div className="rounded-2xl bg-[#113328] p-5 text-center text-[#fffdf8] shadow-md flex flex-col items-center justify-between min-h-[210px] border border-[#d4af37]/30">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#e5c158]/80 block mb-1">01</span>
                  <h4 className="text-base sm:text-lg font-bold text-[#fffdf8]">
                    {messages.landing.frameworkStep1Title || "자아 이해"}
                  </h4>
                </div>
                <div className="my-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#163e30] border border-[#e5c158]/40 flex items-center justify-center shadow-inner">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#e5c158]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 3.38-.4 4.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.43-5.02 0-3.31-2.69-6-6-6s-6 2.69-6 6c0 .87.08 1.8.23 2.62" />
                    <path d="M8.58 19.38c.67.67 1.8 1.62 3.42 1.62 1.48 0 2.54-.7 3.31-1.39" />
                    <path d="M20.56 18.06A9.97 9.97 0 0 0 21 16c0-4.97-4.03-9-9-9s-9 4.03-9 9c0 1.34.29 2.61.82 3.76" />
                    <path d="M6 10a6 6 0 0 1 12 0c0 .9-.12 1.83-.34 2.7" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#e5c158]/90 tracking-tight">
                  {messages.landing.frameworkStep1Desc || "(천성 vs 실현)"}
                </span>
              </div>

              {/* Card 02 */}
              <div className="rounded-2xl bg-[#113328] p-5 text-center text-[#fffdf8] shadow-md flex flex-col items-center justify-between min-h-[210px] border border-[#d4af37]/30">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#e5c158]/80 block mb-1">02</span>
                  <h4 className="text-base sm:text-lg font-bold text-[#fffdf8]">
                    {messages.landing.frameworkStep2Title || "타인 이해"}
                  </h4>
                </div>
                <div className="my-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#163e30] border border-[#e5c158]/40 flex items-center justify-center shadow-inner">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#e5c158]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#e5c158]/90 tracking-tight">
                  {messages.landing.frameworkStep2Desc || "(관계 패턴)"}
                </span>
              </div>

              {/* Card 03 */}
              <div className="rounded-2xl bg-[#113328] p-5 text-center text-[#fffdf8] shadow-md flex flex-col items-center justify-between min-h-[210px] border border-[#d4af37]/30">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#e5c158]/80 block mb-1">03</span>
                  <h4 className="text-base sm:text-lg font-bold text-[#fffdf8]">
                    {messages.landing.frameworkStep3Title || "더 나은 선택"}
                  </h4>
                </div>
                <div className="my-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#163e30] border border-[#e5c158]/40 flex items-center justify-center shadow-inner">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#e5c158]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#e5c158]/90 tracking-tight">
                  {messages.landing.frameworkStep3Desc || "(시너지 & 강점)"}
                </span>
              </div>

              {/* Card 04 */}
              <div className="rounded-2xl bg-[#113328] p-5 text-center text-[#fffdf8] shadow-md flex flex-col items-center justify-between min-h-[210px] border border-[#d4af37]/30">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#e5c158]/80 block mb-1">04</span>
                  <h4 className="text-base sm:text-lg font-bold text-[#fffdf8]">
                    {messages.landing.frameworkStep4Title || "결정 회고"}
                  </h4>
                </div>
                <div className="my-3 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#163e30] border border-[#e5c158]/40 flex items-center justify-center shadow-inner">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#e5c158]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M18 12a6 6 0 1 1-6-6" />
                    <polyline points="18 9 18 12 15 12" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#e5c158]/90 tracking-tight">
                  {messages.landing.frameworkStep4Desc || "(성장 & 패턴)"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 퍼스널 분석 섹션 (Below Principles) */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap text-left"
        >
          <div className="mb-6 text-left">
            <span className={EYEBROW_CLASS}>
              {messages.landing.personalEyebrow || "PERSONAL ANALYSIS"}
            </span>
            <h2 className="stitch-headline whitespace-pre-line text-3xl font-bold leading-tight text-primary md:text-4xl text-left">
              {messages.landing.personalHeadline}
            </h2>
          </div>
          <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:p-12 text-left">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
              <div className="order-2 lg:order-1">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="border-t-2 border-accent-rose/70 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-rose">
                      {messages.landing.personalInnateEyebrow || "INNATE"}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-primary">
                      {messages.landing.personalInnateTitle}
                    </h4>
                    <div className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                      <p className="text-on-surface-variant/80">
                        {messages.landing.personalInnateDescLine1}
                      </p>
                      <p className="font-medium text-primary">
                        {messages.landing.personalInnateDescLine2}
                      </p>
                    </div>
                  </div>
                  <div className="border-t-2 border-accent-emerald/70 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald">
                      {messages.landing.personalCurrentEyebrow || "CURRENT"}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-primary">
                      {messages.landing.personalCurrentTitle}
                    </h4>
                    <div className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                      <p className="text-on-surface-variant/80">
                        {messages.landing.personalCurrentDescLine1}
                      </p>
                      <p className="font-medium text-primary">
                        {messages.landing.personalCurrentDescLine2}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 rounded-extra-large border border-accent-emerald/30 bg-secondary-container/60 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald">
                    {messages.landing.personalGapLabel}
                  </p>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-on-surface-variant whitespace-pre-line">
                    {messages.landing.personalGapBodyLine1}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-primary whitespace-pre-line">
                    {renderFormattedText(
                      messages.landing.personalGapBodyLine2,
                      messages.landing.personalGapBodyLine2Highlight,
                    )}
                  </p>
                </div>
              </div>
              <div className="order-1 flex items-center justify-center lg:order-2">
                <StitchPersonalRadar labels={messages.landing.radarLabels} />
              </div>
            </div>
            <div className="mt-10 flex justify-start md:justify-end">
              <LocaleLink href={blueprintPath(reportId)} className="stitch-cta-secondary">
                {messages.landing.personalCta}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </LocaleLink>
            </div>
          </div>
        </section>

        {/* BRAND PHILOSOPHY Section (Below Personal Analysis) */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="grid gap-10 rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-14">
            <div>
              <span className={EYEBROW_CLASS}>
                {messages.landing.philosophyEyebrow || "BRAND PHILOSOPHY"}
              </span>
              <h3 className="stitch-headline whitespace-pre-line text-3xl leading-tight font-normal md:text-4xl">
                {messages.landing.philosophyHeadline}
              </h3>
              {messages.landing.philosophySubheadline ? (
                <p className="mt-4 whitespace-pre-line text-sm sm:text-base text-on-surface-variant/80">
                  {messages.landing.philosophySubheadline}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col justify-between">
              <ul className="divide-y divide-outline-variant/30 border-y border-outline-variant/30">
                {philosophyQuestions.map(({ text, highlight }, i) => (
                  <li key={i} className="flex gap-5 py-5">
                    <span className="text-sm text-accent-rose font-medium">
                      0{i + 1}
                    </span>
                    <div className="text-base leading-relaxed text-on-surface-variant">
                      {renderFormattedText(text, highlight)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-outline-variant/30 pt-6">
                <p className="text-sm sm:text-base leading-relaxed text-primary/90 whitespace-pre-line font-medium text-center md:text-left">
                  {renderFormattedText(messages.landing.philosophyConclusion)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 mx-auto max-w-xl text-center px-4">
            <p className="text-base sm:text-lg leading-relaxed text-on-surface-variant whitespace-pre-line">
              {renderFormattedText(messages.landing.philosophyBridge)}
            </p>
          </div>
        </section>

        {/* Relationship Reports Grid (Swapped: Placed BEFORE FROM ME TO US) */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="mb-12">
            <span className={EYEBROW_CLASS}>Relationship Reports</span>
            <h3 className="stitch-headline text-3xl leading-tight font-normal md:text-4xl">
              {messages.landing.reportsHeadline}
            </h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map(({ img, eyebrow, title, desc }) => (
              <div
                key={eyebrow}
                className="relative flex flex-col justify-between rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 sm:h-24 sm:w-24">
                    <Image
                      src={img}
                      alt={title}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                  <p className="pr-20 text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald sm:pr-24">
                    {eyebrow}
                  </p>
                  <h4 className="mt-3 pr-20 text-2xl font-semibold text-primary sm:pr-24">
                    {title}
                  </h4>
                  <p className="mt-4 pr-16 text-sm leading-relaxed text-on-surface-variant">
                    {desc}
                  </p>
                </div>
                <LocaleLink
                  href={relationHubPath(reportId)}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-accent-emerald/50 px-5 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-accent-emerald hover:text-on-primary"
                >
                  {messages.landing.reportsCtaLabel} <span aria-hidden>→</span>
                </LocaleLink>
              </div>
            ))}

            <div className="flex flex-col justify-between rounded-extra-extra-large border border-primary bg-primary p-8 text-on-primary shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-primary/70">
                  Start Now
                </p>
                <h4 className="mt-3 text-2xl font-semibold">
                  {messages.landing.reportsStartTitle}
                </h4>
                <p className="mt-4 text-sm leading-relaxed text-on-primary/80">
                  {messages.landing.reportsStartDesc}
                </p>
              </div>
              <LocaleLink
                href={relationHubPath(reportId)}
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-on-primary/60 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-on-primary hover:text-primary"
              >
                {messages.landing.reportsStartCta} <span aria-hidden>→</span>
              </LocaleLink>
            </div>
          </div>
        </section>

        {/* 관계 분석 섹션 — FROM ME TO US (Swapped: Placed AFTER Relationship Reports) */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap text-left"
        >
          <div className="mb-6 text-left">
            <span className={EYEBROW_CLASS}>
              {messages.landing.relBridgeEyebrow || "FROM ME TO US"}
            </span>
            <h2 className="stitch-headline whitespace-pre-line text-3xl font-bold leading-tight text-primary md:text-4xl text-left">
              {messages.landing.relBridgeHeadline}
            </h2>
          </div>

          <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:p-12 text-left space-y-8">
            <p className="whitespace-pre-line text-base leading-relaxed text-on-surface-variant max-w-2xl">
              {messages.landing.relBridgeSupporting}
            </p>

            <div className="my-6 flex justify-center">
              <StitchRelationshipRadar
                sampleBadgeText={messages.landing.relBridgeSampleBadge || "예시 샘플 데이터"}
              />
            </div>

            <div className="border-t border-outline-variant/20 pt-6 space-y-3 max-w-2xl">
              <h4 className="stitch-headline whitespace-pre-line text-xl font-semibold text-primary sm:text-2xl">
                {messages.landing.relBridgeStatement}
              </h4>
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-on-surface-variant">
                {renderFormattedText(
                  messages.landing.relBridgeStatementSupporting,
                  messages.landing.relBridgeHighlight,
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 결정일기 섹션 */}
        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap text-left"
        >
          <div className="mb-6 text-left">
            <span className={EYEBROW_CLASS}>
              {messages.landing.journalEyebrow || "DECISION JOURNAL"}
            </span>
            <h2 className="stitch-headline whitespace-pre-line text-3xl font-bold leading-tight text-primary md:text-4xl text-left">
              {messages.landing.journalHeadline}
            </h2>
          </div>

          <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:p-12 text-left space-y-8">
            <p className="whitespace-pre-line text-base leading-relaxed text-on-surface-variant max-w-2xl">
              {renderFormattedText(messages.landing.journalBody)}
            </p>

            <div className="my-6">
              <StitchDecisionJournalPreview />
            </div>

            <div className="border-t border-outline-variant/20 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-base sm:text-lg font-medium leading-relaxed text-primary whitespace-pre-line">
                {messages.landing.journalClosing}
              </p>
              <LocaleLink href={DECISION_HUB_PATH} className="stitch-cta-secondary shrink-0 self-end sm:self-center">
                {messages.landing.journalCta}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </LocaleLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-section-gap rounded-t-extra-extra-large border-t border-outline-variant/30 bg-primary px-edge-margin-mobile py-16 pb-32 text-on-primary md:px-edge-margin-desktop">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-4 flex items-center gap-2">
              <Logo size={32} href={localize("/")} onDarkBackground />
              <h5 className="text-2xl font-semibold text-on-primary">
                Aha It&apos;s me!
              </h5>
            </div>
            <h6 className="mt-4 text-xl font-medium leading-snug text-on-primary/95 whitespace-pre-line">
              {messages.landing.footerPhilosophy || "나를 오해하지 말고,\n이해하세요."}
            </h6>
            <p className="mt-3 max-w-md text-xs sm:text-sm leading-relaxed text-on-primary/75 whitespace-pre-line">
              {messages.landing.footerDesc || messages.landing.footerTagline}
            </p>
          </div>

          <div className="md:col-span-2">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.account.title}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.accountProfile}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.account.profile}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.accountBilling}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.account.billing}
                </LocaleLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.footer.support}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.about}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.about}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.pricing}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.pricing}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.faq}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.faq}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.contact}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.contact}
                </LocaleLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.footer.legal}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.terms}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.terms}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.privacy}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.privacy}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.refund}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.refund}
                </LocaleLink>
              </li>
              {locale === "en-US" ? (
                <li>
                  <LocaleLink
                    href={ROUTES.doNotSell}
                    className="transition hover:text-accent-rose-soft"
                  >
                    {messages.cookieBanner.doNotSell}
                  </LocaleLink>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-[1200px] flex-col justify-between gap-4 border-t border-on-primary/15 pt-8 text-xs md:flex-row">
          <div className="space-y-3 text-on-primary/60">
            <p>
              © {new Date().getFullYear()} Aha It&apos;s me!{" "}
              {messages.footer.copyrightSuffix}
            </p>
            {locale === "ko-KR" ? (
              <div className="max-w-xl space-y-0.5 text-[11px] leading-relaxed text-on-primary/55">
                <p>
                  {messages.footer.business.companyLabel}:{" "}
                  {messages.footer.business.companyName}
                </p>
                <p>
                  {messages.footer.business.ceoLabel}:{" "}
                  {messages.footer.business.ceoName}
                </p>
                <p>
                  {messages.footer.business.bizNumberLabel}:{" "}
                  {messages.footer.business.bizNumber}
                </p>
                <p>
                  {messages.footer.business.mailOrderLabel}:{" "}
                  {messages.footer.business.mailOrderNumber}
                </p>
                <p>
                  {messages.footer.business.addressLabel}:{" "}
                  {messages.footer.business.address}
                </p>
                <p>
                  {messages.footer.business.phoneLabel}:{" "}
                  {messages.footer.business.phone}
                </p>
                <p>
                  {messages.footer.business.emailLabel}:{" "}
                  <a
                    href={`mailto:${messages.footer.business.email}`}
                    className="underline underline-offset-2 hover:text-on-primary"
                  >
                    {messages.footer.business.email}
                  </a>
                </p>
              </div>
            ) : null}
          </div>
          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 text-on-primary/55"
            aria-label="Hub shortcuts"
          >
            <LocaleLink href={blueprintPath(reportId)} className="hover:text-on-primary">
              {messages.nav.blueprint}
            </LocaleLink>
            <LocaleLink href={relationHubPath(reportId)} className="hover:text-on-primary">
              {messages.nav.relationLab}
            </LocaleLink>
            <LocaleLink href={DECISION_HUB_PATH} className="hover:text-on-primary">
              {messages.nav.decision}
            </LocaleLink>
          </nav>
        </div>
      </footer>
    </div>
  );
}
