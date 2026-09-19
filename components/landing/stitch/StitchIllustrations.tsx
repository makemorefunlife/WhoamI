/**
 * Shared line-art illustration system for Stitch-themed pages — simple,
 * single-color (currentColor) SVGs at a consistent 64x64 viewBox and
 * stroke weight, so every page that uses them (landing journey, About,
 * anywhere else) reads as one visual family instead of ad hoc icons.
 * Originally defined inline in StitchJourneySection.tsx; extracted here
 * so other pages can reuse them without duplicating the paths.
 */

export const ILLUSTRATION_SVG_PROPS = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ILLUSTRATION_WRAP_CLASS = "h-12 w-12 shrink-0 text-primary/70 sm:h-14 sm:w-14";

/** Shared head-profile silhouette for the "self" illustration. */
const HEAD_PROFILE_PATH =
  "M21 42c-4-3-7-8-7-14 0-10 8-18 18-18s18 8 18 18c0 6-3 11-7 14l1 9h-7l-1-5c-2 .6-4.5.6-6.5 0l-1 5h-7z";

type IllustrationProps = { className?: string };

/** Self: a head profile with a magnifying glass over the mind (looking inward, self-analysis). */
export function SelfIllustration({ className }: IllustrationProps = {}) {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={className ?? ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <path d={HEAD_PROFILE_PATH} />
      <circle cx="29" cy="22" r="6.5" />
      <path d="M33.5 26.5 38 31" />
    </svg>
  );
}

/** Relationship: two simple figures with a small connecting heart between them. */
export function RelationshipIllustration({ className }: IllustrationProps = {}) {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={className ?? ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <circle cx="17" cy="22" r="8" />
      <path d="M6 46c0-8 4.5-13 11-13s11 5 11 13" />
      <circle cx="47" cy="22" r="8" />
      <path d="M36 46c0-8 4.5-13 11-13s11 5 11 13" />
      <path d="M27 30c1.6-2.4 4.4-2.4 6 0 1.6-2.4 4.4-2.4 6 0 0 3-6 7-6 7s-6-4-6-7z" />
    </svg>
  );
}

/** Choice: a compass, direction and decision. */
export function ChoiceIllustration({ className }: IllustrationProps = {}) {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={className ?? ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <circle cx="32" cy="32" r="21" />
      <path d="M40.5 23.5 35 35l-11.5 5.5L29 29z" />
      <circle cx="32" cy="32" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Reflection: a virtuous-cycle arrow (decisions looping back into growth). */
export function ReflectionIllustration({ className }: IllustrationProps = {}) {
  return (
    <svg {...ILLUSTRATION_SVG_PROPS} className={className ?? ILLUSTRATION_WRAP_CLASS} aria-hidden>
      <path d="M45 32a13 13 0 1 1-4.4-9.8" />
      <path d="M45 13.5v8.7h-8.7" />
    </svg>
  );
}
