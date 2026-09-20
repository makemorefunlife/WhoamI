"use client";

import type { ReactNode } from "react";
import { ArrowRight, CircleDot, GitMerge, Sparkles, type LucideIcon } from "lucide-react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { AboutReveal } from "@/components/about/AboutReveal";

/**
 * About page — ported from the "Inner Compass Reports" Lovable prototype
 * (src/components/about/AboutPage.tsx) into this project's own stack:
 * Next.js routing (LocaleLink), this project's i18n (messages.about), and
 * the site's shared header/footer (already wrapping every page via
 * StitchAppChrome, so none is rendered here). Visual design only — no
 * Lovable code was copied wholesale. Tokens/classes live in
 * app/about-theme.css, scoped under .about-page.
 */

const paragraph =
  "about-sans about-text-ink-soft text-[15px] leading-[1.9] sm:text-[16px]";

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="about-eyebrow">{children}</span>
      <span className="about-divider" aria-hidden />
    </div>
  );
}

function Statement({ children }: { children: ReactNode }) {
  return (
    <AboutReveal>
      <p className="about-serif about-text-ink mx-auto max-w-[760px] whitespace-pre-line text-balance text-center text-[27px] leading-[1.45] break-keep sm:text-[42px] sm:leading-[1.38]">
        {children}
      </p>
    </AboutReveal>
  );
}

