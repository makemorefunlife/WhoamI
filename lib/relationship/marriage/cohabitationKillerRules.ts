import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import type {
  CohabitationKillerQuestion,
  KillerAlignment,
  KillerEvidenceSource,
} from "./cohabitationKillerTypes";
import type { CohabitationKillerSignals } from "./cohabitationKillerSignals";

function q(
  partial: Omit<CohabitationKillerQuestion, "priority"> & { priority?: number },
): CohabitationKillerQuestion {
  return { priority: 50, ...partial };
}

function alignmentFrom(
  sajuActive: boolean,
  psychActive: boolean,
  psychTension: boolean,
): KillerAlignment {
  if (sajuActive && psychActive) {
    return psychTension ? "reinforced" : "reinforced";
  }
  if (sajuActive && !psychActive) return "saju_only";
  if (!sajuActive && psychActive) return "psych_only";
  return "saju_only";
}

function evidenceFrom(
  sajuActive: boolean,
  psychActive: boolean,
): KillerEvidenceSource[] {
  const out: KillerEvidenceSource[] = [];
  if (sajuActive) out.push("saju");
  if (psychActive) out.push("psych");
  if (sajuActive && psychActive) out.push("cross");
  return out;
}

/** 경제권·CFO — 사주 pickHouseholdCfo × practicality 축 교차 */
function ruleEconomicDominance(
  s: CohabitationKillerSignals,
): CohabitationKillerQuestion | null {
  const psych = s.psychPracticality;
  const psychActive = psych != null;
  const psychTension = psych?.match_type === "tension";
  const sajuActive =
    s.sajuWealthPowerStruggle || s.sajuCfoNickname.length > 0;

  if (!sajuActive && !psychActive) return null;

  let priority = 55;
  let alignment: KillerAlignment = alignmentFrom(
    s.sajuWealthPowerStruggle,
    psychActive,
    psychTension ?? false,
  );
  let hook: string;
  let narrative: string;

  if (s.sajuWealthPowerStruggle && psychTension) {
    priority = 92;
    alignment = "reinforced";
    hook = sanitizeHomeLifeText(
      "통장·큰 지출 얘기만 나와도 둘 다 '내가 맞다'고 느끼나요?",
    );
    narrative = sanitizeHomeLifeText(
      `명리상 재성·편재가 양쪽 모두 강해 '듀얼 CFO' 전쟁 구조이고, 설문에서도 돈·실리 감각 격차가 큽니다. ` +
        `${s.sajuCfoNickname} 한 명에게 최종 결정권을 몰고, 다른 한 명은 의견만 내는 규칙을 문서로 정하세요. 「돈과 집안일」을 꼭 같이 보세요.`,
    );
  } else if (s.sajuWealthPowerStruggle) {
    priority = 85;
    hook = sanitizeHomeLifeText(
      "돈·주도권 얘기가 나오면 둘 다 끝까지 안 물러나나요?",
    );
    narrative = sanitizeHomeLifeText(
      `명리상 재정 주도권이 양쪽에 겹쳐 '듀얼 CFO' 위험이 큽니다. 통장·큰 지출은 ${s.sajuCfoNickname} 한 명만 — 둘이 동시에 쥐면 집안 전쟁으로 번집니다.`,
    );
  } else if (psychTension) {
    priority = 72;
    alignment = "psych_only";
    hook = sanitizeHomeLifeText(
      "통장·생활비 얘기만 나오면 분위기가 급격히 무거워지나요?",
    );
    narrative = sanitizeHomeLifeText(
      `설문에서 돈·실리 기준 격차가 커요. 사주 CFO는 ${s.sajuCfoNickname} 쪽이 유리하지만, 감정선은 숫자 싸움으로 번지기 쉽습니다. 역할만 나눠도 덜 싸워요.`,
    );
  } else {
    priority = 48;
    hook = sanitizeHomeLifeText(
      "장보기·통장 확인, 손이 더 빨리 가는 쪽이 한 명인가요?",
    );
    narrative = sanitizeHomeLifeText(
      `명리상 ${s.sajuCfoNickname}이(가) 집안 CFO로 유리합니다. 설문 격차는 크지 않아 — CFO만 정해두면 생활비 싸움이 줄어요.`,
    );
  }

  return q({
    topic: "economic_dominance",
    section_key: "money_chores",
    priority,
    hook,
    narrative,
    evidence: evidenceFrom(sajuActive, psychActive),
    alignment,
    psych_axis_key: psychActive ? "practicality" : undefined,
  });
}

