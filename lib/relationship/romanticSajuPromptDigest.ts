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

  return `## ${params.nickname} — saju_master_v2 엑기스 Digest
- 생년월일시: ${params.birthDate} ${params.birthTime} | 출생지: ${params.birthPlace}
- 원국: ${pillars}
- 일간 ${m.stem_focus.day_stem_kor_name ?? m.stem_focus.day_stem_code} | 일지 ${m.stem_focus.day_branch_code}
- 조후: ${m.johu_climate.temperature_band} (열${m.johu_climate.heat_score}/습${m.johu_climate.moisture_score}) | 오행 목${ec.wood} 화${ec.fire} 토${ec.earth} 금${ec.metal} 수${ec.water}
- 원국 역학(상위): ${relations || "없음"}
- 신살 보유: ${possessed.join(", ") || "없음"}
- domain_signals:
  · 동거축 일궁긴장${ds.cohabitation_signals.day_palace.tension_index} 친밀${ds.cohabitation_signals.hidden_stem_intimacy.intimacy_index} CFO${ds.cohabitation_signals.wealth_officer_power.cfo_affinity_score}
  · 동료축 격국${ds.work_signals.month_geokguk.geokguk_label_ko} 추진${ds.work_signals.drive_stubborn.drive_band} 고집${ds.work_signals.drive_stubborn.stubborn_band}
  · 친구축 조후${ds.friendship_signals.johu_profile.temperature_band} 고립${ds.friendship_signals.bijie_isolation.isolation_band}
  · 가족축 카르마${ds.family_signals.year_karma.karma_tension_index} 인성${ds.family_signals.seal_parent.parent_bond_band}${uncertain}
⚠️ 전문용어·한자 출력 금지. 위 수치·밴드를 Few-Shot 규칙으로 조합 해석만 하세요.`.trim();
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
