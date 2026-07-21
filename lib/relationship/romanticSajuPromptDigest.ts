import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import { isPrimaryPalaceCross } from "@/lib/saju/palaceWeight";

function formatHitsBrief(
  hits: Array<{ type: string; name?: string; interpretation?: string }>,
  limit = 3,
): string {
  if (!hits.length) return "없음";
  return hits
    .slice(0, limit)
    .map((h) => `${h.type}${h.name ? `·${h.name}` : ""}`)
    .join(" | ");
}

/** PersonCore v2 domain_signals + stem_focus 엑기스 — LLM 입력 토큰 압축용 */
export function buildRomanticPersonSignalsDigest(params: {
  nickname: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  master: SajuMasterJson;
  uncertainItems?: string[];
}): string {
  const m = params.master;
  const ds = m.domain_signals;
  const ec = m.johu_climate.element_counts;
  const possessed = m.special_signals
    .filter((s) => s.possessed)
    .map((s) => s.name_ko)
    .slice(0, 6);
  const relations = m.relation_dynamics
    .slice(0, 5)
    .map((r) => `${r.type}:${r.name}`)
    .join(" | ");

  const pillars = m.pillars
    .map((p) => `${p.label_ko}${p.pillar_hangul}`)
    .join(" · ");

  const uncertain = params.uncertainItems?.length
    ? `\n- 불확실(임의 확정 금지): ${params.uncertainItems.join("; ")}`
    : "";

  const rs = ds.romantic_signals;

  return `## ${params.nickname} — saju_master_v2 엑기스 Digest
- 생년월일시: ${params.birthDate} ${params.birthTime} | 출생지: ${params.birthPlace}
- 원국: ${pillars}
- 일간 ${m.stem_focus.day_stem_kor_name ?? m.stem_focus.day_stem_code} | 일지 ${m.stem_focus.day_branch_code}
- 조후: ${m.johu_climate.temperature_band} (열${m.johu_climate.heat_score}/습${m.johu_climate.moisture_score}) | 오행 목${ec.wood} 화${ec.fire} 토${ec.earth} 금${ec.metal} 수${ec.water}
- 원국 역학(상위): ${relations || "없음"}
- 신살 보유: ${possessed.join(", ") || "없음"}
- romantic_signals(이 사람의 연애 성향 — comparison_table 6축과 1:1 대응):
  · 감정 표현: ${rs.expression_style.expression_band} (식상${rs.expression_style.food_count})
  · 갈등 반응: ${rs.conflict_response.conflict_band} (관성${rs.conflict_response.officer_count}/식상${rs.conflict_response.food_count}, 일지충형${rs.conflict_response.day_branch_tension_hits.length}건)
  · 애정 언어: ${rs.affection_language.affection_band} (재성${rs.affection_language.wealth_count}/인성${rs.affection_language.seal_count})
  · 스트레스 패턴: ${rs.stress_pattern.stress_band} (${rs.stress_pattern.temperature_band}, 열${rs.stress_pattern.heat_score})
  · 의사결정: ${rs.decision_making.decision_band} (${rs.decision_making.strength_label})
  · 소통 방식: ${rs.communication_style.communication_band} (비겁${rs.communication_style.self_count}/인성${rs.communication_style.seal_count})${uncertain}
⚠️ 전문용어·한자 출력 금지. 위 romantic_signals 6축을 comparison_table의 6개 aspect와 그대로 매칭해서, A/B가 실제로 다른 band일 때는 그 차이가 분명히 드러나게 쓰세요. Few-Shot 규칙으로 조합 해석만 하고 수치·밴드명 자체는 출력하지 마세요.`.trim();
}

function crossHitsDigest(
  hits: PairSajuAnalysis["allCrossHits"],
  primaryOnly: boolean,
  limit = 4,
): string {
  const list = (primaryOnly
    ? hits.filter((h) => isPrimaryPalaceCross(h))
    : hits
  ).slice(0, limit);
  if (!list.length) return "없음";
  return list
    .map(
      (h) =>
        `${h.personA_pillar}↔${h.personB_pillar}[${h.type}]`,
    )
    .join(" | ");
}

/** pairAnalysis + eventScores 압축 — formatPairSajuBlock 대체 */
export function buildRomanticPairSignalsDigest(params: {
  labelA: string;
  labelB: string;
  pairAnalysis: PairSajuAnalysis;
  eventScores?: RelationshipEventScores;
}): string {
  const { pairAnalysis: pair, labelA, labelB, eventScores } = params;
  const scores = eventScores
    ? `끌림${eventScores.overall.activation}/시너지${eventScores.overall.benefit}/긴장${eventScores.overall.risk}`
    : "n/a";

  return `## ${labelA} × ${labelB} — pair Digest
- 오행 A:${JSON.stringify(pair.aElementCounts)} B:${JSON.stringify(pair.bElementCounts)} | ${pair.combinedElementNote}
- 일간 상호: ${pair.dayStemInteraction}
- 일지 교차(우선): ${crossHitsDigest(pair.dayBranchCrossHits, true)}
- 궁위 우선 교차: ${crossHitsDigest(pair.allCrossHits, true)}
- 3점수: ${scores}
- 대운 데이터 없음 — 12운성·연주·위 신호로 시기 전망 추론 (확정 예언 금지)`.trim();
}