/** 속궁합·침실 — bedroom 3축 × self_control 축 교차 */
function ruleBedroomRisk(
  s: CohabitationKillerSignals,
): CohabitationKillerQuestion | null {
  const psych = s.psychSelfControl;
  const psychActive = psych != null;
  const psychTension = psych?.match_type === "tension";
  const sajuActive =
    s.bedroomMismatchCount >= 2 ||
    s.bedroomDayBranchTension ||
    s.bedroomMismatchCount === 1;

  if (!sajuActive && !psychActive) return null;

  let priority = 50;
  let alignment: KillerAlignment = alignmentFrom(
    sajuActive,
    psychActive,
    psychTension ?? false,
  );

  if (s.bedroomMismatchCount >= 2 && psychTension) {
    priority = 90;
    alignment = "reinforced";
  } else if (s.bedroomMismatchCount >= 2 || s.bedroomDayBranchTension) {
    priority = 82;
  } else if (psychTension) {
    priority = 70;
    alignment = "psych_only";
  }

  const hook =
    s.bedroomMismatchCount >= 2
      ? sanitizeHomeLifeText(
          "침실에서 '속도·분위기'가 안 맞는다고 느낀 적이 반복되나요?",
        )
      : psychTension
        ? sanitizeHomeLifeText(
            "밤 12시가 넘어도 한 명은 깨어 있고, 다른 한 명은 이미 쳐져 있나요?",
          )
        : sanitizeHomeLifeText(
            "침실에서 한 축만 다른데, 그걸 말 안 하고 참고 있나요?",
          );

  const narrative = sanitizeHomeLifeText(
    s.bedroomMismatchCount >= 2
      ? `침실 DNA가 두 축 이상 엇갈립니다.${psychTension ? " 설문에서도 수면·생활 리듬 격차가 커요." : ""} 속도·촉감·분위기를 말로 맞추지 않으면 '왜 나만 맞춰?'가 쌓입니다. 「침실 케미스트리」를 같이 보세요.`
      : s.bedroomDayBranchTension
        ? "일지 충·형 신호가 있어 신체·감정 리듬 불일치가 밤마다 드러나기 쉽습니다. 피곤한 날 무거운 대화는 피하고, 침실 룰만 먼저 정하세요."
        : psychTension
          ? "수면·자기관리 리듬 격차가 커서 피곤한 날 말투가 거칠어지기 쉬워요. 취침 시간·조용한 시간만 합의해도 속궁합 리스크가 줄어요."
          : "한 축만 다른 조합입니다. 맞는 부분은 시너지가 나지만, 다른 축 마찰을 방치하면 침실 전체가 식을 수 있어요.",
  );

  return q({
    topic: "bedroom_risk",
    section_key: "bedroom",
    priority,
    hook,
    narrative,
    evidence: evidenceFrom(sajuActive, psychActive),
    alignment,
    psych_axis_key: psychActive ? "self_control" : undefined,
  });
}

