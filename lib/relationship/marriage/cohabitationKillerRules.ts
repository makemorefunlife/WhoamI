import { sanitizeHomeLifeText } from "./homeLifeLanguage";
import type {
  CohabitationKillerQuestion,
  KillerAlignment,
  KillerEvidenceSource,
} from "./cohabitationKillerTypes";
import type { CohabitationKillerSignals } from "./cohabitationKillerSignals";
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "./marriageCopy";

function q(
  partial: Omit<CohabitationKillerQuestion, "priority"> & { priority?: number },
): CohabitationKillerQuestion {
  return { priority: 50, ...partial };
}

function alignmentFrom(
  sajuActive: boolean,
  psychActive: boolean,
  _psychTension: boolean,
): KillerAlignment {
  if (sajuActive && psychActive) {
    return "reinforced";
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

/** 경제권·CFO — 최종 운영 CFO(section_money_chores) × practicality 축 교차 */
function ruleEconomicDominance(
  s: CohabitationKillerSignals,
  locale: Locale,
): CohabitationKillerQuestion | null {
  const psych = s.psychPracticality;
  const psychActive = psych != null;
  const psychTension = psych?.match_type === "tension";
  const sajuActive =
    s.sajuWealthPowerStruggle || s.finalCfoNickname.length > 0;

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
      pick(
        locale,
        "Does just mentioning the bank account or a big expense make you both feel 'I'm right' about it?",
        "통장·큰 지출 얘기만 나와도 둘 다 '내가 맞다'고 느끼나요?",
      ),
    );
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `Wealth-star energy runs strong on both sides, setting up a 'dual CFO' power struggle — and the survey shows a big gap in your sense of money and practicality too. Put final decision-making power in ${s.finalCfoNickname}'s hands alone, with the other person only offering input, and write the rule down. Be sure to check 「Money & Chores」 together.`,
        `재성·편재가 양쪽 모두 강해 '듀얼 CFO' 전쟁 구조이고, 설문에서도 돈·실리 감각 격차가 큽니다. ` +
          `현재 운영 조합에서는 ${s.finalCfoNickname} 한 명에게 최종 결정권을 몰고, 다른 한 명은 의견만 내는 규칙을 문서로 정하세요. 「돈과 집안일」을 꼭 같이 보세요.`,
      ),
    );
  } else if (s.sajuWealthPowerStruggle) {
    priority = 85;
    hook = sanitizeHomeLifeText(
      pick(
        locale,
        "When money or who's in charge comes up, do neither of you ever back down?",
        "돈·주도권 얘기가 나오면 둘 다 끝까지 안 물러나나요?",
      ),
    );
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `Financial leadership overlaps on both sides, creating a real 'dual CFO' risk. Let ${s.finalCfoNickname} alone handle the bank account and big expenses — if you both hold the reins at once, it turns into a household war.`,
        `재정 주도권이 양쪽에 겹쳐 '듀얼 CFO' 위험이 큽니다. 통장·큰 지출은 ${s.finalCfoNickname} 한 명만 — 둘이 동시에 쥐면 집안 전쟁으로 번집니다.`,
      ),
    );
  } else if (psychTension) {
    priority = 72;
    alignment = "psych_only";
    hook = sanitizeHomeLifeText(
      pick(
        locale,
        "Does the mood turn heavy fast the moment the bank account or living expenses come up?",
        "통장·생활비 얘기만 나오면 분위기가 급격히 무거워지나요?",
      ),
    );
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `The survey shows a big gap in your standards around money and practicality. In your operating mix, ${s.finalCfoNickname} as CFO is the more stable call, but the emotional side can easily turn into a fight over numbers. Just splitting up the roles cuts down on fighting.`,
        `설문에서 돈·실리 기준 격차가 커요. 현재 운영 조합에서는 ${s.finalCfoNickname}가 CFO로 맡는 편이 안정적이지만, 감정선은 숫자 싸움으로 번지기 쉽습니다. 역할만 나눠도 덜 싸워요.`,
      ),
    );
  } else {
    priority = 48;
    hook = sanitizeHomeLifeText(
      pick(
        locale,
        "Is there one of you who's quicker to reach for groceries or check the bank account?",
        "장보기·통장 확인, 손이 더 빨리 가는 쪽이 한 명인가요?",
      ),
    );
    narrative = sanitizeHomeLifeText(
      pick(
        locale,
        `In your operating mix, ${s.finalCfoNickname} as household CFO is the more stable setup. The survey gap isn't large — just designating a CFO cuts down on fights over living expenses.`,
        `현재 두 사람의 운영 조합에서는 ${s.finalCfoNickname}이(가) 집안 CFO를 맡는 편이 안정적입니다. 설문 격차는 크지 않아 — CFO만 정해두면 생활비 싸움이 줄어요.`,
      ),
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
  locale: Locale,
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
          pick(
            locale,
            "Have you repeatedly felt like your 'pace and mood' don't match in the bedroom?",
            "침실에서 '속도·분위기'가 안 맞는다고 느낀 적이 반복되나요?",
          ),
        )
      : psychTension
        ? sanitizeHomeLifeText(
            pick(
              locale,
              "Past midnight, is one of you still awake while the other's already out?",
              "밤 12시가 넘어도 한 명은 깨어 있고, 다른 한 명은 이미 쳐져 있나요?",
            ),
          )
        : sanitizeHomeLifeText(
            pick(
              locale,
              "Is there just one axis where you differ in the bedroom, and are you keeping quiet about it instead of saying something?",
              "침실에서 한 축만 다른데, 그걸 말 안 하고 참고 있나요?",
            ),
          );

  const narrative = sanitizeHomeLifeText(
    s.bedroomMismatchCount >= 2
      ? pick(
          locale,
          `Your bedroom DNA differs on two or more axes.${psychTension ? " The survey shows a big gap in sleep/life rhythm too." : ""} If you don't talk through pace, touch, and mood out loud, 'why am I the only one adjusting?' builds up. Check 「Bedroom Chemistry」 together.`,
          `침실 DNA가 두 축 이상 엇갈립니다.${psychTension ? " 설문에서도 수면·생활 리듬 격차가 커요." : ""} 속도·촉감·분위기를 말로 맞추지 않으면 '왜 나만 맞춰?'가 쌓입니다. 「침실 케미스트리」를 같이 보세요.`,
        )
      : s.bedroomDayBranchTension
        ? pick(
            locale,
            "A day-branch tension signal in your chart makes a mismatch in physical/emotional rhythm easy to surface every night. Avoid heavy conversations on tired days, and just settle your bedroom rules first.",
            "일지 충·형 신호가 있어 신체·감정 리듬 불일치가 밤마다 드러나기 쉽습니다. 피곤한 날 무거운 대화는 피하고, 침실 룰만 먼저 정하세요.",
          )
        : psychTension
          ? pick(
              locale,
              "A big gap in sleep/self-care rhythm makes your tone easy to sharpen on tired days. Agreeing on bedtime and quiet time alone cuts down on bedroom-chemistry risk.",
              "수면·자기관리 리듬 격차가 커서 피곤한 날 말투가 거칠어지기 쉬워요. 취침 시간·조용한 시간만 합의해도 속궁합 리스크가 줄어요.",
            )
          : pick(
              locale,
              "This is a pairing that differs on just one axis. Where you match, it creates real synergy — but leaving the friction on that one different axis unaddressed can cool down the whole bedroom dynamic.",
              "한 축만 다른 조합입니다. 맞는 부분은 시너지가 나지만, 다른 축 마찰을 방치하면 침실 전체가 식을 수 있어요.",
            ),
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
  locale: Locale,
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
          pick(
            locale,
            "Does the air in the house change the moment in-laws come up, with one of you checking out?",
            "시댁·처가 이야기만 나와도 집 안 공기가 바뀌고, 한 명은 방관하나요?",
          ),
        )
      : sanitizeHomeLifeText(
          pick(
            locale,
            "When a text comes in from the in-laws, is one of you quicker to read the room?",
            "시댁·처가 문자 왔을 때, 먼저 표정 읽는 쪽이 한 명인가요?",
          ),
        );

  const narrative = sanitizeHomeLifeText(
    s.inlawStressIndexMax >= 70
      ? pick(
          locale,
          `Your in-law stress index is high (max ${s.inlawStressIndexMax}).${psychTension ? " The survey shows a big gap in emotional-empathy speed too." : ""} Split into an 'emotional support' role and an 'outward-facing' role, and write down your nuclear-family boundaries. Be sure to check 「Family Boundaries」.`,
          `양가 스트레스 지수가 높습니다(최대 ${s.inlawStressIndexMax}).${psychTension ? " 설문에서도 감정 공감 속도 격차가 커요." : ""} '감정 담당·대외 담당' 역할을 나누고, 핵가족 경계선을 문서로 정하세요. 「가족 경계」를 꼭 보세요.`,
        )
      : s.inlawNeedsStrongBoundary
        ? pick(
            locale,
            "Your chart carries a risk of family-of-origin overreach, so if your boundaries are weak, even small things can turn into household fights. Decide ahead of time who handles calls, visits, and holidays.",
            "명리상 원가족 개입 리스크가 있어 경계선이 약하면 작은 일도 집안 싸움으로 번집니다. 누가 전화·방문·명절을 조율할지 미리 정하세요.",
          )
        : pick(
            locale,
            "A difference in how fast you read each other's feelings makes 'why don't you get it' vs. 'just solve it already' easy to happen on in-law issues.",
            "감정을 읽는 속도가 달라 시댁·처가 이슈에서 '왜 몰라줘' vs '그냥 해결하면 되잖아'가 생기기 쉬워요.",
          ),
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
  locale: Locale,
): CohabitationKillerQuestion | null {
  if (!s.sleepFitMismatch) return null;

  const psychTension = s.psychSelfControl?.match_type === "tension";
  const priority = psychTension ? 75 : 58;

  return q({
    topic: "sleep_fit",
    section_key: "bedroom",
    priority,
    hook: sanitizeHomeLifeText(
      pick(
        locale,
        "Right before falling asleep, is one of you sensitive while the other thinks 'it's not a big deal' more often than not?",
        "잠들기 직전, 한 명은 예민하고 다른 한 명은 '별거 아닌데'인 날이 많나요?",
      ),
    ),
    narrative: sanitizeHomeLifeText(
      pick(
        locale,
        `Your sleep sensitivity splits between the two of you.${psychTension ? " Your life-rhythm gap is large too, so" : ""} Just aligning on separate beds, temperature, and lighting cuts down on nighttime fights a lot. Check your sleep fit in 「Bedroom Chemistry」.`,
        `수면 민감도가 둘 사이에 갈립니다.${psychTension ? " 생활 리듬 격차도 커서" : ""} 침대 분리·온도·조명만 맞춰도 밤싸움이 크게 줄어요. 「침실 케미스트리」의 수면 핏을 확인하세요.`,
      ),
    ),
    evidence: psychTension ? ["saju", "psych", "cross"] : ["saju"],
    alignment: psychTension ? "reinforced" : "saju_only",
    psych_axis_key: psychTension ? "self_control" : undefined,
  });
}

/** 홈 리스크 종합 — conflict trigger 보조 */
function ruleConflictTrigger(
  s: CohabitationKillerSignals,
  locale: Locale,
): CohabitationKillerQuestion | null {
  if (s.homeRiskPct < 55 && !s.conflictDayBranchChung) return null;

  const priority = s.homeRiskPct >= 70 ? 78 : 62;

  return q({
    topic: "conflict_trigger",
    section_key: "upset",
    priority,
    hook: sanitizeHomeLifeText(
      pick(
        locale,
        "On a tired evening, can one small tone of voice trigger a cold war that lasts all day?",
        "피곤한 날 저녁, 작은 말투 하나로 하루 종일 냉전이 이어지나요?",
      ),
    ),
    narrative: sanitizeHomeLifeText(
      pick(
        locale,
        `Home risk ${s.homeRiskPct}% — on days when parenting, chores, and money all pile up, emotions can easily boil over. Bring up just one thing today, and save the rest for tomorrow. Set your de-escalation card from 「Conflict & Making Up」 ahead of time.`,
        `홈 리스크 ${s.homeRiskPct}% — 육아·가사·돈이 겹치는 날 감정이 폭발하기 쉽습니다. 오늘은 하나만 꺼내고, 나머지는 내일. 「갈등 & 화해」의 de-escalation 카드를 미리 정해 두세요.`,
      ),
    ),
    evidence: ["saju"],
    alignment: "saju_only",
  });
}

export function buildCohabitationKillerRuleCandidates(
  signals: CohabitationKillerSignals,
  locale: Locale = "ko-KR",
): CohabitationKillerQuestion[] {
  return [
    ruleEconomicDominance(signals, locale),
    ruleBedroomRisk(signals, locale),
    ruleInlawBoundary(signals, locale),
    ruleSleepFit(signals, locale),
    ruleConflictTrigger(signals, locale),
  ].filter((q): q is CohabitationKillerQuestion => q != null);
}
