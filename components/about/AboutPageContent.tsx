"use client";

import type { ReactNode } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { useStitchScrollReveal } from "@/lib/hooks/useStitchScrollReveal";
import {
  SelfIllustration,
  RelationshipIllustration,
  ChoiceIllustration,
} from "@/components/landing/stitch/StitchIllustrations";

const EYEBROW_CLASS =
  "inline-block text-xs font-semibold uppercase tracking-[0.22em] text-accent-emerald";

const HEADLINE_CLASS =
  "stitch-headline mx-auto max-w-[14ch] text-balance text-center text-2xl font-semibold leading-snug text-primary break-keep sm:text-3xl";

/** One big, centered, single-idea line — the "stop-scroll" moments called out in the brief. */
function BigStatement({ children }: { children: ReactNode }) {
  return (
    <p className="stitch-headline mx-auto max-w-[20ch] whitespace-pre-line text-balance text-center text-2xl font-semibold leading-snug text-primary break-keep sm:text-3xl md:text-4xl">
      {children}
    </p>
  );
}

/** Short body copy — never more than a few lines, generous line-height, centered. */
function Body({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-[30rem] whitespace-pre-line text-balance text-center text-sm leading-7 text-on-surface-variant break-keep sm:text-base sm:leading-8">
      {children}
    </p>
  );
}

function PillarCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-extra-large border border-outline-variant/25 bg-surface-container-lowest px-6 py-8 text-center shadow-sm">
      {icon}
      <h3 className="stitch-headline mt-4 text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-balance text-sm leading-relaxed text-on-surface-variant break-keep">
        {body}
      </p>
    </div>
  );
}

