import type { Locale } from "@/lib/i18n/locale";
import type {
  WorkColleagueReportBody,
} from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkColleagueReport } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkColleagueContext } from "@/lib/relationship/workColleague/buildWorkColleagueContext";
import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PairWorkSignals } from "@/lib/personCore/sajuSignals/pairTypes";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/workColleague/workColleagueCopy";
import type { WorkPrescriptionItem } from "@/lib/relationship/workColleague/workPrescriptionTypes";
import {
  buildEnergyDrainLine,
  buildDirectionExecutionLine,
  buildAvoidCombinationLine,
  resolveDirectionExecutionSplit,
  buildRoleOwnershipClarityLine,
  buildSynergyFrictionCheckInNote,
} from "./workSajuRoleInsights";
import {
  buildCrisisModeLine,
  buildMutualGrowthLine,
  buildDetailVsBigPictureClauses,
  buildSoloVsDiscussLine,
  buildComplaintSignalLine,
  buildRiskAndRhythmLine,
  buildDecisionPartnershipLine,
  buildOwnershipDelegationLine,
  buildCrunchDeadlineModeLine,
  buildRecognitionCreditVisibilityLine,
  buildOfficeDistanceBoundaryLine,
} from "./workPsychRoleInsights";
import {
  buildMistakeResponseSynthesis,
  buildRepairApologyStyle,
  buildThinkVsDiscussSynthesis,
  buildMutualGrowthEffectSynthesis,
  buildBestVsRiskyConfigurationSynthesis,
} from "@/lib/relationship/workColleague/workProductGapSynthesis";
import { buildCanonicalWorkRoleMap } from "@/lib/relationship/workColleague/workCanonicalRoleModel";
import { buildWorkStoryPlan } from "@/lib/relationship/workColleague/storyPlan/buildWorkStoryPlan";

/**
 * 최종 클린업 라운드 — 상단 대표 점수(🔥🧩⚡)와 ①②③ 스냅샷 카드가 같은 3개
 * 숫자를 막대그래프로 다시 보여주는 중복을 없앤다(Friend current_enriched의
 * `snapshot_panel.narrative.topics = []` 처리와 동일 패턴). 다만 같은 topics를
 * Part3 "함께 일할 때 반복되는 흐름"(RelationshipLoopSection)도 소비하므로,
 * 숫자 카드를 비우기 전에 원본을 복제해 상황별 제목("처음 같이 일할 때" 등)만
 * 새로 붙여 meta.situational_relationship_topics로 별도 보존한다 — 새 계산 없이
 * 기존 topics 문구를 그대로 재사용(재라벨링만).
 */
const SITUATIONAL_TOPIC_TITLES: Record<Locale, [string, string, string]> = {
  "ko-KR": ["처음 같이 일할 때", "장기 프로젝트에서", "압박·갈등 상황일 때"],
  "en-US": [
    "When You First Start Working Together",
    "On Long Projects",
    "Under Pressure or Conflict",
  ],
};

/**
 * Part5 "실전 운영 가이드"의 do/dont_list에 있던 실제 근거 없는 고정 숫자
 * (10분/15분/30분/24시간/금요일/월요일 등)를 비수치 원칙으로 치환한다.
 * Friend의 PRESCRIPTION_NUMBER_STRIP과 동일하게 정확 substring 치환만
 * 사용해 이름 보간을 건드리지 않는다. production buildWorkPrescriptions.ts는
 * 무수정 — 후처리로만 적용.
 */
