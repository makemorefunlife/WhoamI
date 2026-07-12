import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { EssenceSelfLiteInputPayload } from "@/lib/v2/saju/essenceLiteInput";
import type { EssenceSelfLiteReport } from "@/lib/v2/lite/types";

/** OPENAI 없을 때 — dictionary 신호(일간·일지) + 6축 기반 최소 리포트 */
export function buildEssenceSelfLiteFallback(
  input: EssenceSelfLiteInputPayload,
): EssenceSelfLiteReport {
  const dm = input.day_master_signals;
  const db = input.day_branch_signals;
  const top = [...PRIMARY_AXIS_KEYS]
    .map((k) => ({
      key: k,
      score: input.essence_self_profile.primary_axes[k] ?? 50,
    }))
    .sort((a, b) => b.score - a.score)[0];

  const topLabel = PRIMARY_AXIS_LABELS[top.key];
  const personality =
    dm.metaphor_ko ||
    dm.strength_ko ||
    "새로운 자극과 자율을 중시하는 본질이 기본에 깔려 있어요.";
  const relation =
    db.meaning_ko ||
    db.strength_ko ||
    "신뢰가 쌓인 관계에서 더 깊이 열리는 편이에요.";

  return {
    report_type: "essence_self_lite",
    language: "ko",
    one_line_summary: `${personality.replace(/\.$/, "")} — 가까운 관계에서는 ${relation.replace(/\.$/, "")}.`,
    core_personality_insight: {
      title: "본질의 작동 방식",
      body: [dm.strength_ko, dm.weakness_ko, dm.advice_ko]
        .filter(Boolean)
        .join(" ")
        .trim() || personality,
    },
    relationship_tendency_insight: {
      title: "관계에서의 기본 톤",
      body: [db.strength_ko, db.weakness_ko, db.advice_ko]
        .filter(Boolean)
        .join(" ")
        .trim() || relation,
    },
    environment_fit_hint: {
      title: "잘 맞는 환경 힌트",
      body: `Human Framework상 ${topLabel} 에너지가 두드러져요. 이 축을 살릴 수 있는 역할·리듬일수록 몸이 덜 저항합니다.${
        input.meta.birth_time_unknown
          ? " (출생 시간 미입력 — 시주 신호는 제외됨)"
          : ""
      }`,
    },
    evidence_notes: {
      primary_signals_used: ["day_master_signals", "day_branch_signals", top.key],
      confidence_level: input.meta.birth_time_unknown ? "low" : "medium",
    },
  };
}
