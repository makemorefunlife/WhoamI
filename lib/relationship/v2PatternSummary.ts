import {
  PRIMARY_AXIS_LABELS,
  PRIMARY_AXIS_ORDER,
} from "@/lib/v2/framework/axisLabels";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";

/** v2 10문항 프로필 → 관계 LLM용 패턴 요약 (V1 6영역 Y/N 대체) */
export function buildV2PatternSummaryForRelationship(
  profile: CurrentSelfProfile,
): string {
  const axisLines = PRIMARY_AXIS_ORDER.map((k) => {
    const score = profile.primary_axes[k] ?? 50;
    const label = PRIMARY_AXIS_LABELS[k];
    const lean =
      score >= 65 ? "이 축에서 강한 편" : score <= 35 ? "이 축에서 약한 편" : "중간";
    return `[${label}] ${score}/100 — ${lean}`;
  }).join("\n");

  const concern = profile.personalization.primary_concern;
  const concernKo =
    concern === "money"
      ? "돈·재정"
      : concern === "relationship"
        ? "관계"
        : concern === "health"
          ? "건강"
          : concern === "career"
            ? "커리어"
            : concern
              ? "기타"
              : "미응답";

  return `Human Framework (v2 설문 10문항)
${axisLines}

[지금 신경 쓰는 영역] ${concernKo}`;
}
