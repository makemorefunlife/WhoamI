"use client";

import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

type SummaryProps = Pick<
  RomanticSajuDeepReport["report"]["section_1_summary"],
  "relationship_name" | "one_line_summary" | "grade" | "total_score" | "keywords"
>;

export type ShareSummaryCardProps = {
  summary: SummaryProps;
  relationshipFormula: string;
  /** 연인 리포트 등 — 등급 D/A 노출 생략 */
  showGrade?: boolean;
};

export default function ShareSummaryCard({
  summary,
  relationshipFormula,
  showGrade = true,
}: ShareSummaryCardProps) {
  const gradeText =
    showGrade && summary.grade
      ? typeof summary.total_score === "number"
        ? `${summary.grade} · ${Math.round(summary.total_score)}`
        : summary.grade
      : null;

  const keywords = (summary.keywords ?? []).filter(Boolean).slice(0, 4);
  const relationshipName = summary.relationship_name?.trim();

  return (
    <div className="rounded-3xl bg-surface-container-low px-5 py-6">
      <div
        className="aspect-square rounded-3xl px-6 py-6 text-on-surface"
        style={{
          background:
            "radial-gradient(130% 100% at 20% 100%, #3A2A2A 0%, #221F2B 55%)",
        }}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#C9A24B]">
              Relationship Report
            </p>
            <p className="mt-4 text-2xl leading-[1.5] font-semibold text-[#F2ECE0]">
              {relationshipFormula}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(242,236,224,0.76)]">
              {summary.one_line_summary}
            </p>
          </div>

          <div className="flex items-end justify-between gap-3">
            {gradeText ? (
              <p className="font-serif text-4xl font-bold text-[#C9A24B]">
                {gradeText}
              </p>
            ) : (
              <div />
            )}
            <div className="flex flex-wrap justify-end gap-1.5">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-[rgba(242,236,224,0.3)] px-2.5 py-1 text-[11px] text-[rgba(242,236,224,0.72)]"
                >
                  {keyword}
                </span>
              ))}
              {relationshipName ? (
                <span className="rounded-full border border-[rgba(242,236,224,0.3)] px-2.5 py-1 text-[11px] text-[rgba(242,236,224,0.72)]">
                  {relationshipName}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
