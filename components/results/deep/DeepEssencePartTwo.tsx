"use client";

import { DeepEssenceEnergyGauge } from "@/components/results/deep/DeepEssenceEnergyGauge";
import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

const BAR_TONE_CLASS: Record<"highlight" | "accent" | "ink", string> = {
  highlight: "bg-accent-rose",
  accent: "bg-primary",
  ink: "bg-on-surface",
};

/** 로버블 Part 02(에너지) 이식 — 게이지 + 막대 3개 + 요약 + 연료/소모/최적 환경 3열 */
export function DeepEssencePartTwo({
  energy,
  t,
}: {
  energy: DeepEssenceStructuredReport["energy"];
  t: DeepEssenceUiStrings;
}) {
  return (
    <div className="space-y-10">
      <div className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <DeepEssenceEnergyGauge
          pct={energy.balance_pct}
          relationalSpendLabel={t.part2.relationalSpend}
          selfReturnLabel={t.part2.selfReturn}
          othersLabel={t.part2.others}
        />
        <p className="text-[19px] leading-[1.45] text-on-surface" style={serifStyle}>
          {energy.headline}
        </p>
      </div>

      <div className="space-y-4 border-t border-outline-variant pt-6">
        {energy.bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-baseline justify-between text-[12.5px] text-on-surface-variant">
              <span>{b.label}</span>
              <span className="tabular-nums text-on-surface">{b.value}%</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden bg-outline-variant">
              <div
                className={`h-full ${BAR_TONE_CLASS[b.tone]}`}
                style={{ width: `${Math.max(0, Math.min(100, b.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[14px] leading-[1.75] text-on-surface-variant">{energy.summary}</p>

      <div className="grid gap-8 sm:grid-cols-3">
        {[
          { title: t.part2.fuels, items: energy.fuels, accent: "text-primary" },
          { title: t.part2.drains, items: energy.drains, accent: "text-accent-rose" },
          { title: t.part2.optimal, items: energy.optimal, accent: "text-on-surface" },
        ].map((col) => (
          <div key={col.title}>
            <div className={`text-[13px] font-medium ${col.accent}`}>{col.title}</div>
            <ul className="mt-4 space-y-2">
              {col.items.map((it) => (
                <li key={it} className="text-[13.5px] leading-[1.55] text-on-surface-variant">
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
