"use client";

import { PRIMARY_AXIS_DEFINITIONS } from "@/lib/v2/framework/primaryAxisDefinitions";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";

const GOLD = "#c4a482";
type Tone = "accent" | "gold" | "highlight";

const BAR_CLASS: Record<Tone, string> = {
  accent: "bg-primary",
  gold: "",
  highlight: "bg-accent-rose",
};
const LABEL_CLASS: Record<Tone, string> = {
  accent: "text-primary",
  gold: "",
  highlight: "text-accent-rose",
};
const RANK_TONE: Tone[] = ["accent", "gold", "highlight"];

/** 로버블 MiniIndicator 이식 — 상위 3개 축을 얇은 바 3개로 보여준다. */
export function FreeMiniIndicator({
  scores,
  locale,
  caption,
}: {
  scores: PrimaryAxesScores;
  locale: Locale;
  caption?: string;
}) {
  const isKo = locale === "ko-KR";
  const top3 = [...PRIMARY_AXIS_KEYS]
    .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0))
    .slice(0, 3);

  return (
    <div className="border-t border-b border-outline-variant py-6">
      {caption ? (
        <div className="mb-5 text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
          {caption}
        </div>
      ) : null}
      <ul className="space-y-4">
        {top3.map((key, i) => {
          const tone = RANK_TONE[i] ?? "accent";
          const value = Math.max(0, Math.min(100, scores[key] ?? 0));
          const label = isKo
            ? PRIMARY_AXIS_DEFINITIONS[key].koLabel
            : PRIMARY_AXIS_DEFINITIONS[key].label;
          return (
            <li key={key} className="grid grid-cols-[80px_1fr_36px] items-center gap-3">
              <span
                className={`truncate text-[11px] tracking-[0.1em] uppercase ${LABEL_CLASS[tone]}`}
                style={tone === "gold" ? { color: GOLD } : undefined}
              >
                {label}
              </span>
              <span className="relative block h-[3px] w-full bg-outline-variant">
                <span
                  className={`absolute inset-y-0 left-0 ${BAR_CLASS[tone]}`}
                  style={{
                    width: `${value}%`,
                    ...(tone === "gold" ? { backgroundColor: GOLD } : {}),
                  }}
                />
              </span>
              <span
                className="text-right text-[14px] tabular-nums text-on-surface"
                style={{ fontFamily: "var(--font-stitch-serif)" }}
              >
                {value}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
