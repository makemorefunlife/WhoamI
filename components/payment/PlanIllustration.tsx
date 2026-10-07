/**
 * Product artwork for the regional pricing cards — one inline SVG per
 * product type, drawn in the existing Stitch palette (cream #FAF7F0 /
 * #F5F0E8, forest #1A3328, sage #3A8F6E, gold #C98A2C, rose #C49A9C).
 * Inline SVG instead of image files so the cards stay crisp at any size,
 * add no network requests, and can't drift out of sync with a plan id.
 *
 * Purely decorative (aria-hidden) — the plan name/price/features next to it
 * carry all of the information.
 */
export type PlanArtKind = "personal" | "relationship" | "triple" | "pass" | "membership";

export function planArtKindFor(planId: string): PlanArtKind | null {
  switch (planId) {
    case "us_personal_premium":
    case "kr_personal_premium":
      return "personal";
    case "us_relationship_premium":
    case "kr_relationship_premium":
    case "us_additional_relationship":
      return "relationship";
    case "kr_relationship_triple":
      return "triple";
    case "us_insight_pass_30d":
    case "kr_insight_pass_30d":
      return "pass";
    case "us_annual_membership":
      return "membership";
    default:
      return null;
  }
}

const FOREST = "#1A3328";
const SAGE = "#3A8F6E";
const GOLD = "#C98A2C";
const ROSE = "#C49A9C";
const CREAM = "#FFFDF8";

function Art({ kind }: { kind: PlanArtKind }) {
  switch (kind) {
    case "personal":
      // One figure inside a soft halo — "your own" deep report.
      return (
        <>
          <circle cx="160" cy="60" r="38" fill={SAGE} opacity="0.12" />
          <circle cx="160" cy="60" r="26" fill="none" stroke={SAGE} strokeWidth="2" strokeDasharray="3 5" />
          <circle cx="160" cy="51" r="9" fill={FOREST} />
          <path d="M143 76c3-10 9-14 17-14s14 4 17 14" fill={FOREST} />
          <circle cx="196" cy="30" r="3" fill={GOLD} />
          <circle cx="122" cy="88" r="2.5" fill={ROSE} />
        </>
      );
    case "relationship":
      // Two overlapping circles — one specific relationship.
      return (
        <>
          <circle cx="142" cy="60" r="30" fill={SAGE} opacity="0.22" />
          <circle cx="178" cy="60" r="30" fill={ROSE} opacity="0.32" />
          <circle cx="142" cy="60" r="30" fill="none" stroke={SAGE} strokeWidth="2" />
          <circle cx="178" cy="60" r="30" fill="none" stroke={ROSE} strokeWidth="2" />
          <path d="M160 52c-3-5-11-4-11 3 0 5 6 9 11 13 5-4 11-8 11-13 0-7-8-8-11-3z" fill={FOREST} />
        </>
      );
    case "triple":
      // Three linked pairs — a pack of three relationship reports.
      return (
        <>
          {[100, 160, 220].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx - 9} cy="60" r="16" fill={SAGE} opacity={0.18 + i * 0.06} />
              <circle cx={cx + 9} cy="60" r="16" fill={ROSE} opacity={0.26 + i * 0.06} />
              <circle cx={cx - 9} cy="60" r="16" fill="none" stroke={SAGE} strokeWidth="1.6" />
              <circle cx={cx + 9} cy="60" r="16" fill="none" stroke={ROSE} strokeWidth="1.6" />
            </g>
          ))}
          <text x="160" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={FOREST} letterSpacing="2">
            × 3
          </text>
        </>
      );
    case "pass":
      // A 30-day ticket.
      return (
        <>
          <rect x="108" y="30" width="104" height="60" rx="10" fill={GOLD} opacity="0.16" />
          <rect x="108" y="30" width="104" height="60" rx="10" fill="none" stroke={GOLD} strokeWidth="2" />
          <line x1="146" y1="34" x2="146" y2="86" stroke={GOLD} strokeWidth="1.6" strokeDasharray="3 4" />
          <circle cx="146" cy="30" r="5" fill={CREAM} />
          <circle cx="146" cy="90" r="5" fill={CREAM} />
          <text x="127" y="66" textAnchor="middle" fontSize="11" fontWeight="700" fill={GOLD}>
            ✦
          </text>
          <text x="180" y="64" textAnchor="middle" fontSize="22" fontWeight="800" fill={FOREST}>
            30
          </text>
          <text x="180" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill={FOREST} letterSpacing="2">
            DAYS
          </text>
        </>
      );
    case "membership":
      // Twelve segments in a ring — 12 months.
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const x = 160 + Math.cos(a) * 36;
            const y = 60 + Math.sin(a) * 36;
            return <circle key={i} cx={x} cy={y} r="5" fill={i % 3 === 0 ? GOLD : SAGE} opacity={i % 3 === 0 ? 1 : 0.55} />;
          })}
          <circle cx="160" cy="60" r="22" fill={FOREST} />
          <text x="160" y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill={CREAM}>
            12
          </text>
          <text x="160" y="72" textAnchor="middle" fontSize="6" fontWeight="700" fill={CREAM} letterSpacing="1.5">
            MONTHS
          </text>
        </>
      );
  }
}

export default function PlanIllustration({ kind, className = "" }: { kind: PlanArtKind; className?: string }) {
  return (
    <div
      aria-hidden
      className={[
        "overflow-hidden rounded-2xl border border-[#E8E2D6] bg-[radial-gradient(circle_at_20%_20%,rgba(58,143,110,0.10)_0%,transparent_55%),radial-gradient(circle_at_85%_85%,rgba(196,154,156,0.16)_0%,transparent_50%)] bg-[#F5F0E8]",
        className,
      ].join(" ")}
    >
      <svg viewBox="0 0 320 120" className="block h-auto w-full" role="presentation">
        <Art kind={kind} />
      </svg>
    </div>
  );
}
