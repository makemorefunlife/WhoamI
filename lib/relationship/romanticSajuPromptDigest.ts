import type { SajuMasterJson, YongsinEstimateSnapshot } from "@/lib/personCore/types/sajuMaster";
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { PairSajuAnalysis } from "@/lib/saju/pairChartAnalysis";
import type { RelationshipEventScores } from "@/lib/relationship/pairEventScores";
import { isPrimaryPalaceCross } from "@/lib/saju/palaceWeight";
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import {
  resolveBalanceOfPower,
  resolveSubLeads,
  resolveRecoverySpeedGap,
  resolveResidualBand,
  resolveReassuranceBand,
  resolveGiveStyle,
  resolveReassuranceMatch,
  resolveRolePlayWithSajuFrame,
} from "@/lib/relationship/romanticRules/relationshipDynamics";

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

  // romantic_signals는 오늘 추가된 필드라, 그 이전에 이미 계산·저장된 기존 유저의
  // saju_master_json에는 없을 수 있다 — 없으면 크래시 대신 이 블록만 생략한다.
  const rs = ds.romantic_signals;
  const romanticSignalsBlock = rs
    ? `- romantic_signals(이 사람의 연애 성향 — comparison_table 6축과 1:1 대응):
  · 감정 표현: ${rs.expression_style.expression_band} (식상${rs.expression_style.food_count})
  · 갈등 반응: ${rs.conflict_response.conflict_band} (관성${rs.conflict_response.officer_count}/식상${rs.conflict_response.food_count}, 일지충형${rs.conflict_response.day_branch_tension_hits.length}건)
  · 애정 언어: ${rs.affection_language.affection_band} (재성${rs.affection_language.wealth_count}/인성${rs.affection_language.seal_count})
  · 스트레스 패턴: ${rs.stress_pattern.stress_band} (${rs.stress_pattern.temperature_band}, 열${rs.stress_pattern.heat_score})
  · 의사결정: ${rs.decision_making.decision_band} (${rs.decision_making.strength_label})
  · 소통 방식: ${rs.communication_style.communication_band} (비겁${rs.communication_style.self_count}/인성${rs.communication_style.seal_count})`
    : "- romantic_signals: 없음(구버전 스냅샷) — comparison_table은 원국 데이터만으로 해석";

  return `## ${params.nickname} — saju_master_v2 엑기스 Digest
- 생년월일시: ${params.birthDate} ${params.birthTime} | 출생지: ${params.birthPlace}
- 원국: ${pillars}
- 일간 ${m.stem_focus.day_stem_kor_name ?? m.stem_focus.day_stem_code} | 일지 ${m.stem_focus.day_branch_code}
- 조후: ${m.johu_climate.temperature_band} (열${m.johu_climate.heat_score}/습${m.johu_climate.moisture_score}) | 오행 목${ec.wood} 화${ec.fire} 토${ec.earth} 금${ec.metal} 수${ec.water}
- 원국 역학(상위): ${relations || "없음"}
- 신살 보유: ${possessed.join(", ") || "없음"}
${romanticSignalsBlock}${uncertain}
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

/**
 * yongsin_candidates[0](예: "화 — 부족한 기운, 관계에서 채우고 싶은 에너지")에서
 * 오행명만 뽑는다. estimateYongsinGisin은 간이 추정(confidence 항상 "low")이라
 * 판정에는 안 쓰고 digest에 추가 근거 텍스트로만 병기한다.
 */
function shortYongsinElement(y: YongsinEstimateSnapshot | null | undefined): string | null {
  const first = y?.yongsin_candidates?.[0];
  if (!first) return null;
  return first.split(" —")[0]?.trim() || null;
}

/**
 * 관계 역학 4종(균형추/회복속도/안심신호/무의식역할극) — 심리축+사주 보정으로
 * 서버가 이미 판정해 둔 결과를 LLM에게 근거로 전달한다. LLM은 이 판정을
 * 문장으로 풀어쓰기만 하고, 새로 유형을 정하지 않는다.
 */
export function buildRomanticDynamicsDigest(params: {
  nicknameA: string;
  nicknameB: string;
  profileA?: CurrentSelfProfile | null;
  profileB?: CurrentSelfProfile | null;
  romanticA: RomanticSajuSignals;
  romanticB: RomanticSajuSignals;
  rootedA: boolean;
  rootedB: boolean;
  dayStemInteraction: string;
  yongsinA?: YongsinEstimateSnapshot | null;
  yongsinB?: YongsinEstimateSnapshot | null;
}): string {
  const {
    nicknameA,
    nicknameB,
    profileA,
    profileB,
    romanticA,
    romanticB,
    rootedA,
    rootedB,
    dayStemInteraction,
    yongsinA,
    yongsinB,
  } = params;

  const bop = resolveBalanceOfPower(profileA, profileB);
  const subLeads = resolveSubLeads(romanticA, romanticB);
  const recovery = resolveRecoverySpeedGap(profileA, profileB);
  const residualA = resolveResidualBand(romanticA);
  const residualB = resolveResidualBand(romanticB);
  const needA = resolveReassuranceBand(profileA, rootedA);
  const needB = resolveReassuranceBand(profileB, rootedB);
  const giveA = resolveGiveStyle(romanticA);
  const giveB = resolveGiveStyle(romanticB);
  const matchBGivesA = resolveReassuranceMatch(needA, giveB);
  const matchAGivesB = resolveReassuranceMatch(needB, giveA);
  const rolePlay = resolveRolePlayWithSajuFrame(
    profileA,
    profileB,
    romanticA,
    romanticB,
    dayStemInteraction,
  );

  const yongsinElementA = shortYongsinElement(yongsinA);
  const yongsinElementB = shortYongsinElement(yongsinB);
  const giveBText = yongsinElementB ? `${giveB}(희용신 ${yongsinElementB})` : giveB;
  const giveAText = yongsinElementA ? `${giveA}(희용신 ${yongsinElementA})` : giveA;

  return `## dynamics_digest — 관계 역학 4종 (서버 판정 완료, 그대로 서술만 할 것)
- balance_of_power: ${nicknameA}=${bop.bandA} / ${nicknameB}=${bop.bandB} (서브 리드 — 아이디어·분위기:${subLeads.ideaMoodLead}, 결정·승인:${subLeads.decisionApprovalLead}, 실행:${subLeads.executionLead})
- recovery_speed: ${nicknameA}=${recovery.bandA}(잔류도 ${residualA}) / ${nicknameB}=${recovery.bandB}(잔류도 ${residualB}) ${recovery.mismatch ? "— 격차 큼(주의)" : ""}
- reassurance: ${nicknameA} need=${needA} vs ${nicknameB} give=${giveBText} → 일치:${matchBGivesA} | ${nicknameB} need=${needB} vs ${nicknameA} give=${giveAText} → 일치:${matchAGivesB}
- role_play: 심리축 판정=${rolePlay.primaryFrame} / 사주 판정=${rolePlay.sajuFrame} (일치:${rolePlay.agrees})
⚠️ 위 밴드·판정 이름 자체는 출력하지 말고, 이미 정해진 방향으로만 자연스러운 문장을 쓰세요.`.trim();
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
