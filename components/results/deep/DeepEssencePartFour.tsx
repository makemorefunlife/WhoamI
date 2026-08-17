"use client";

import type { DeepEssenceStructuredReport } from "@/lib/report/runDeepEssenceStructuredLlm";
import type { DeepEssenceUiStrings } from "@/components/results/deep/deepEssenceUiStrings";

const serifStyle = { fontFamily: "var(--font-stitch-serif)" } as const;

/**
 * 로버블 Part 04(플레이북) 이식 — 원칙 문단 + 상황별 표 + 격해질 때/주간 리셋 두 박스.
 *
 * IA Batch 1부터 DeepEssenceReport.tsx의 렌더 트리에서 제외됨 — playbook은
 * 새 7-Part IA에서 독립 Part로 유지하지 않기로 결정됨(Part03/04/07과 결론이
 * 반복되는 취약 지점이었음). `playbook` 데이터/스키마/prompt는 삭제하지
 * 않았고 이 컴포넌트도 그대로 남겨둠 — 향후 adaptation story(Part04) 또는
 * Part07 재설계에서 `playbook.rule`/`heated`/`reset` 등을 일부 재사용할 수
 * 있어서다("DATA KEEP, UI PART REMOVE" 원칙). 현재 어떤 파일도 이 컴포넌트를
 * import하지 않는다(dead code, 의도적으로 보존).
 */
export function DeepEssencePartFour({
  playbook,
  t,
}: {
  playbook: DeepEssenceStructuredReport["playbook"];
  t: DeepEssenceUiStrings;
}) {
  return (
    <div className="space-y-10">
      <p className="text-[18px] leading-[1.5] text-on-surface" style={serifStyle}>
        {playbook.rule}
      </p>

      <div>
        <div className="text-[13px] font-medium text-primary">{t.part4.situationalTips}</div>
        <div className="mt-4 border-t border-on-surface">
          <div className="text-on-surface-variant grid grid-cols-1 gap-4 border-b border-outline-variant py-3 text-[10px] tracking-[0.14em] uppercase sm:grid-cols-[1.1fr_1fr_1.3fr]">
            <div>{t.part4.situation}</div>
            <div>{t.part4.oldResponse}</div>
            <div className="text-primary">{t.part4.tryInstead}</div>
          </div>
          {playbook.rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-start gap-1 gap-x-4 border-b border-outline-variant py-5 last:border-b-0 sm:grid-cols-[1.1fr_1fr_1.3fr] sm:gap-4"
            >
              <div className="text-[15px] leading-[1.4] text-on-surface" style={serifStyle}>
                {r.situation}
              </div>
              <div className="text-on-surface-variant/70 text-[13.5px] leading-[1.55] line-through">
                {r.old}
              </div>
              <div className="text-[14px] leading-[1.55] text-primary">{r.better}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-accent-rose text-[13px] font-medium">{t.part4.whenHeated}</div>
          <div className="mt-4 rounded-2xl border border-outline-variant p-6">
            <p className="text-[14px] leading-[1.65] text-on-surface-variant">{playbook.heated}</p>
          </div>
        </div>
        <div>
          <div className="text-[13px] font-medium text-primary">{t.part4.weeklyReset}</div>
          <div className="mt-4 rounded-2xl border border-outline-variant p-6">
            <p className="text-[14px] leading-[1.65] text-on-surface-variant">{playbook.reset}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
