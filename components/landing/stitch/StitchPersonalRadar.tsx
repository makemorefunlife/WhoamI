export type RadarLabels = {
  structure: string;
  connection: string;
  stability: string;
  growth: string;
  adaptability: string;
  autonomy: string;
};

const AXES_DATA = [
  { key: "structure", defaultLabel: "Structure", innate: 92, realized: 62 },
  { key: "connection", defaultLabel: "Connection", innate: 78, realized: 66 },
  { key: "stability", defaultLabel: "Stability", innate: 95, realized: 60 },
  { key: "growth", defaultLabel: "Growth", innate: 84, realized: 70 },
  { key: "adaptability", defaultLabel: "Adaptability", innate: 74, realized: 64 },
  { key: "autonomy", defaultLabel: "Autonomy", innate: 88, realized: 58 },
] as const;

const SIZE = 360;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 108;

function point(i: number, value: number) {
  const angle = (Math.PI * 2 * i) / AXES_DATA.length - Math.PI / 2;
  const r = (value / 100) * R;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)] as const;
}

function polygon(key: "innate" | "realized") {
  return AXES_DATA.map((a, i) => point(i, a[key]).join(",")).join(" ");
}

type Props = {
  labels?: RadarLabels;
};

/** Hero용 정적 데모 레이더 — Innate(본래의 나) vs Current(지금의 나) */
export default function StitchPersonalRadar({ labels }: Props) {
  const axes = AXES_DATA.map((item) => ({
    ...item,
    label: labels ? labels[item.key as keyof RadarLabels] : item.defaultLabel,
  }));

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Innate vs Current 6-axis comparison radar chart"
        className="mx-auto w-full max-w-[24rem]"
      >
        {[100, 75, 50, 25].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, i) => point(i, ring).join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-outline-variant"
            strokeWidth="1"
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, 100);
          return (
            <line
              key={a.key}
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
        {axes.map((a, i) => {
          const [ix, iy] = point(i, a.innate);
          const [rx, ry] = point(i, a.realized);
          return (
            <g key={`dots-${a.key}`}>
              <circle cx={ix} cy={iy} r="3.5" className="fill-accent-rose" />
              <circle cx={rx} cy={ry} r="3.5" className="fill-accent-emerald" />
            </g>
          );
        })}
        {axes.map((a, i) => {
          const [x, y] = point(i, 130);
          return (
            <text
              key={`label-${a.key}`}
              x={x}
              y={y}
              textAnchor={x > CX + 6 ? "start" : x < CX - 6 ? "end" : "middle"}
              dominantBaseline="middle"
              className="fill-on-surface-variant text-[11px] font-medium"
            >
              {a.label}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}
