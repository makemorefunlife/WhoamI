"use client";

import type { ReactNode } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { blueprintPath, relationHubPath, DECISION_HUB_PATH } from "@/lib/stitch/hubPaths";

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
// Shared icon-illustration frame — identical stroke weight/color/size on
// all four steps so they read as one line-art family, not four unrelated
// icons. Compact and inline with the text (not a large corner motif).
const ILLUSTRATION_WRAP_CLASS = "h-12 w-12 shrink-0 text-primary/70 sm:h-14 sm:w-14";
const ILLUSTRATION_SVG_PROPS = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Shared head-profile silhouette for step 1. */
const HEAD_PROFILE_PATH =
  "M21 42c-4-3-7-8-7-14 0-10 8-18 18-18s18 8 18 18c0 6-3 11-7 14l1 9h-7l-1-5c-2 .6-4.5.6-6.5 0l-1 5h-7z";

/** Step 1 — self: a head profile with a magnifying glass over the mind (looking inward, self-analysis). */
function SelfIllustration() {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <path d={HEAD_PROFILE_PATH} />
      <circle cx="29" cy="22" r="6.5" />
      <path d="M33.5 26.5 38 31" />
    </svg>
  );
}

/** Step 2 — relationship: two simple figures with a small connecting heart between them. */
function RelationshipIllustration() {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <circle cx="17" cy="22" r="8" />
      <path d="M6 46c0-8 4.5-13 11-13s11 5 11 13" />
      <circle cx="47" cy="22" r="8" />
      <path d="M36 46c0-8 4.5-13 11-13s11 5 11 13" />
      <path d="M27 30c1.6-2.4 4.4-2.4 6 0 1.6-2.4 4.4-2.4 6 0 0 3-6 7-6 7s-6-4-6-7z" />
    </svg>
  );
}

/** Step 3 — choice: a compass, direction and decision. */
function ChoiceIllustration() {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <circle cx="32" cy="32" r="21" />
      <path d="M40.5 23.5 35 35l-11.5 5.5L29 29z" />
      <circle cx="32" cy="32" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Step 4 — reflection: a virtuous-cycle arrow (decisions looping back into growth). */
function ReflectionIllustration() {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <path d="M45 32a13 13 0 1 1-4.4-9.8" />
      <path d="M45 13.5v8.7h-8.7" />
    </svg>
  );
}

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
