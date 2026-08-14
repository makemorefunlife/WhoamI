const AXES = [
  { label: "Structure", innate: 92, realized: 62 },
  { label: "Connection", innate: 78, realized: 66 },
  { label: "Stability", innate: 95, realized: 60 },
  { label: "Growth", innate: 84, realized: 70 },
  { label: "Adaptability", innate: 74, realized: 64 },
  { label: "Autonomy", innate: 88, realized: 58 },
] as const;

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 108;

function point(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)] as const;
}

function polygon(key: "innate" | "realized") {
  return AXES.map((a, i) => point(i, a[key]).join(",")).join(" ");
}

/** Hero용 정적 데모 레이더 — Innate(본질의 나) vs Realized(관계 속의 나) */
export default function StitchPersonalRadar() {
  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Innate vs Realized 6-axis comparison radar chart"
        className="mx-auto w-full max-w-[22rem]"
      >
        {[100, 75, 50, 25].map((ring) => (
          <polygon
            key={ring}
            points={AXES.map((_, i) => point(i, ring).join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-outline-variant"
            strokeWidth="1"
          />
        ))}
        {AXES.map((a) => {
          const i = AXES.indexOf(a);
          const [x, y] = point(i, 100);
          return (
            <line
              key={a.label}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-outline-variant"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygon("innate")}
          className="fill-accent-rose/20 stroke-accent-rose"
          strokeWidth="2"
        />
        <polygon
          points={polygon("realized")}
          className="fill-accent-emerald/20 stroke-accent-emerald"
          strokeWidth="2"
        />
        {AXES.map((a, i) => {
          const [ix, iy] = point(i, a.innate);
          const [rx, ry] = point(i, a.realized);
          return (
            <g key={`dots-${a.label}`}>
              <circle cx={ix} cy={iy} r="3.5" className="fill-accent-rose" />
              <circle cx={rx} cy={ry} r="3.5" className="fill-accent-emerald" />
            </g>
          );
        })}
        {AXES.map((a, i) => {
          const [x, y] = point(i, 132);
          return (
            <text
              key={`label-${a.label}`}
              x={x}
              y={y}
              textAnchor={x > CX + 4 ? "start" : x < CX - 4 ? "end" : "middle"}
              dominantBaseline="middle"
              className="fill-on-surface-variant text-[9px]"
            >
              {a.label}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}
