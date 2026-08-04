"use client";

/**
 * Ported verbatim from Lovable "Inner Compass Reports" →
 * src/components/report/v4/MatchRadar.tsx. Pure presentation, no data
 * fetching — axes are supplied by the caller from payload.axisOverview.
 */
type Axis = { key: string; label: string; a: number; b: number };

type Props = {
  axes: Axis[];
  aName: string;
  bName: string;
};

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 160;
const RINGS = 5;

const SIMILAR = 12;
const TENSION = 30;

function fmt(n: number) {
  return n.toFixed(2);
}

function point(value: number, index: number, total: number, radius = RADIUS) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / 100) * radius;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r, angle };
}

function polygon(values: number[], total: number) {
  return values
    .map((v, i) => {
      const p = point(v, i, total);
      return `${fmt(p.x)},${fmt(p.y)}`;
    })
    .join(" ");
}

function axisTone(gap: number) {
  if (gap <= SIMILAR) return { color: "var(--v4-good)", weight: 600 };
  if (gap >= TENSION) return { color: "var(--v4-bad)", weight: 600 };
  return { color: "var(--rel-ink-mute)", weight: 500 };
}

export function MatchRadar({ axes, aName, bName }: Props) {
  const n = axes.length;
  if (n === 0) return null;
  const aValues = axes.map((ax) => ax.a);
  const bValues = axes.map((ax) => ax.b);

  const rings = Array.from({ length: RINGS }, (_, i) => {
    const r = ((i + 1) / RINGS) * RADIUS;
    return Array.from({ length: n }, (_, j) => {
      const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
      return `${fmt(CENTER + Math.cos(angle) * r)},${fmt(CENTER + Math.sin(angle) * r)}`;
    }).join(" ");
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[520px]"
        role="img"
        aria-label={`${aName} 와 ${bName} 의 심리 축 매칭 차트`}
      >
        {rings.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="rgba(34,34,34,0.07)" strokeWidth={1} />
        ))}
        {axes.map((ax, i) => {
          const p = point(100, i, n);
          const gap = Math.abs(ax.a - ax.b);
          const tone = axisTone(gap);
          const emphasized = gap <= SIMILAR || gap >= TENSION;
          return (
            <line
              key={ax.key}
              x1={fmt(CENTER)}
              y1={fmt(CENTER)}
              x2={fmt(p.x)}
              y2={fmt(p.y)}
              stroke={emphasized ? tone.color : "rgba(34,34,34,0.08)"}
              strokeWidth={emphasized ? 1.25 : 1}
              opacity={emphasized ? 0.55 : 1}
            />
          );
        })}

        {/* Person B area */}
        <polygon
          points={polygon(bValues, n)}
          fill="var(--v4-b-soft)"
          stroke="var(--v4-b)"
          strokeWidth={1.6}
        />
        {/* Person A area */}
        <polygon
          points={polygon(aValues, n)}
          fill="var(--v4-a-soft)"
          stroke="var(--v4-a)"
          strokeWidth={1.9}
        />

        {bValues.map((v, i) => {
          const p = point(v, i, n);
          return (
            <circle key={`b-${axes[i].key}`} cx={fmt(p.x)} cy={fmt(p.y)} r={3} fill="var(--v4-b)" />
          );
        })}
        {aValues.map((v, i) => {
          const p = point(v, i, n);
          return (
            <circle key={`a-${axes[i].key}`} cx={fmt(p.x)} cy={fmt(p.y)} r={3} fill="var(--v4-a)" />
          );
        })}

        {axes.map((ax, i) => {
          const p = point(100, i, n, RADIUS + 26);
          const tone = axisTone(Math.abs(ax.a - ax.b));
          const anchor =
            Math.abs(Math.cos(p.angle)) < 0.2 ? "middle" : Math.cos(p.angle) > 0 ? "start" : "end";
          return (
            <text
              key={`label-${ax.key}`}
              x={fmt(p.x)}
              y={fmt(p.y)}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill={tone.color}
              style={{
                fontFamily: "var(--font-rel-sans-stack)",
                fontSize: 11.5,
                fontWeight: tone.weight,
                letterSpacing: "0.02em",
              }}
            >
              {ax.label}
            </text>
          );
        })}
      </svg>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-rel-sans text-[11px] tracking-[0.12em] text-rel-ink-soft">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-5 border border-v4-a bg-v4-a-soft" />
          {aName}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-5 border border-v4-b bg-v4-b-soft" />
          {bName}
        </span>
        <span className="inline-flex items-center gap-2 text-v4-good">
          <span className="inline-block h-[2px] w-5 bg-v4-good" />
          비슷한 축
        </span>
        <span className="inline-flex items-center gap-2 text-v4-bad">
          <span className="inline-block h-[2px] w-5 bg-v4-bad" />
          차이가 큰 축
        </span>
      </div>
    </div>
  );
}
