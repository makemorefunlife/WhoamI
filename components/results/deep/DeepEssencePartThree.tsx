"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

/**
 * IA Batch 1 — New Part 06 ("나는 어떤 사람과 환경에서 가장 나다워질까요?").
 * Same `relationships` data as the old Part 03, plus `energy.optimal` merged
 * in from the old Part 02 — this Part is about the conditions (people AND
 * environments) the person functions more naturally in, not a compatibility
 * match with a specific partner (Personal Report scope boundary — no
 * relationship-fit recommendation here).
 */
export function DeepEssencePartThree({
  relationships,
  optimal,
  t,
}: {
  relationships: DeepEssenceStructuredReport["relationships"];
  optimal: DeepEssenceStructuredReport["energy"]["optimal"];
  t: DeepEssenceUiStrings;
}) {
  return (
    <div className="space-y-10">
      <p
        className="text-[18px] leading-[1.5] text-on-surface"
        style={{ fontFamily: "var(--font-stitch-serif)" }}
      >
        {relationships.pattern}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-[13px] font-medium text-primary">{t.part3.peopleFit}</div>
          <div className="border-primary/25 bg-primary-container/40 mt-4 rounded-2xl border p-6">
            <ul className="space-y-2 text-[14px] text-on-surface">
              {relationships.fit.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary">—</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="text-accent-rose text-[13px] font-medium">{t.part3.peopleFriction}</div>
          <div className="border-accent-rose/25 mt-4 rounded-2xl border bg-[rgba(196,154,156,0.12)] p-6">
            <ul className="space-y-2 text-[14px] text-on-surface">
              {relationships.friction.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-accent-rose">—</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[13px] font-medium text-on-surface">{t.part3.languageRewritten}</div>
        <div className="mt-4 grid grid-cols-[1fr_1fr] gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant">
          <div className="text-accent-rose bg-surface px-4 py-3 text-[13px] font-medium">
            {t.part3.wounds}
          </div>
          <div className="bg-surface px-4 py-3 text-[13px] font-medium text-primary">
            {t.part3.steadies}
          </div>
          {relationships.compare.map((row, i) => (
            <div key={i} className="contents">
              <div className="bg-surface px-4 py-4 text-[14px] leading-[1.55] text-on-surface-variant">
                &ldquo;{row.wound}&rdquo;
              </div>
              <div className="bg-surface px-4 py-4 text-[14px] leading-[1.55] text-on-surface">
                &ldquo;{row.steady}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </div>

      {optimal.length > 0 ? (
        <div>
          <div className="text-[13px] font-medium text-on-surface">{t.part3.optimalTitle}</div>
          <ul className="mt-4 space-y-2">
            {optimal.map((it) => (
              <li key={it} className="flex gap-2 text-[14px] leading-[1.55] text-on-surface-variant">
                <span className="text-primary">—</span>
                {it}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
