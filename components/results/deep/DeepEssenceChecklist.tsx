"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/** 로버블 DailyChecklist 이식 — 클릭으로 체크, 완료율 표시 */
export function DeepEssenceChecklist({
  items,
  t,
}: {
  items: string[];
  t: DeepEssenceUiStrings;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const done = checked.filter(Boolean).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px] tracking-[0.2em] text-primary uppercase">
            {t.checklist.appendix}
          </div>
          <h2 className="mt-1.5 text-[22px] leading-tight text-on-surface" style={serifStyle}>
            {t.checklist.title}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-[24px] tabular-nums text-on-surface" style={serifStyle}>
            {done}
            <span className="text-on-surface-variant">/{items.length}</span>
          </div>
          <div className="text-[10px] tracking-[0.16em] text-on-surface-variant uppercase">
            {pct}
            {t.checklist.todaySuffix}
          </div>
        </div>
      </div>

      <div className="mt-6 h-[2px] w-full overflow-hidden bg-outline-variant">
        <div
          className="bg-primary h-full transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-8 space-y-1">
        {items.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setChecked((s) => s.map((v, idx) => (idx === i ? !v : v)))}
              className="group flex w-full items-start gap-4 border-b border-outline-variant py-3 text-left last:border-b-0"
              aria-pressed={checked[i]}
            >
              <span
                className={`mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  checked[i]
                    ? "bg-primary border-primary"
                    : "border-outline-variant group-hover:border-on-surface-variant"
                }`}
              >
                {checked[i] && <Check strokeWidth={2.5} className="h-3 w-3 text-surface" />}
              </span>
              <span
                className={`text-[14px] leading-[1.55] transition-colors ${
                  checked[i] ? "text-on-surface-variant line-through" : "text-on-surface"
                }`}
              >
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
