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

/**
 * IA Batch 1 — New Part 05 ("잘하고 있는데, 왜 피곤할 때가 있을까요?"). Same
 * `energy` data as the old Part 02, minus `energy.optimal` (moved to the new
 * Part 06 — see DeepEssencePartThree.tsx), plus `strengths`/`watchouts`
 * moved in from the old Part 01. Content itself is unchanged (no LLM
 * re-generation this batch) — only relocated and relabeled per the new IA's
 * "pattern, not people" framing (see t.part2.strengthsTitle/watchoutsTitle).
 */
export function DeepEssencePartTwo({
  energy,
  strengths,
  watchouts,
  t,
}: {
  energy: DeepEssenceStructuredReport["energy"];
  strengths: DeepEssenceStructuredReport["strengths"];
  watchouts: DeepEssenceStructuredReport["watchouts"];
  t: DeepEssenceUiStrings;
}) {
  return (
    <div className="space-y-12">
      <div className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <DeepEssenceEnergyGauge
          pct={energy.balance_pct}
          relationalSpendLabel={t.part2.selfReturn}
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

      <div className="grid gap-8 sm:grid-cols-2">
        {[
          { title: t.part2.fuels, items: energy.fuels, accent: "text-primary" },
          { title: t.part2.drains, items: energy.drains, accent: "text-accent-rose" },
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

      {/* 내가 자연스럽게 잘 쓰는 힘 (구 Part01의 strengths, 위치만 이동) */}
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
          <h3 className="text-[18px] text-on-surface" style={serifStyle}>
            {t.part2.strengthsTitle}
          </h3>
          <span className="shrink-0 text-[10px] tracking-[0.2em] text-primary uppercase">
            {t.part2.strengthsTag}
          </span>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {strengths.map((s, i) => (
            <div key={s.title} className="border-t border-primary pt-4">
              <div className="text-[10.5px] tracking-[0.2em] text-primary tabular-nums">
                0{i + 1}
              </div>
              <h4 className="mt-3 text-[18px] text-on-surface" style={serifStyle}>
                {s.title}
              </h4>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-on-surface-variant">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 잘하지만 오래 쓰면 지치는 방식 (구 Part01의 watchouts, 위치만 이동) */}
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-outline-variant pb-3">
          <h3 className="text-[18px] text-on-surface" style={serifStyle}>
            {t.part2.watchoutsTitle}
          </h3>
          <span className="text-accent-rose shrink-0 text-[10px] tracking-[0.2em] uppercase">
            {t.part2.watchoutsTag}
          </span>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {watchouts.map((w, i) => (
            <div key={w.title} className="border-accent-rose border-t pt-4">
              <div className="text-accent-rose text-[10.5px] tracking-[0.2em] tabular-nums">
                0{i + 1}
              </div>
              <h4 className="mt-3 text-[18px] text-on-surface" style={serifStyle}>
                {w.title}
              </h4>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-on-surface-variant">
                {w.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