/** Minimal birth date → survey → lived experience step row — labels and arrows only, no cards. */
function StepFlow({ steps }: { steps: string[] }) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:gap-x-4">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2 sm:gap-4">
          <span className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-xs font-medium text-primary sm:text-sm">
            {label}
          </span>
          {i < steps.length - 1 ? (
            <span aria-hidden className="text-outline-variant">
              →
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Aha! it's me — About page (Stitch-brand redesign).
 * Flow: empathy (1-2) → philosophy (3-5) → product approach (6-7) → what
 * we're building + why (8-9) → action (10). Reuses the Stitch design
 * system (stitch-landing tokens, stitch-headline typography, scroll
 * reveal, the journey illustration set) instead of the old SpaceBackground
 * theme, so About matches the rest of the brand.
 */
export default function AboutPageContent() {
  const mainRef = useStitchScrollReveal();
  const { messages } = useLocale();
  const t = messages.about;

  return (
    <div className="stitch-landing overflow-x-hidden">
      <main
        id="main"
        ref={mainRef}
        className="relative mx-auto max-w-[720px] overflow-hidden px-edge-margin-mobile pb-20 pt-10 [word-break:keep-all] [line-break:strict] md:px-6 md:pb-28 md:pt-16"
      >
        {/* 1. HERO */}
        <section
          data-stitch-reveal
          className="stitch-reveal-visible flex flex-col items-center py-8 text-center sm:py-14"
        >
          <span className={EYEBROW_CLASS}>{t.heroEyebrow}</span>
          <h1 className="stitch-headline mt-3 max-w-[15ch] text-balance text-3xl font-semibold leading-[1.3] text-primary break-keep sm:text-4xl md:text-[2.75rem]">
            {t.heroHeadline1}
            <br />
            {t.heroHeadline2}
          </h1>
          <div className="mt-7 space-y-5">
            <Body>{t.heroBody1}</Body>
            <Body>{t.heroBody2}</Body>
          </div>
          <p className="stitch-headline mt-8 max-w-[18ch] whitespace-pre-line text-balance text-center text-lg font-medium leading-snug text-primary break-keep sm:text-xl">
            {t.heroMission}
          </p>
          <div className="mt-9 flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <LocaleLink href={ROUTES.surveyV2} className="stitch-cta-primary w-full sm:w-auto">
              {t.heroCtaPrimary}
            </LocaleLink>
            <LocaleLink href={ROUTES.relationships} className="stitch-cta-secondary w-full sm:w-auto">
              {t.heroCtaSecondary}
            </LocaleLink>
          </div>
        </section>

        {/* 2. WHY */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={HEADLINE_CLASS}>
            {t.whyHeadline1}
            <br />
            {t.whyHeadline2}
          </h2>
          <div className="mt-6">
            <Body>{t.whyBody1}</Body>
          </div>
          <div className="my-10 sm:my-14">
            <BigStatement>{t.whyStatement}</BigStatement>
          </div>
          <Body>{t.whyBody2}</Body>
        </section>

        {/* 3. UNDERSTAND EARLIER */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <span className={`${EYEBROW_CLASS} block text-center`}>{t.earlyLabel}</span>
          <h2 className={`${HEADLINE_CLASS} mt-2`}>
            {t.earlyHeadline1}
            <br />
            {t.earlyHeadline2}
          </h2>
          <div className="mt-6 space-y-5">
            <Body>{t.earlyBody1}</Body>
            <Body>{t.earlyBody2}</Body>
          </div>

          <StepFlow steps={[t.earlyStep1, t.earlyStep2, t.earlyStep3]} />

          <div className="my-10 sm:my-14">
            <BigStatement>{t.earlyStatement}</BigStatement>
          </div>
          <Body>{t.earlyBody3}</Body>
        </section>

        {/* 4. THREE PILLARS */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={HEADLINE_CLASS}>{t.pillarsHeadline}</h2>
          <div className="mt-3">
            <Body>{t.pillarsSubcopy}</Body>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            <PillarCard
              icon={<SelfIllustration className="h-10 w-10 text-primary/70" />}
              title={t.pillarMeTitle}
              body={t.pillarMeBody}
            />
            <PillarCard
              icon={<RelationshipIllustration className="h-10 w-10 text-primary/70" />}
              title={t.pillarRelTitle}
              body={t.pillarRelBody}
            />
            <PillarCard
              icon={<ChoiceIllustration className="h-10 w-10 text-primary/70" />}
              title={t.pillarDecisionTitle}
              body={t.pillarDecisionBody}
            />
          </div>
        </section>

        {/* 5. RELATIONSHIP PHILOSOPHY */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={HEADLINE_CLASS}>
            {t.fitHeadline1}
            <br />
            {t.fitHeadline2}
          </h2>
          <div className="mt-6">
            <Body>{t.fitIntro}</Body>
          </div>
          <div className="mx-auto mt-6 max-w-sm rounded-extra-large border border-outline-variant/30 bg-surface-container-low/60 px-6 py-5 text-center">
            <p className="text-sm leading-7 text-on-surface-variant/80 sm:text-base">
              {t.fitQuoteLine1}
              <br />
              {t.fitQuoteLine2}
              <br />
              {t.fitQuoteLine3}
            </p>
          </div>
          <div className="mt-6">
            <Body>{t.fitLeadIn}</Body>
          </div>
          <div className="mx-auto mt-8 max-w-md space-y-6">
            {[t.fitQuestion1, t.fitQuestion2, t.fitQuestion3, t.fitQuestion4].map((q) => (
              <p
                key={q}
                className="whitespace-pre-line text-balance text-center text-base font-medium leading-relaxed text-primary break-keep sm:text-lg"
              >
                {q}
              </p>
            ))}
          </div>
          <div className="mt-10 sm:mt-14">
            <BigStatement>{t.fitStatement}</BigStatement>
          </div>
        </section>

        {/* 6. LOW FRICTION */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={`${HEADLINE_CLASS} max-w-[16ch]`}>{t.frictionHeadline}</h2>
          <div className="mt-6">
            <Body>{t.frictionBody1}</Body>
          </div>
          <div className="my-10 sm:my-14">
            <BigStatement>{t.frictionStatement1}</BigStatement>
          </div>
          <Body>{t.frictionBody2}</Body>
          <div className="mt-10 sm:mt-14">
            <BigStatement>{t.frictionStatement2}</BigStatement>
          </div>
        </section>

        {/* 7. PRINCIPLE — slightly tinted band to break the page's rhythm */}
        <section
          data-stitch-reveal
          className="-mx-edge-margin-mobile border-t border-outline-variant/25 bg-surface-container-low/50 px-edge-margin-mobile py-14 sm:-mx-6 sm:px-6 sm:py-20"
        >
          <h2 className={HEADLINE_CLASS}>
            {t.principleHeadline1}
            <br />
            {t.principleHeadline2}
          </h2>
          <div className="mt-6">
            <Body>{t.principleBody1}</Body>
          </div>
          <div className="my-10 sm:my-14">
            <BigStatement>{t.principleQuote}</BigStatement>
          </div>
          <Body>{t.principleBody2}</Body>
        </section>

        {/* 8. WHAT WE WANT TO BUILD */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={`${HEADLINE_CLASS} max-w-[16ch]`}>{t.buildHeadline}</h2>
          <div className="my-8 sm:my-12">
            <BigStatement>{t.buildStatement}</BigStatement>
          </div>
          <Body>{t.buildBody1}</Body>
          <div className="mx-auto mt-10 max-w-xs space-y-3 text-center">
            {[t.buildLine1, t.buildLine2, t.buildLine3, t.buildLine4].map((line) => (
              <p key={line} className="stitch-headline text-lg font-medium text-primary sm:text-xl">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8">
            <Body>{t.buildBody2}</Body>
          </div>
        </section>

        {/* 9. WHY WE BUILT THIS — kept short on purpose, no bio/credentials */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-14 sm:py-20">
          <h2 className={HEADLINE_CLASS}>
            {t.originHeadline1}
            <br />
            {t.originHeadline2}
          </h2>
          <div className="mt-6 space-y-5">
            <Body>{t.originBody1}</Body>
            <Body>{t.originBody2}</Body>
          </div>
          <div className="mt-10 sm:mt-14">
            <BigStatement>{t.originStatement}</BigStatement>
          </div>
        </section>

        {/* 10. CLOSING CTA */}
        <section data-stitch-reveal className="border-t border-outline-variant/25 py-16 text-center sm:py-24">
          <p className={EYEBROW_CLASS}>{t.closingBrand}</p>
          <h2 className="stitch-headline mx-auto mt-3 max-w-[20ch] whitespace-pre-line text-balance text-center text-2xl font-semibold leading-snug text-primary break-keep sm:text-3xl">
            {t.closingHeadline}
          </h2>
          <div className="mt-9 flex flex-col items-center gap-4">
            <LocaleLink href={ROUTES.surveyV2} className="stitch-cta-primary w-full max-w-xs sm:w-auto">
              {t.closingCtaPrimary}
            </LocaleLink>
            <LocaleLink
              href={ROUTES.relationships}
              className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t.closingCtaSecondary}
            </LocaleLink>
          </div>
        </section>
      </main>
    </div>
  );
}
