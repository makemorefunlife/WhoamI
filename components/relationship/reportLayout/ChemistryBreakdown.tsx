"use client";

import { useId, useState, type CSSProperties } from "react";
import type { ChemistryApproxScores } from "@/lib/relationship/psychMatch/chemistryApprox";
import {
  CHEMISTRY_METHODOLOGY_NOTE,
  pickChemistryHeadline,
  pickChemistryInsight,
} from "@/lib/relationship/psychMatch/chemistryInsights";

const LINE_SOFT = "rgba(34,31,43,0.10)";
const GOLD_LIGHT = "#F0DFB8";
const GOLD_BRAND = "#C9A24B";
const INSUFFICIENT_DATA_MESSAGE = "데이터가 부족해 계산할 수 없어요";

const MONO_STYLE: CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono), var(--font-geist-mono), monospace",
};

type ChemistryGaugeItem = {
  label: string;
  icon: string;
  score: number | null;
  kind: "emotional" | "communication";
};

export type ChemistryBreakdownProps = {
  scores: ChemistryApproxScores;
};

function MethodologyHint() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="relative inline-flex items-start">
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 text-[11px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="케미 점수 계산 방법"
        onClick={() => setOpen((prev) => !prev)}
      >
        i
      </button>
      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className="absolute top-6 left-0 z-10 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-outline-variant/35 bg-surface-container-low px-3 py-2.5 text-[11px] leading-relaxed text-on-surface-variant shadow-sm"
        >
          {CHEMISTRY_METHODOLOGY_NOTE}
        </div>
      ) : null}
    </div>
  );
}

function ChemistryGauge({ label, icon, score, kind }: ChemistryGaugeItem) {
  if (score === null) {
    return (
      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low/50 px-4 py-3">
        <p className="text-[13px] font-semibold text-on-surface">
          <span className="mr-1" aria-hidden>
            {icon}
          </span>
          {label}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
          {INSUFFICIENT_DATA_MESSAGE}
        </p>
      </div>
    );
  }

  const width = Math.min(100, Math.max(0, score));
  const insight = pickChemistryInsight(kind, score);

  return (
    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low/50 px-4 py-3">
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-on-surface">
        <span>
          <span className="mr-1" aria-hidden>
            {icon}
          </span>
          {label}
        </span>
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ ...MONO_STYLE, color: GOLD_BRAND }}
        >
          {score}
        </span>
      </div>
      <div
        className="mt-[7px] h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: LINE_SOFT }}
        role="meter"
        aria-label={label}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD_BRAND})`,
          }}
        />
      </div>
      {insight ? (
        <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
          {insight}
        </p>
      ) : null}
    </div>
  );
}

export default function ChemistryBreakdown({ scores }: ChemistryBreakdownProps) {
  const headline = pickChemistryHeadline(scores);

  const items: ChemistryGaugeItem[] = [
    {
      label: "감정 케미",
      icon: "🍀",
      score: scores.emotional,
      kind: "emotional",
    },
    {
      label: "소통 케미",
      icon: "🍀",
      score: scores.communication,
      kind: "communication",
    },
  ];

  return (
    <div className="mt-1 flex flex-col gap-3.5">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm leading-relaxed text-on-surface">{headline}</p>
        <MethodologyHint />
      </div>
      {items.map((item) => (
        <ChemistryGauge key={item.label} {...item} />
      ))}
    </div>
  );
}
