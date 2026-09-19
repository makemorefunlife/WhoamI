"use client";

import type { ReactNode } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { blueprintPath, relationHubPath, DECISION_HUB_PATH } from "@/lib/stitch/hubPaths";
import {
  SelfIllustration,
  RelationshipIllustration,
  ChoiceIllustration,
  ReflectionIllustration,
} from "@/components/landing/stitch/StitchIllustrations";

// Shared classes so all four steps' body copy and all three CTAs are
// pixel-identical in typography — spec: nothing may be shrunk to fit,
// long copy wraps instead. Silhouette (width/offset/radius) is what
// varies per step, never the type scale.
const STEP_TEXT_CLASS =
  "text-lg font-semibold leading-snug text-primary break-keep sm:text-xl";
const STEP_CTA_CLASS =
  "group inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#234a38] to-[#1a3328] px-6 py-3.5 text-sm font-semibold text-on-primary shadow-[0_14px_36px_rgba(26,51,40,0.28),0_2px_0_rgba(255,255,255,0.14)_inset] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98] sm:text-base";
// One shared treatment for every number badge — same size, background,
// offset, and z-index on all four steps (no per-step variation, ever).
const BADGE_CLASS =
  "absolute -left-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-md ring-4 ring-surface-container-lowest sm:-left-3.5 sm:-top-3.5";

type JourneyStepData = {
  number: number;
  illustration: ReactNode;
  tint: string;
  radius: string;
  widthClass: string;
  /** px, +right/-left — small horizontal drift, part of the organic silhouette. Cards stay level — no rotation. */
  offsetX: number;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/**
 * Straight, solid, directional connector between steps. `direction`
 * mirrors the line so it visually continues the left/right drift of the
 * cards it sits between (↘ then ↙ then ↘). The arrowhead's wings are
 * computed from the line's own angle, so they always point back along the
 * actual line rather than a fixed vertical chevron. Same warm neutral tone
 * used elsewhere on the page for hairlines/dividers (outline-variant) —
 * never green, never louder than the CTA/main copy.
 */
function JourneyConnector({ direction }: { direction: "right" | "left" }) {
  const startX = direction === "right" ? 16 : 44;
  const endX = direction === "right" ? 44 : 16;
  const startY = 2;
  const tipY = 49;

  const angle = Math.atan2(tipY - startY, endX - startX);
  const backAngle = angle + Math.PI;
  const wingLength = 10;
  const wingSpread = (26 * Math.PI) / 180;
  const wing1 = {
    x: endX + wingLength * Math.cos(backAngle - wingSpread),
    y: tipY + wingLength * Math.sin(backAngle - wingSpread),
  };
  const wing2 = {
    x: endX + wingLength * Math.cos(backAngle + wingSpread),
    y: tipY + wingLength * Math.sin(backAngle + wingSpread),
  };

  return (
    <div className="flex justify-center py-1.5" aria-hidden>
      <svg width="60" height="56" viewBox="0 0 60 56" fill="none" className="text-outline-variant">
        <path
          d={`M ${startX} ${startY} L ${endX} ${tipY}`}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d={`M ${wing1.x.toFixed(1)} ${wing1.y.toFixed(1)} L ${endX} ${tipY} L ${wing2.x.toFixed(1)} ${wing2.y.toFixed(1)}`}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function JourneyStep({ step }: { step: JourneyStepData }) {
  return (
    <div
      className={`relative mx-auto ${step.widthClass}`}
      style={{ transform: `translateX(${step.offsetX}px)` }}
    >
      <span className={BADGE_CLASS} aria-hidden>
        {step.number}
      </span>
      <div
        style={{ borderRadius: step.radius }}
        className={`border border-outline-variant/25 p-5 sm:p-6 ${step.tint}`}
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {step.illustration}
          <p className={`${STEP_TEXT_CLASS} flex-1`}>{step.text}</p>
          {step.ctaLabel && step.ctaHref ? (
            <LocaleLink href={step.ctaHref} className={`${STEP_CTA_CLASS} shrink-0`}>
              {step.ctaLabel}
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </LocaleLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * "더 나은 선택을 위한 여정" / "Your Journey to Better Choices" — a real,
 * responsive, i18n-driven journey (not a PNG). Card widths/offsets/radii
 * are intentionally varied (spec: not a uniform 4-card grid) — frozen as
 * of this pass, not to be re-randomized on future visual-cleanup passes.
 */
export default function StitchJourneySection({ reportId }: { reportId: string }) {
  const { messages } = useLocale();

  const steps: JourneyStepData[] = [
    {
      number: 1,
      illustration: <SelfIllustration />,
      tint: "bg-surface-container-low",
      radius: "26px 56px 42px 22px",
      widthClass: "w-[92%]",
      offsetX: -16,
      text: messages.landing.frameworkStep1Text,
      ctaLabel: messages.landing.frameworkStep1Cta,
      ctaHref: blueprintPath(reportId),
    },
    {
      number: 2,
      illustration: <RelationshipIllustration />,
      tint: "bg-accent-emerald-soft/60",
      radius: "54px 24px 50px 30px",
      widthClass: "w-[82%]",
      offsetX: 16,
      text: messages.landing.frameworkStep2Text,
      ctaLabel: messages.landing.frameworkStep2Cta,
      ctaHref: relationHubPath(reportId),
    },
    {
      number: 3,
      illustration: <ChoiceIllustration />,
      tint: "bg-accent-rose-soft/70",
      radius: "24px 54px 28px 52px",
      widthClass: "w-[94%]",
      offsetX: -14,
      text: messages.landing.frameworkStep3Text,
    },
    {
      number: 4,
      illustration: <ReflectionIllustration />,
      tint: "bg-surface-container-low",
      radius: "56px 28px 46px 22px",
      widthClass: "w-[80%]",
      offsetX: 18,
      text: messages.landing.frameworkStep4Text,
      ctaLabel: messages.landing.frameworkStep4Cta,
      ctaHref: DECISION_HUB_PATH,
    },
  ];

  return (
    <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm sm:p-10">
      <div className="mx-auto flex max-w-[720px] flex-col">
        <JourneyStep step={steps[0]} />
        <JourneyConnector direction="right" />
        <JourneyStep step={steps[1]} />
        <JourneyConnector direction="left" />
        <JourneyStep step={steps[2]} />
        <JourneyConnector direction="right" />
        <JourneyStep step={steps[3]} />
      </div>
    </div>
  );
}
