/**
 * Shared ◤ section marker for the three Relationship Lab sections (Map /
 * My People / Recent Analyses) — same glyph, hierarchy, and accent color
 * used for report chapter headings (see EditorialPrimitives.tsx's
 * SubHeading), adapted to the Hub's own stitch-headline/text-primary tokens
 * instead of the report-reading rel-* tokens.
 */
export default function HubSectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="stitch-headline flex items-baseline gap-2 text-lg text-primary">
        <span className="text-[13px] leading-none text-secondary" aria-hidden="true">
          ◤
        </span>
        <span>{title}</span>
      </h2>
      {subtitle ? <p className="text-sm text-on-surface-variant">{subtitle}</p> : null}
    </div>
  );
}