/** 양가 갈등·방관 — inlawStressIndex × empathy 축 교차 */
function ruleInlawBoundary(
  s: CohabitationKillerSignals,
): CohabitationKillerQuestion | null {
  const psych = s.psychEmpathy;
  const psychActive = psych != null;
  const psychTension = psych?.match_type === "tension";
  const sajuActive =
    s.inlawNeedsStrongBoundary || s.inlawStressIndexMax >= 45;

  if (!sajuActive && !psychActive) return null;

  let priority = 52;
  let alignment: KillerAlignment = alignmentFrom(
    s.inlawNeedsStrongBoundary,
    psychActive,
    psychTension ?? false,
  );

  if (s.inlawStressIndexMax >= 70 && psychTension) {
    priority = 88;
    alignment = "reinforced";
  } else if (s.inlawNeedsStrongBoundary) {
    priority = 80;
  } else if (psychTension) {
    priority = 68;
    alignment = "psych_only";
  }

  const hook =
    s.inlawStressIndexMax >= 70
      ? sanitizeHomeLifeText(
          "시댁·처가 이야기만 나와도 집 안 공기가 바뀌고, 한 명은 방관하나요?",
        )
      : sanitizeHomeLifeText(
          "시댁·처가 문자 왔을 때, 먼저 표정 읽는 쪽이 한 명인가요?",
        );

  const narrative = sanitizeHomeLifeText(
    s.inlawStressIndexMax >= 70
      ? `양가 스트레스 지수가 높습니다(최대 ${s.inlawStressIndexMax}).${psychTension ? " 설문에서도 감정 공감 속도 격차가 커요." : ""} '감정 담당·대외 담당' 역할을 나누고, 핵가족 경계선을 문서로 정하세요. 「가족 경계」를 꼭 보세요.`
      : s.inlawNeedsStrongBoundary
        ? "명리상 원가족 개입 리스크가 있어 경계선이 약하면 작은 일도 집안 싸움으로 번집니다. 누가 전화·방문·명절을 조율할지 미리 정하세요."
        : "감정을 읽는 속도가 달라 시댁·처가 이슈에서 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요.",
  );

  return q({
    topic: "inlaw_boundary",
    section_key: "family_boundary",
    priority,
    hook,
    narrative,
    evidence: evidenceFrom(sajuActive, psychActive),
    alignment,
    psych_axis_key: psychActive ? "empathy" : undefined,
  });
}

/** 수면 핏 — sleepFit × self_control 보조 */
function ruleSleepFit(
  s: CohabitationKillerSignals,
): CohabitationKillerQuestion | null {
  if (!s.sleepFitMismatch) return null;

  const psychTension = s.psychSelfControl?.match_type === "tension";
  const priority = psychTension ? 75 : 58;

  return q({
    topic: "sleep_fit",
    section_key: "bedroom",
    priority,
    hook: sanitizeHomeLifeText(
      "잠들기 직전, 한 명은 예민하고 다른 한 명은 '별거 아닌데'인 날이 많나요?",
    ),
    narrative: sanitizeHomeLifeText(
      `수면 민감도가 둘 사이에 갈립니다.${psychTension ? " 생활 리듬 격차도 커서" : ""} 침대 분리·온도·조명만 맞춰도 밤싸움이 크게 줄어요. 「침실 케미스트리」의 수면 핏을 확인하세요.`,
    ),
    evidence: psychTension ? ["saju", "psych", "cross"] : ["saju"],
    alignment: psychTension ? "reinforced" : "saju_only",
    psych_axis_key: psychTension ? "self_control" : undefined,
  });
}

/** 홈 리스크 종합 — conflict trigger 보조 */
function ruleConflictTrigger(
  s: CohabitationKillerSignals,
): CohabitationKillerQuestion | null {
  if (s.homeRiskPct < 55 && !s.conflictDayBranchChung) return null;

  const priority = s.homeRiskPct >= 70 ? 78 : 62;

  return q({
    topic: "conflict_trigger",
    section_key: "upset",
    priority,
    hook: sanitizeHomeLifeText(
      "피곤한 날 저녁, 작은 말투 하나로 하루 종일 냉전이 이어지나요?",
    ),
    narrative: sanitizeHomeLifeText(
      `홈 리스크 ${s.homeRiskPct}% — 육아·가사·돈이 겹치는 날 감정이 폭발하기 쉽습니다. 오늘은 하나만 꺼내고, 나머지는 내일. 「갈등 & 화해」의 de-escalation 카드를 미리 정해 두세요.`,
    ),
    evidence: ["saju"],
    alignment: "saju_only",
  });
}

export function buildCohabitationKillerRuleCandidates(
  signals: CohabitationKillerSignals,
): CohabitationKillerQuestion[] {
  return [
    ruleEconomicDominance(signals),
    ruleBedroomRisk(signals),
    ruleInlawBoundary(signals),
    ruleSleepFit(signals),
    ruleConflictTrigger(signals),
  ].filter((q): q is CohabitationKillerQuestion => q != null);
}
