import {
  RELATIONSHIP_AXIS_KEYS,
  type RelationshipAxisKey,
} from "@/lib/relationship/normalizeRelationshipPerspectives";

const AXIS_LABEL: Record<RelationshipAxisKey, string> = {
  emotional_sensitivity: "감정·민감도",
  communication_style: "말하는 방식",
  conflict_response: "갈등·거리두기",
  energy_pattern: "에너지·리듬",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/**
 * 통합 리포트 LLM에 넣을 짧은 관계 맥락 문자열.
 * relationship_reports.result_basic JSON에서 현재 리포트 시점만 발췌.
 */
export function formatResultBasicForIntegratedContext(
  resultBasic: unknown,
  viewerReportId: string,
): string | null {
  if (!isRecord(resultBasic)) return null;
  const perspectives = resultBasic.perspectives;
  if (!isRecord(perspectives)) return null;
  const slice = perspectives[viewerReportId];
  if (!isRecord(slice)) return null;

  const lines: string[] = ["[두 사람 관계 분석 요약 — 설문·4축 기반]"];

  for (const key of RELATIONSHIP_AXIS_KEYS) {
    const ax = slice[key];
    if (!isRecord(ax)) continue;
    const myLine = String(ax.my_line ?? "").trim();
    const partnerLine = String(ax.partner_line ?? "").trim();
    const insights = Array.isArray(ax.insights)
      ? ax.insights.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [];
    const actions = Array.isArray(ax.actions)
      ? ax.actions.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
      : [];

    if (!myLine && !partnerLine && insights.length === 0 && actions.length === 0) continue;

    lines.push(`— ${AXIS_LABEL[key]} —`);
    if (myLine) lines.push(`· 나: ${myLine}`);
    if (partnerLine) lines.push(`· 상대: ${partnerLine}`);
    insights.forEach((t, i) => lines.push(`· 인사이트 ${i + 1}: ${t}`));
    actions.forEach((t, i) => lines.push(`· 행동 ${i + 1}: ${t}`));
  }

  if (lines.length <= 1) return null;
  return lines.join("\n");
}