const WORK_PRESCRIPTION_NUMBER_STRIP: Array<[string, string]> = [
  // ko-KR
  ["주 1회 15분 '지시 금지 미팅'", "정기적인 '지시 금지 미팅'"],
  ["회의 후 30분 '수정 창'을 따로 열기", "회의 후 별도 '수정 창'을 열기"],
  ["상대가 작업 중일 때 10분마다 '어디까지 했어?' 체크", "상대가 작업 중일 때 수시로 '어디까지 했어?' 체크"],
  ["'2분 각자 발언 → 1분 침묵 → 결정자 한 줄 선언' 프로토콜", "'각자 발언 → 잠깐 침묵 → 결정자 한 줄 선언' 프로토콜"],
  ["결정 후 24시간 '재논의 유예' 규칙", "결정 후 '재논의 유예' 규칙"],
  ["10 Minutes a Week — Collaboration Check-In (공통)", "협업 운영 점검 (공통)"],
  ["금요일 10분(대면·화상·비동기 메모 모두 가능)", "정기적으로(대면·화상·비동기 메모 모두 가능)"],
  ["갈등 당일 해결이 안 되면 '월요일 첫 미팅 안건'으로만 넘기기", "갈등 당일 해결이 안 되면 '다음 정기 미팅 첫 안건'으로만 넘기기"],
  // en-US
  ["A weekly 15-minute 'no-instructions meeting'", "A recurring 'no-instructions meeting'"],
  ["open a separate 30-minute 'edit window' after the meeting", "open a separate 'edit window' after the meeting"],
  ["Checking in every 10 minutes with", "Checking in constantly with"],
  ["'2 min each speaks → 1 min silence → decision-maker states one line' protocol", "'each speaks → a beat of silence → decision-maker states one line' protocol"],
  ["A 24-hour 'no re-litigating' rule after a decision", "A 'no re-litigating' rule after a decision"],
  ["10 Minutes a Week — Collaboration Check-In (Shared)", "Collaboration Check-In (Shared)"],
  ["10 minutes every Friday (sync or async)", "A regular sync (in person, call, or async note)"],
  ["park it as Monday's first agenda item", "park it as the next regular meeting's first agenda item"],
];

