/** Gender-neutral "Me" sun at the center of the map — a soft glow behind a minimal self-symbol. */
export default function RelationshipSunCenter({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
      <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
        <div
          className="absolute inset-[-40%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(250,226,158,0.85) 0%, rgba(250,226,158,0.32) 55%, rgba(250,226,158,0) 78%)",
          }}
        />
        <svg viewBox="-1.6 -1.6 3.2 3.2" className="relative h-full w-full" aria-hidden="true">
          <circle
            cx="0"
            cy="0"
            r="1.35"
            fill="#fbead0"
            stroke="#e2b96a"
            strokeWidth={0.06}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx="0"
            cy="-0.34"
            r="0.32"
            fill="none"
            stroke="#8a6a2a"
            strokeWidth={0.075}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M -0.56 0.62 Q 0 0.02 0.56 0.62"
            fill="none"
            stroke="#8a6a2a"
            strokeWidth={0.075}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <span className="text-xs font-semibold text-primary">{label}</span>
    </div>
  );
}
