import { PRIMARY_AXIS_LABELS } from "@/lib/v2/framework/axisLabels";
import { buildLiteInterpretationHints } from "@/lib/v2/survey/scorer";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { CurrentSelfLiteReport } from "@/lib/v2/lite/types";

const CONCERN_KO: Record<string, string> = {
  money: "돈",
  relationship: "관계",
  health: "건강",
  career: "진로·커리어",
  other: "지금 막히는 고민",
};

/** OPENAI 없을 때 — docs/v2/survey/06 힌트 기반 최소 리포트 */
export function buildCurrentSelfLiteFallback(
  profile: CurrentSelfProfile,
): CurrentSelfLiteReport {
  const hints = buildLiteInterpretationHints(profile);
  const top = hints.dominant_axes[0];
  const second = hints.dominant_axes[1];
  const edge = hints.growth_edge_axis;
  const concern = profile.personalization.primary_concern;
  const topLabel = top ? PRIMARY_AXIS_LABELS[top.key] : "생활 리듬";
  const secondLabel = second ? PRIMARY_AXIS_LABELS[second.key] : "";
  const edgeLabel = edge ? PRIMARY_AXIS_LABELS[edge.key] : "회복";

  const concernPhrase = concern ? CONCERN_KO[concern] ?? "고민" : "요즘의 삶";

  return {
    report_type: "current_self_lite",
    language: "ko",
    one_line_summary: `요즘은 ${topLabel}을(를) 앞세우며 살아가고, ${concernPhrase}과(와) 맞물려 움직이는 패턴이 보여요.`,
    current_pattern: {
      title: "지금의 생활 패턴",
      body: `${topLabel}${secondLabel ? `과 ${secondLabel}` : ""} 쪽 선택이 반복되면서, 하루의 우선순위가 그쪽으로 기울어져 있어요. 겉으로는 괜찮아 보여도 결정마다 미세한 긴장이 쌓일 수 있습니다.`,
    },
    key_strength: {
      title: "지금 잘 쓰는 힘",
      body: `${topLabel}을(를) 살리면 빠르게 방향을 잡고 추진할 수 있어요. 다만 이 힘에만 기대면 다른 축이 비어 보일 때 피로가 올 수 있습니다.`,
    },
    growth_edge: {
      title: "비워 두면 편해지는 곳",
      body: `${edgeLabel}을(를) 의도적으로 챙기지 않으면, 같은 노력에도 만족이 줄어드는 느낌이 날 수 있어요.`,
    },
    decision_hint: {
      title: "결정할 때",
      body: `“${topLabel}에 맞는 선택인가?”만 보지 말고, ${edgeLabel}도 함께 채워지는지 한 번 더 확인해 보세요.`,
    },
    small_action: {
      title: "이번 주 작은 실험",
      body: `${edgeLabel}을(를) 20분만이라도 의도적으로 쓰는 하루를 하나 잡아 보세요. 부담 없이 패턴 변화를 체감하기 좋습니다.`,
    },
    evidence_notes: {
      primary_signals_used: hints.dominant_axes.map((a) => a.key),
      confidence_level: "medium",
    },
  };
}