function stripWorkUnsupportedFixedNumbers(text: string): string {
  let out = text;
  for (const [find, replace] of WORK_PRESCRIPTION_NUMBER_STRIP) {
    out = out.split(find).join(replace);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function sanitizeWorkPrescriptionItem(item: WorkPrescriptionItem): WorkPrescriptionItem {
  return {
    ...item,
    headline: stripWorkUnsupportedFixedNumbers(item.headline),
    do_list: item.do_list.map(stripWorkUnsupportedFixedNumbers),
    dont_list: item.dont_list.map(stripWorkUnsupportedFixedNumbers),
  };
}

/**
 * current_enriched 전용(Work) — 7개 노란불/빨간불 항목을 기존 office.section_*
 * 문자열 필드에만 덧붙인다. 새 카드 없음, production `buildWorkColleagueReport`
 * 계산 로직 무수정(같은 파라미터로 호출한 뒤 결과를 후처리).
 *
 * 데이터 원천 분리 원칙(사용자 지정) — 항목별로 하나만 사용, 절대 섞지 않음:
 *   - 사주 Pair CE만: 1(설기/충 피로), 4(관성/식상 방향·실행), 7(원진/귀문/충 회피 조합)
 *   - 11축 psych만: 2(회복탄력성/자기통제 위기 모드), 3(사고방식↔관계공감 성장),
 *                   5(사고방식 디테일/큰그림), 6(에너지방식+갈등직면성 소통 스타일)
 *
 * pair 단위(양쪽 이름을 한 문장에 같이 언급하는) 항목은 A쪽 필드 하나에만 싣는다
 * — 양쪽에 똑같이 붙이면 friend 도메인에서 잡았던 "중복 성장 문단" 버그가
 * 그대로 재현되기 때문. 항목5(디테일 vs 큰그림)만 원래 사람별로 다른 문장이라
 * 양쪽에 각각 다른 절을 붙인다.
 */
export function buildWorkColleagueReportEnriched(params: {
  nicknameA: string;
  nicknameB: string;
  sajuJsonA: SajuDataForIntegrated;
  sajuJsonB: SajuDataForIntegrated;
  birthPlaceA?: string | null;
  birthPlaceB?: string | null;
  birthTimeUnknownA?: boolean;
  birthTimeUnknownB?: boolean;
  psychMasterA?: PsychMasterJson | null;
  psychMasterB?: PsychMasterJson | null;
  personCoreMeta?: {
    reportIdA: string;
    reportIdB: string;
    inputFingerprintA: string;
    inputFingerprintB: string;
  };
  pairWork?: PairWorkSignals | null;
  workSignalsA?: WorkSajuSignals;
  workSignalsB?: WorkSajuSignals;
  locale?: Locale;
}): WorkColleagueReportBody {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const nameA = params.nicknameA || "Alex";
  const nameB = params.nicknameB || "Jordan";

  const canonicalRoleMap = buildCanonicalWorkRoleMap({
    nameA,
    nameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    workSignalsA: params.workSignalsA,
    workSignalsB: params.workSignalsB,
    locale,
  });

  const ctx = buildWorkColleagueContext({ ...params, locale });
  const base = buildWorkColleagueReport({ ...params, canonicalRoleMap });

  // ---- 사주 Pair CE 전용 3항목 ----
  const energyDrainLine = buildEnergyDrainLine({
    sig: ctx.workPairAnalysis.scoringSignals,
    chartA: ctx.workPairAnalysis.chartA,
    chartB: ctx.workPairAnalysis.chartB,
    nameA,
    nameB,
    locale,
  });
  const directionExecutionLine = buildDirectionExecutionLine({
    countsA: ctx.tenGodsA,
    countsB: ctx.tenGodsB,
    nameA,
    nameB,
    locale,
  });
  const avoidCombinationLine = buildAvoidCombinationLine({
    sig: ctx.workPairAnalysis.scoringSignals,
    locale,
  });
  const roleOwnershipClarityLine = buildRoleOwnershipClarityLine({
    countsA: ctx.tenGodsA,
    countsB: ctx.tenGodsB,
    locale,
  });
  const synergyFrictionCheckInNote = buildSynergyFrictionCheckInNote({
    sig: ctx.workPairAnalysis.scoringSignals,
    locale,
  });

  // ---- 11축 psych 전용 4항목 ----
  const crisisModeLine = buildCrisisModeLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const mutualGrowthLine = buildMutualGrowthLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const detailVsBigPicture = buildDetailVsBigPictureClauses({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const soloVsDiscussLine = buildSoloVsDiscussLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const complaintSignalLine = buildComplaintSignalLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const riskAndRhythmLine = buildRiskAndRhythmLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  // ---- Phase 3 Candidate Capability Evidence Lines ----
  const decisionPartnershipLine = buildDecisionPartnershipLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const ownershipDelegation = buildOwnershipDelegationLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const crunchDeadlineModeLine = buildCrunchDeadlineModeLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const recognitionCreditVisibilityLine = buildRecognitionCreditVisibilityLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });
  const officeDistanceBoundaryLine = buildOfficeDistanceBoundaryLine({
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    nameA,
    nameB,
    locale,
  });

  // ---- Phase 3 Product Gap Synthesis ----
  const mistakeResponse = buildMistakeResponseSynthesis({
    nameA,
    nameB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  const repairApology = buildRepairApologyStyle({
    nameA,
    nameB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  const thinkVsDiscuss = buildThinkVsDiscussSynthesis({
    nameA,
    nameB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  const mutualGrowthEffect = buildMutualGrowthEffectSynthesis({
    nameA,
    nameB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    locale,
  });

  const bestVsRiskyConfig = buildBestVsRiskyConfigurationSynthesis({
    nameA,
    nameB,
    sajuJsonA: params.sajuJsonA,
    sajuJsonB: params.sajuJsonB,
    psychA: params.psychMasterA,
    psychB: params.psychMasterB,
    workSignalsA: params.workSignalsA,
    workSignalsB: params.workSignalsB,
    locale,
  });

  const join = (...parts: Array<string | null | undefined>) =>
    parts.filter((p): p is string => Boolean(p && p.trim())).join(" ");

  // ---- 버그 수정: "무기" 뱃지 vs 방향/실행 문장 역할 충돌 ----
  // ctx.tenGodComplement.personX.strong이 비어 있으면 buildMyWeapons()가
  // 두 사람 모두에게 같은 제네릭 무기 뱃지("협업·실행"/"팀 조율")를 붙인다.
  // 그 상태에서 항목4(방향/실행 split)가 "A는 방향, B는 실행"처럼 역할을
  // 가르면, RoleCard의 "무기" 뱃지(둘 다 동일)와 synergy_one_liner 문장
  // (역할이 갈림) 두 곳이 한 카드 안에서 서로 모순된다. 새 계산 없이 — 이미
  // 계산된 ten-god counts로 같은 승자 판정을 한 번만 구해 뱃지·문장 둘 다에
  // 일관되게 반영한다.
  const weaponsCollide =
    base.office.section_roles.person_a.weapons.length > 0 &&
    JSON.stringify(base.office.section_roles.person_a.weapons) ===
      JSON.stringify(base.office.section_roles.person_b.weapons);
  const directionSplit = resolveDirectionExecutionSplit(ctx.tenGodsA, ctx.tenGodsB);
  // base.office.section_roles.synergy_one_liner always claims "different
  // business weapons" (officeReportTemplate.ts buildSynergyOneLiner), even
  // when weaponsCollide is true and both badges are identical — that reads
  // as a self-contradiction. Whenever weapons collide, never fall back to
  // that base sentence; use the direction/execution split if available, else
  // a neutral shared-strength line that doesn't claim a difference that
  // doesn't exist.
  const sharedStrengthFallback = pick(
    locale,
    `${nameA} and ${nameB} lean on similar strengths here — instead of forcing a strict split, flex the roles based on the situation.`,
    `${nameA}와 ${nameB} 둘 다 비슷한 강점을 갖고 있어요 — 억지로 역할을 나누기보다 상황에 따라 유연하게 맡아도 좋아요.`,
  );
  const synergyOneLinerBase = weaponsCollide
    ? (directionExecutionLine ?? sharedStrengthFallback)
    : join(base.office.section_roles.synergy_one_liner, directionExecutionLine);
  // 항목 8 — 방향/실행 split이 실제로 성립할 때만(같은 게이트) 경계 문서화 조언 추가.
  const synergyOneLiner = join(synergyOneLinerBase, roleOwnershipClarityLine);

  const DIRECTION_WEAPONS = pick(locale, ["Direction & final call", "Big-picture ownership"], ["방향 설정", "최종 결정"]);
  const EXECUTION_WEAPONS = pick(locale, ["Fast execution", "Turning ideas real"], ["실행력", "빠른 구현"]);
  const weaponsA =
    weaponsCollide && directionSplit
      ? directionSplit.directionLeaderIsA
        ? DIRECTION_WEAPONS
        : EXECUTION_WEAPONS
      : base.office.section_roles.person_a.weapons;
  const weaponsB =
    weaponsCollide && directionSplit
      ? directionSplit.executionLeaderIsA
        ? DIRECTION_WEAPONS
        : EXECUTION_WEAPONS
      : base.office.section_roles.person_b.weapons;

  // ---- 버그 수정: 상단 대표 점수 vs ①②③ 카드 숫자 반복 ----
  // TriScoreSnapshotPanel의 topic 카드 3장은 각각 자체 막대그래프로
  // fit/synergy/risk를 다시 그리는데, 그 값이 상단 🔥🧩⚡ 게이지와 완전히
  // 같은 3개 숫자다(같은 ctx.masterScores). 카드를 새로 계산하지 않고,
  // Part3 "함께 일할 때 반복되는 흐름"이 같은 topics를 소비하기 전에
  // 원본을 복제해 상황별 제목만 다시 붙이고(meta.situational_relationship_topics),
  // panel 쪽 topics는 비워 중복 카드를 없앤다(Friend current_enriched와 동일 패턴).
  const situationalTitles = SITUATIONAL_TOPIC_TITLES[locale] ?? SITUATIONAL_TOPIC_TITLES["ko-KR"];
  const situationalRelationshipTopics = (base.snapshot_panel?.narrative?.topics ?? []).map(
    (topic, i) => ({
      ...topic,
      title: situationalTitles[i] ?? topic.title,
    }),
  );

  // 등급 vs 대표 점수 모순 — base.meta.grade_reason은 이미
  // "파트너십 등급 B — 업무적 핏 80% · 협업 시너지 85% · 오피스 리스크 25%"
  // 형태로 세 수치를 인용하고 있어 grade_reason 자체는 손댈 필요가 없다.
  // 실제 문제는 이 문구가 화면 어디에도 노출되지 않아 등급 배지만 덩그러니
  // 보인다는 것 — buildWorkReportViewModel.ts의 opening.subtitle에 이
  // grade_reason을 연결해 배지 바로 아래에서 근거가 보이게 한다(새 계산 없음).

  // 항목 9 (R&R 점검, Chapter 8 전용) — synergy + friction 패킷이 동시에
  // 있을 때만 새 처방 아이템을 하나 추가한다. evidence.source는
  // WorkPrescriptionEvidence 타입이 "pair_work_signals" 리터럴만 허용해서
  // 실제 출처(WorkScoringSignals)와 이름이 정확히 일치하진 않지만, 이 항목의
  // 진짜 근거(signal_paths)는 summary에 그대로 남겨 추적 가능하게 했다.
  const rrCheckInItem: WorkPrescriptionItem | null = synergyFrictionCheckInNote
    ? {
        topic: "office_baseline",
        headline: pick(locale, "Check In on Roles & Ownership", "역할·소유권 점검"),
        evidence: {
          source: "pair_work_signals",
          signal_paths: ["workPairAnalysis.scoringSignals"],
          summary: pick(
            locale,
            "Both a synergy signal and a friction signal are present — this pairing needs ongoing role alignment, not a one-time fix.",
            "시너지 신호와 마찰 신호가 동시에 있어요 — 한 번 정리하고 끝나는 게 아니라 꾸준한 역할 조율이 필요한 조합이에요.",
          ),
          snapshot: {},
        },
        do_list: [synergyFrictionCheckInNote],
        dont_list: [],
      }
    : null;

  const prescriptionWork = base.meta.prescription_work
    ? {
        ...base.meta.prescription_work,
        items: [
          ...base.meta.prescription_work.items.map(sanitizeWorkPrescriptionItem),
          ...(rrCheckInItem ? [rrCheckInItem] : []),
        ],
      }
    : base.meta.prescription_work;

  const office = {
    ...base.office,
    // 항목 1 (지치는 부분) + 항목 2 (위기 모드) — pair 단위 문장이라 A쪽에만.
    section_respect: {
      ...base.office.section_respect,
      person_a_boundary: join(
        base.office.section_respect.person_a_boundary,
        energyDrainLine,
        recognitionCreditVisibilityLine,
      ),
    },
    // 항목 8 (불만 신호/대처법, Chapter 7 전용) — pair 단위 문장, 새 필드로.
    section_upset: {
      ...base.office.section_upset,
      person_a: {
        ...base.office.section_upset.person_a,
        upset_signals: join(base.office.section_upset.person_a.upset_signals, crisisModeLine),
      },
      pair_complaint_note: complaintSignalLine ?? undefined,
    },
    // 항목 3 (성장) — pair 단위 문장, A쪽 overall_character에만.
    section_dna: {
      ...base.office.section_dna,
      person_a: {
        ...base.office.section_dna.person_a,
        overall_character: join(
          base.office.section_dna.person_a.overall_character,
          mutualGrowthLine,
        ),
      },
    },
    // 항목 4 (방향/실행) — weaponsCollide면 모순되는 base 문장·뱃지를
    // 함께 교체, 아니면 기존처럼 문장만 append.
    section_roles: {
      ...base.office.section_roles,
      person_a: { ...base.office.section_roles.person_a, weapons: weaponsA },
      person_b: { ...base.office.section_roles.person_b, weapons: weaponsB },
      synergy_one_liner: join(synergyOneLiner, decisionPartnershipLine),
    },
    // 항목 5 (디테일 vs 큰그림) — 사람별로 다른 절이라 양쪽에 각각.
    // 항목 6 (혼자 vs 같이 논의) — 이미 단일 필드(communication_fit).
    section_mix_fit: {
      ...base.office.section_mix_fit,
      person_a_work_style: join(
        base.office.section_mix_fit.person_a_work_style,
        detailVsBigPicture?.clauseA,
      ),
      person_b_work_style: join(
        base.office.section_mix_fit.person_b_work_style,
        detailVsBigPicture?.clauseB,
      ),
      // 항목 10 (리스크 한도/보고 리듬) — 이미 단일 필드(communication_fit)에 함께 append.
      communication_fit: join(
        base.office.section_mix_fit.communication_fit,
        soloVsDiscussLine,
        riskAndRhythmLine,
        officeDistanceBoundaryLine,
      ),
    },
    // 항목 7 (피해야 할 조합) — 이미 단일 필드(conflict_trigger).
    section_warning: {
      ...base.office.section_warning,
      conflict_trigger: join(
        base.office.section_warning.conflict_trigger,
        avoidCombinationLine,
        crunchDeadlineModeLine,
      ),
    },
  };

  const storyPlan = buildWorkStoryPlan(
    {
      ...base,
      meta: {
        ...base.meta,
        canonical_role_map: canonicalRoleMap,
        mistake_response: mistakeResponse,
        repair_apology: repairApology,
        think_vs_discuss: thinkVsDiscuss,
        mutual_growth_effect: mutualGrowthEffect,
        best_vs_risky_config: bestVsRiskyConfig,
      },
    } as any,
    locale,
  );

  return {
    ...base,
    office,
    snapshot_panel: {
      ...base.snapshot_panel,
      narrative: {
        ...base.snapshot_panel?.narrative,
        topics: [],
      },
    },
    meta: {
      ...base.meta,
      prescription_work: prescriptionWork,
      situational_relationship_topics: situationalRelationshipTopics,
      canonical_role_map: canonicalRoleMap,
      mistake_response: mistakeResponse,
      repair_apology: repairApology,
      think_vs_discuss: thinkVsDiscuss,
      mutual_growth_effect: mutualGrowthEffect,
      best_vs_risky_config: bestVsRiskyConfig,
      story_plan: storyPlan,
    },
    story_plan: storyPlan,
  };
}
