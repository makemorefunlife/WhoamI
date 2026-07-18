"use client";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** 로버블 EnergyProfile의 반원 게이지를 이식. 순수 SVG. */
export function DeepEssenceEnergyGauge({
  pct,
  relationalSpendLabel = "관계 소모",
  selfReturnLabel = "나에게 돌아옴",
  othersLabel = "타인",
}: {
  pct: number;
  relationalSpendLabel?: string;
  selfReturnLabel?: string;
  othersLabel?: string;
}) {
  const size = 200;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const clamped = Math.max(0, Math.min(100, pct));
  const angle = Math.PI * (clamped / 100);
  const x = cx - Math.cos(angle) * r;
  const y = cy - Math.sin(angle) * r;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} 118`} className="h-auto w-[220px]">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-outline-variant)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          fill="none"
          stroke="var(--color-accent-rose)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <circle
          cx={x}
          cy={y}
          r={5}
          fill="var(--color-surface)"
          stroke="var(--color-accent-rose)"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy - 26}
          textAnchor="middle"
          fill="var(--color-on-surface)"
          style={{ ...serifStyle, fontSize: 30 }}
        >
          {clamped}%
        </text>
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="var(--color-on-surface-variant)"
          style={{ fontSize: 9.5, letterSpacing: "0.14em" }}
        >
          {relationalSpendLabel}
        </text>
      </svg>
      <div className="mt-1 flex w-[220px] justify-between text-[10px] tracking-[0.1em] text-on-surface-variant">
        <span>{selfReturnLabel}</span>
        <span>{othersLabel}</span>
      </div>
    </div>
  );
}
