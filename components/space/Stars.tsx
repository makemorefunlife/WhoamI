"use client";

import { useMemo } from "react";

type Star = { x: number; y: number; s: number; o: number; hue: string };

export default function Stars({ count = 48 }: { count?: number }) {
  const stars = useMemo(() => {
    const list: Star[] = [];
    for (let i = 0; i < count; i++) {
      const purple = i % 11 === 0;
      list.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.6 + 0.4,
        o: Math.random() * 0.5 + 0.25,
        hue: purple ? "rgba(243,166,255,0.35)" : "rgba(255,255,255,0.9)",
      });
    }
    return list;
  }, [count]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            opacity: st.o,
            background: st.hue,
            boxShadow:
              st.hue.includes("255,255")
                ? "0 0 6px rgba(103,183,255,0.5)"
                : "0 0 4px rgba(243,166,255,0.4)",
          }}
        />
      ))}
    </div>
  );
}