/** Two overlapping circles closing the distance — the hero's line-art beat. */
function ConnectionDrawing({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 420 220"
      role="img"
      aria-label={label}
      className="about-text-deep h-auto w-full"
    >
      <path
        d="M84 148C132 88 173 86 210 116C247 146 288 145 336 77"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        opacity=".28"
      />
      <circle cx="84" cy="148" r="42" fill="var(--about-sage-soft)" />
      <circle cx="336" cy="77" r="42" fill="var(--about-blush-soft)" />
      <circle cx="84" cy="148" r="8" fill="currentColor" opacity=".86" />
      <circle cx="336" cy="77" r="8" fill="var(--about-blush)" />
      <circle
        cx="210"
        cy="116"
        r="5"
        fill="var(--about-bg)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M195 103L210 116L226 96" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type Step = { number: string; title: string; body: string };

/** Minimal 01 / 02 / 03 step row, reused for both "understand earlier" and "start light". */
function StepFlow({ steps }: { steps: Step[] }) {
  return (
    <div className="relative mt-12 grid gap-8 sm:grid-cols-3 sm:gap-5">
      <div
        className="absolute left-[12%] right-[12%] top-4 hidden h-px sm:block"
        style={{ background: "var(--about-line)" }}
        aria-hidden
      />
      {steps.map((step) => (
        <div
          key={step.number}
          className="relative grid grid-cols-[42px_1fr] gap-4 sm:block sm:text-center"
        >
          <span
            className="about-border-deep about-text-deep about-sans relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold sm:mx-auto"
            style={{ background: "var(--about-bg)" }}
          >
            {step.number}
          </span>
          <div>
            <h3 className="about-serif about-text-ink text-[19px] sm:mt-5">{step.title}</h3>
            <p className="about-sans about-text-ink-soft mt-2 text-[13.5px] leading-[1.75] break-keep">
              {step.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PillarBlock({
  icon: Icon,
  title,
  body,
  delay,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <AboutReveal
      delay={delay}
      className="about-border-line border-b px-2 py-9 last:border-b-0 sm:border-b-0 sm:px-7 sm:py-11"
    >
      <Icon className="about-text-deep h-5 w-5" strokeWidth={1.4} aria-hidden />
      <h3 className="about-serif about-text-ink mt-7 text-[30px]">{title}</h3>
      <p className="about-sans about-text-ink-soft mt-4 whitespace-pre-line text-[14px] leading-[1.85] break-keep">
        {body}
      </p>
    </AboutReveal>
  );
}

export default function AboutPageContent() {
  const { messages } = useLocale();
  const t = messages.about;

  const pillars: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: CircleDot, title: t.pillarMeTitle, body: t.pillarMeBody },
    { icon: GitMerge, title: t.pillarRelTitle, body: t.pillarRelBody },
    { icon: Sparkles, title: t.pillarDecisionTitle, body: t.pillarDecisionBody },
  ];

  const understandSteps: Step[] = [
    { number: t.earlyStep1Number, title: t.earlyStep1Title, body: t.earlyStep1Body },
    { number: t.earlyStep2Number, title: t.earlyStep2Title, body: t.earlyStep2Body },
    { number: t.earlyStep3Number, title: t.earlyStep3Title, body: t.earlyStep3Body },
  ];

  const fitQuestions = [t.fitQuestion1, t.fitQuestion2, t.fitQuestion3, t.fitQuestion4];
  const buildLines = [t.buildLine1, t.buildLine2, t.buildLine3, t.buildLine4];

  return (
    <div className="about-page about-sans about-text-ink">
      {/* 1. HERO */}
      <section className="mx-auto grid w-full max-w-[1120px] items-center gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.2fr_.8fr] lg:py-32">
        <AboutReveal>
          <SectionLabel>{t.heroEyebrow}</SectionLabel>
          <h1 className="about-serif about-text-ink mt-8 max-w-[760px] text-balance text-[38px] leading-[1.22] break-keep sm:text-[64px] sm:leading-[1.17]">
            {t.heroHeadline1}
            <br />
            {t.heroHeadline2}
          </h1>
          <div className="mt-9 max-w-[570px] space-y-5">
            <p className={paragraph}>{t.heroBody1}</p>
            <p className="about-serif about-text-ink whitespace-pre-line text-[18px] leading-[1.8] break-keep sm:text-[22px]">
              {t.heroQuote}
            </p>
            <p className={paragraph}>{t.heroBody2}</p>
            <p className={paragraph}>{t.heroMission}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <LocaleLink href={ROUTES.surveyV2} className="about-cta-primary">
              {t.heroCtaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </LocaleLink>
            <LocaleLink href={ROUTES.relationships} className="about-cta-secondary">
              {t.heroCtaSecondary}
            </LocaleLink>
          </div>
        </AboutReveal>
        <AboutReveal delay={120} className="mx-auto w-full max-w-[420px] lg:max-w-none">
          <ConnectionDrawing label={t.heroEyebrow} />
        </AboutReveal>
      </section>

      {/* 2. WHY */}
      <section className="about-border-line about-bg-sage border-y px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[820px]">
          <AboutReveal>
            <SectionLabel>{t.whyLabel}</SectionLabel>
            <h2 className="about-serif about-text-ink mt-7 text-[32px] leading-[1.35] break-keep sm:text-[48px]">
              {t.whyHeadline1}
              <br />
              {t.whyHeadline2}
            </h2>
            <div className="mt-8 max-w-[560px] space-y-5">
              <p className={paragraph}>{t.whyBody1}</p>
              <p className={paragraph}>{t.whyBody2}</p>
            </div>
          </AboutReveal>
          <div className="py-20 sm:py-28">
            <Statement>{t.whyStatement}</Statement>
          </div>
          <AboutReveal>
            <p className={`${paragraph} ml-auto max-w-[500px] break-keep`}>
              {t.whyClosingPrefix}
              <span className="about-border-deep about-text-deep border-b font-semibold">
                {t.whyClosingHighlight}
              </span>
              {t.whyClosingSuffix}
            </p>
          </AboutReveal>
        </div>
      </section>

      {/* 3. UNDERSTAND EARLIER */}
      <section className="mx-auto max-w-[920px] px-5 py-24 sm:px-8 sm:py-32">
        <AboutReveal>
          <SectionLabel>{t.earlyLabel}</SectionLabel>
          <h2 className="about-serif about-text-ink mt-7 text-[33px] leading-[1.3] break-keep sm:text-[52px]">
            {t.earlyHeadline1}
            <br />
            {t.earlyHeadline2}
          </h2>
          <div className="mt-8 max-w-[600px] space-y-5">
            <p className={paragraph}>{t.earlyBody1}</p>
            <p className={paragraph}>{t.earlyBody2}</p>
          </div>
        </AboutReveal>
        <StepFlow steps={understandSteps} />
        <div className="about-border-line my-20 border-y py-14 sm:my-28 sm:py-20">
          <Statement>{t.earlyStatement}</Statement>
        </div>
        <AboutReveal>
          <p className={`${paragraph} mx-auto max-w-[580px] whitespace-pre-line text-center break-keep`}>
            {t.earlyBody3}
          </p>
        </AboutReveal>
      </section>

      {/* 4. THREE PILLARS */}
      <section className="about-bg-surface px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[960px]">
          <AboutReveal className="text-center">
            <SectionLabel>{t.pillarsLabel}</SectionLabel>
            <h2 className="about-serif about-text-ink mt-7 text-[34px] sm:text-[52px]">
              {t.pillarsHeadline}
            </h2>
            <p className={`${paragraph} mt-5`}>{t.pillarsSubcopy}</p>
          </AboutReveal>
          <div className="about-border-line mt-14 grid border-y sm:grid-cols-3 sm:divide-x sm:divide-[color:var(--about-line)]">
            {pillars.map((pillar, index) => (
              <PillarBlock key={pillar.title} {...pillar} delay={index * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. RELATIONSHIP PHILOSOPHY */}
      <section className="mx-auto max-w-[900px] px-5 py-24 sm:px-8 sm:py-32">
        <AboutReveal>
          <SectionLabel>{t.fitLabel}</SectionLabel>
          <h2 className="about-serif about-text-ink mt-7 text-[34px] break-keep sm:text-[54px]">
            {t.fitHeadline1}
            <br />
            {t.fitHeadline2}
          </h2>
          <p className={`${paragraph} mt-7 break-keep`}>{t.fitIntro}</p>
          <blockquote
            className="about-border-blush about-text-ink-soft about-serif mt-9 border-l-2 pl-6 text-[21px] leading-[1.75]"
          >
            {t.fitQuoteLine1}
            <br />
            {t.fitQuoteLine2}
            <br />
            {t.fitQuoteLine3}
          </blockquote>
        </AboutReveal>
        <div
          className="about-border-line mt-16 grid gap-px border sm:grid-cols-2"
          style={{ background: "var(--about-line)" }}
        >
          {fitQuestions.map((question, index) => (
            <AboutReveal
              key={question}
              delay={index * 70}
              className="about-bg-surface p-7 sm:p-9"
            >
              <span className="about-sans about-text-ink-mute text-[10px]">0{index + 1}</span>
              <p className="about-serif about-text-ink mt-5 whitespace-pre-line text-[19px] leading-[1.6] break-keep sm:text-[23px]">
                {question}
              </p>
            </AboutReveal>
          ))}
        </div>
        <div className="pt-20 sm:pt-28">
          <Statement>{t.fitStatement}</Statement>
        </div>
      </section>

      {/* 6. LOW FRICTION / START LIGHT */}
      <section className="about-border-line about-bg-blush border-y px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[820px]">
          <AboutReveal>
            <SectionLabel>{t.frictionLabel}</SectionLabel>
            <h2 className="about-serif about-text-ink mt-7 text-[32px] leading-[1.35] break-keep sm:text-[48px]">
              {t.frictionHeadline1}
              <br />
              {t.frictionHeadline2}
            </h2>
            <p className={`${paragraph} mt-8 max-w-[570px] break-keep`}>{t.frictionBody1}</p>
          </AboutReveal>
          <div className="py-16 sm:py-24">
            <Statement>{t.frictionStatement1}</Statement>
          </div>
          <StepFlow steps={understandSteps} />
          <AboutReveal>
            <p className="about-border-line about-serif about-text-ink mt-16 whitespace-pre-line border-t pt-10 text-[24px] leading-[1.55] break-keep sm:text-[34px]">
              {t.frictionStatement2}
            </p>
          </AboutReveal>
        </div>
      </section>

      {/* 7. PRINCIPLE */}
      <section className="about-bg-deep px-5 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto max-w-[820px] text-center">
          <AboutReveal>
            <p className="about-eyebrow about-eyebrow--invert about-sans">{t.principleLabel}</p>
            <h2 className="about-serif about-text-deep-text mt-7 text-[33px] leading-[1.38] break-keep sm:text-[48px]">
              {t.principleHeadline1}
              <br />
              {t.principleHeadline2}
            </h2>
            <p className="about-sans about-text-deep-text-soft mx-auto mt-8 max-w-[580px] text-[15px] leading-[1.95] break-keep">
              {t.principleBody}
            </p>
            <blockquote className="about-serif about-text-deep-text my-16 whitespace-pre-line text-[29px] leading-[1.45] break-keep sm:text-[44px]">
              {t.principleQuote}
            </blockquote>
            <p className="about-sans about-text-deep-text-soft text-[15px]">{t.principleClosing}</p>
          </AboutReveal>
        </div>
      </section>

      {/* 8. WHAT WE WANT TO BUILD */}
      <section className="mx-auto max-w-[920px] px-5 py-24 sm:px-8 sm:py-32">
        <AboutReveal>
          <SectionLabel>{t.buildLabel}</SectionLabel>
          <h2 className="about-serif about-text-ink mt-7 text-[29px] sm:text-[40px]">
            {t.buildHeadline}
          </h2>
        </AboutReveal>
        <div className="py-16 sm:py-24">
          <Statement>{t.buildStatement}</Statement>
        </div>
        <AboutReveal>
          <p className={`${paragraph} mx-auto max-w-[560px] whitespace-pre-line text-center break-keep`}>
            {t.buildBody}
          </p>
        </AboutReveal>
        <div className="about-border-line mx-auto mt-16 max-w-[700px] border-y">
          {buildLines.map((line, index) => (
            <AboutReveal
              key={line}
              delay={index * 60}
              className="about-border-line border-b py-5 last:border-b-0 sm:py-7"
            >
              <p
                className={`about-serif text-[25px] sm:text-[36px] ${
                  index === 3 ? "about-text-deep" : "about-text-ink"
                }`}
              >
                {line}
              </p>
            </AboutReveal>
          ))}
        </div>
        <AboutReveal>
          <p className={`${paragraph} mt-12 text-center break-keep`}>{t.buildClosing}</p>
        </AboutReveal>
      </section>

      {/* 9. WHY WE BUILT THIS */}
      <section className="about-bg-sage px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[820px]">
          <AboutReveal>
            <SectionLabel>{t.originLabel}</SectionLabel>
            <h2 className="about-serif about-text-ink mt-7 text-[32px] leading-[1.35] break-keep sm:text-[48px]">
              {t.originHeadline1}
              <br />
              {t.originHeadline2}
            </h2>
            <div className="mt-9 max-w-[620px] space-y-6">
              <p className={paragraph}>{t.originBody1}</p>
              <p className={paragraph}>{t.originBody2}</p>
              <p className={paragraph}>{t.originBody3}</p>
            </div>
            <p className="about-border-deep about-serif about-text-ink mt-14 whitespace-pre-line border-l pl-6 text-[23px] leading-[1.65] break-keep sm:text-[34px]">
              {t.originStatement}
            </p>
          </AboutReveal>
        </div>
      </section>

      {/* 10. CLOSING CTA */}
      <section className="px-5 py-28 sm:px-8 sm:py-40">
        <div className="mx-auto max-w-[820px] text-center">
          <AboutReveal>
            <p className="about-serif about-text-deep text-[18px]">{t.closingBrand}</p>
            <h2 className="about-serif about-text-ink mt-8 whitespace-pre-line text-[32px] leading-[1.4] break-keep sm:text-[50px]">
              {t.closingHeadline}
            </h2>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LocaleLink
                href={ROUTES.surveyV2}
                className="about-cta-primary w-full sm:w-auto"
              >
                {t.closingCtaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </LocaleLink>
              <LocaleLink
                href={ROUTES.relationships}
                className="about-cta-ghost w-full sm:w-auto"
              >
                {t.closingCtaSecondary}
              </LocaleLink>
            </div>
          </AboutReveal>
        </div>
      </section>
    </div>
  );
}
