/**
 * Romantic V4 "6-item gap batch" — date-scene cards injected into
 * CanonicalRelationshipStoryPlan.realLifeDomains (renders in c9_daily_life,
 * see composeCanonicalSectionNarratives.ts — no LLM step, directly visible).
 *
 * Strict single-data-source rule per item (mirrors Work/Family/Marriage):
 *   1-3 = psych 11-axis only (RomanticPsychMatchAxisResult[], never saju)
 *   4-6 = saju Pair CE only (pair_ce_bonding / cross_chart_wonjin_guimun /
 *         balance_of_power + cross_chart combine hit counts, never psych)
 * No internal term (십성, 축 이름, 원진/귀문 등) is exposed in output text.
 */
import type { RomanticPsychMatchAxisResult } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { RomanticPairCeBondingValue } from "../romanticPairCeBondingCanonical";
import type { CanonicalRelationshipStoryPlan, ProvenanceRef } from "./canonicalStoryPlanTypes";
import { pick, topicP, subjectP, sanitizeParticles, type NarrativeLocale } from "./narrativeLocale";

type RealLifeDomainCard = CanonicalRelationshipStoryPlan["realLifeDomains"][number];

const GAP_GATE = 15;

function prov(evidenceId: string, sourcePath: string, confidence: ProvenanceRef["confidence"]): ProvenanceRef {
  return {
    evidenceId,
    source: "psych_match",
    sourcePath,
    appliesTo: "pair",
    confidence,
    claimBoundary: "direct_evidence",
    priority: "primary",
  };
}

function sajuProv(evidenceId: string): ProvenanceRef {
  return {
    evidenceId,
    source: "romantic_ce",
    sourcePath: evidenceId,
    appliesTo: "pair",
    confidence: "medium",
    claimBoundary: "combination_judgment",
    priority: "primary",
  };
}

function axisScore(axisResults: RomanticPsychMatchAxisResult[], key: string): RomanticPsychMatchAxisResult | undefined {
  return axisResults.find((a) => a.axis_key === key);
}

function clean(text: string, names: string[], locale: NarrativeLocale): string {
  return sanitizeParticles(text, names, locale);
}

/**
 * Item 1 — 공감 vs 해결.
 * 관계공감(empathy) - 분석사고(thinking_style) 격차만으로 사람별 "위로 우선 vs 해결 우선" 성향을 판단.
 */
export function buildEmpathyVsSolvingScene(params: {
  axisResults: RomanticPsychMatchAxisResult[];
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { axisResults, nameA, nameB, locale } = params;
  const empathy = axisScore(axisResults, "empathy");
  const thinking = axisScore(axisResults, "thinking_style");
  if (!empathy || !thinking) return null;

  const leanA = empathy.score_a - thinking.score_a;
  const leanB = empathy.score_b - thinking.score_b;
  if (Math.abs(leanA - leanB) < GAP_GATE) return null;

  const comforterIsA = leanA > leanB;
  const comforter = comforterIsA ? nameA : nameB;
  const fixer = comforterIsA ? nameB : nameA;

  return {
    domainId: "empathy_vs_solving",
    title: pick(locale, "속상한 얘기를 꺼낼 때", "When One of You Opens Up About Something Hard"),
    difference: clean(
      pick(
        locale,
        `${subjectP(comforter, locale)} 먼저 "힘들었겠다"는 말부터 건네는 편이고, ${subjectP(fixer, locale)} 먼저 "그럼 이렇게 해보자"는 해결책부터 꺼내는 편이에요.`,
        `${subjectP(comforter, locale)} reaches for "that sounds really hard" first, while ${subjectP(fixer, locale)} reaches for "okay, here's what we should do" first.`,
      ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: clean(
      pick(
        locale,
        `${fixer}의 해결책이 ${comforter}에게는 "내 감정은 안 궁금한가"로 들릴 때 서운함이 쌓여요.`,
        `The risk is when ${fixer}'s fix-it instinct lands on ${comforter} as "you don't care how I feel."`,
      ),
      [nameA, nameB],
      locale,
    ),
    agreement: clean(
      pick(
        locale,
        `힘든 얘기를 꺼낼 땐 "지금 위로가 필요해" 또는 "지금 방법을 찾고 싶어"를 먼저 말해주기로 해요.`,
        `Before diving in, name which one you need: "I just need comfort right now" or "I want to problem-solve right now."`,
      ),
      [],
      locale,
    ),
    usableLine: clean(
      pick(
        locale,
        `"지금은 해결책 말고 그냥 들어줬으면 좋겠어."`,
        `"I don't need a fix right now — I just need you to listen."`,
      ),
      [],
      locale,
    ),
    checkSignal: pick(
      locale,
      "해결책 대신 먼저 안아주거나 고개를 끄덕이는 순간이 늘어나면 좋아지고 있는 신호예요.",
      "A good sign: more moments of a hug or a nod before the advice comes.",
    ),
    provenance: [
      prov("meta.psych_match.axis_results.empathy", "meta.psych_match.axis_results.empathy", "high"),
      prov("meta.psych_match.axis_results.thinking_style", "meta.psych_match.axis_results.thinking_style", "high"),
    ],
  };
}

/**
 * Item 2 — 성적·신체적 친밀감(스킨십).
 * 자극추구(stimulation) + 외향에너지(energy_style) 합산 점수만 비교.
 */
export function buildPhysicalIntimacyScene(params: {
  axisResults: RomanticPsychMatchAxisResult[];
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { axisResults, nameA, nameB, locale } = params;
  const stim = axisScore(axisResults, "stimulation");
  const energy = axisScore(axisResults, "energy_style");
  if (!stim || !energy) return null;

  const combinedA = (stim.score_a + energy.score_a) / 2;
  const combinedB = (stim.score_b + energy.score_b) / 2;
  if (Math.abs(combinedA - combinedB) < GAP_GATE) return null;

  const spontaneousIsA = combinedA > combinedB;
  const spontaneous = spontaneousIsA ? nameA : nameB;
  const deliberate = spontaneousIsA ? nameB : nameA;

  return {
    domainId: "physical_intimacy",
    title: pick(locale, "스킨십의 속도가 다를 때", "When Your Pace for Closeness Differs"),
    difference: clean(
      pick(
        locale,
        `${subjectP(spontaneous, locale)} 순간의 분위기를 타고 스킨십을 자연스럽게 먼저 건네는 편이고, ${subjectP(deliberate, locale)} 충분히 편안하고 안전하다고 느껴야 마음을 여는 편이에요.`,
        `${subjectP(spontaneous, locale)} tends to lead into physical closeness in the moment, while ${subjectP(deliberate, locale)} needs to feel fully at ease first before opening up that way.`,
      ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: clean(
      pick(
        locale,
        `${deliberate}이(가) 매번 뒤로 물러나면 ${spontaneous}은(는) 거절당한다고 느끼고, ${spontaneous}이(가) 계속 먼저 다가가면 ${deliberate}은(는) 부담을 느껴요.`,
        `If ${deliberate} keeps pulling back, ${spontaneous} can read it as rejection — and if ${spontaneous} keeps initiating, ${deliberate} can feel pressured.`,
      ),
      [nameA, nameB],
      locale,
    ),
    agreement: clean(
      pick(
        locale,
        `속도를 맞추되, 편안한 쪽이 신호를 주는 방식으로 시작해요 — 강요가 아니라 초대로.`,
        `Match the slower pace, and let the more cautious one give the cue — an invitation, not a push.`,
      ),
      [],
      locale,
    ),
    usableLine: clean(
      pick(
        locale,
        `"오늘은 그냥 손잡고 가까이 있고 싶어."`,
        `"Tonight I just want to hold hands and be close — that's enough."`,
      ),
      [],
      locale,
    ),
    checkSignal: pick(
      locale,
      "거절이 그날의 기분 문제일 뿐 관계 문제가 아니라는 걸 서로 편하게 말할 수 있으면 좋아지고 있는 신호예요.",
      "A good sign: you can both say out loud that a 'not tonight' is about mood, not about the relationship.",
    ),
    provenance: [
      prov("meta.psych_match.axis_results.stimulation", "meta.psych_match.axis_results.stimulation", "high"),
      prov("meta.psych_match.axis_results.energy_style", "meta.psych_match.axis_results.energy_style", "high"),
    ],
  };
}

const VULNERABLE_AXIS_NOTE: Record<NarrativeLocale, Record<string, { dontExpect: string; instead: string }>> = {
  "ko-KR": {
    stimulation: { dontExpect: "매번 새로운 이벤트나 깜짝 이벤트", instead: "편안하고 익숙한 데이트로도 충분히 진심이라는 것" },
    self_control: { dontExpect: "감정을 항상 차분하게 누르는 모습", instead: "가끔 욱하더라도 금방 돌아온다는 것" },
    practicality: { dontExpect: "매번 완벽하게 현실적인 계획", instead: "계획이 허술해도 마음은 진심이라는 것" },
    structure: { dontExpect: "빈틈없이 정리된 일정 관리", instead: "즉흥적인 데이트에서 오는 즐거움" },
    empathy: { dontExpect: "매 순간 세심하게 감정을 알아채주는 반응", instead: "말로 직접 얘기하면 진심으로 들어준다는 것" },
    conflict_style: { dontExpect: "갈등이 생기자마자 바로 대화로 풀리는 것", instead: "시간을 두면 결국 대화로 돌아온다는 것" },
    resilience: { dontExpect: "힘든 일이 생겨도 금방 털고 일어나는 모습", instead: "충분히 아파할 시간을 존중해주면 회복된다는 것" },
    recognition: { dontExpect: "노력을 매번 알아채고 칭찬해주는 것", instead: "말하지 않아도 곁에 있어준다는 것" },
    energy_style: { dontExpect: "항상 밝고 에너지 넘치는 리액션", instead: "조용해도 관심이 없는 게 아니라는 것" },
    decision_style: { dontExpect: "빠르고 즉각적인 결정", instead: "시간을 들여 신중하게 내린 결정이 더 단단하다는 것" },
  },
  "en-US": {
    stimulation: { dontExpect: "a new surprise or event every time", instead: "a calm, familiar date can be just as sincere" },
    self_control: { dontExpect: "staying composed at all times", instead: "a flash of frustration that passes quickly isn't a red flag" },
    practicality: { dontExpect: "a perfectly practical plan every time", instead: "a loose plan doesn't mean less care" },
    structure: { dontExpect: "airtight, pre-planned scheduling", instead: "the fun that comes from spontaneity" },
    empathy: { dontExpect: "picking up on every unspoken feeling", instead: "saying it out loud gets you a genuinely attentive ear" },
    conflict_style: { dontExpect: "conflict resolved the moment it appears", instead: "given time, they do come back to talk it through" },
    resilience: { dontExpect: "bouncing back instantly from hard things", instead: "given room to feel it, they do recover" },
    recognition: { dontExpect: "every effort noticed and praised out loud", instead: "being there quietly is its own kind of noticing" },
    energy_style: { dontExpect: "an upbeat, high-energy reaction every time", instead: "quiet doesn't mean uninterested" },
    decision_style: { dontExpect: "fast, snap decisions", instead: "a decision made slowly tends to be the sturdier one" },
  },
};

/**
 * Item 3 — 서로에게 기대하지 말아야 할 것(포기 포인트).
 * 두 사람 모두 낮거나(둘 다 40 미만) 격차가 극심한(30 이상) 축 하나만 사용.
 */
export function buildGiveUpPointScene(params: {
  axisResults: RomanticPsychMatchAxisResult[];
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { axisResults, nameA, nameB, locale } = params;
  const notes = VULNERABLE_AXIS_NOTE[locale];

  let picked: RomanticPsychMatchAxisResult | null = null;
  let pickedReason: "both_low" | "extreme_gap" | null = null;
  for (const a of axisResults) {
    if (!notes[a.axis_key]) continue;
    if (a.score_a < 40 && a.score_b < 40) {
      picked = a;
      pickedReason = "both_low";
      break;
    }
  }
  if (!picked) {
    const extreme = [...axisResults]
      .filter((a) => notes[a.axis_key])
      .sort((a, b) => b.gap - a.gap)[0];
    if (extreme && extreme.gap >= 30) {
      picked = extreme;
      pickedReason = "extreme_gap";
    }
  }
  if (!picked || !pickedReason) return null;

  const note = notes[picked.axis_key];
  const lowerName = pickedReason === "extreme_gap"
    ? (picked.score_a < picked.score_b ? nameA : nameB)
    : null;

  return {
    domainId: "give_up_point",
    title: pick(locale, "서로에게 기대하지 않아도 되는 것", "What You Don't Need to Expect From Each Other"),
    difference: clean(
      pickedReason === "both_low"
        ? pick(
            locale,
            `둘 다 ${note.dontExpect}에는 약한 편이에요. 서로에게 이 부분을 기대하면 둘 다 지쳐요.`,
            `You're both a little short on ${note.dontExpect.toLowerCase()}. Expecting it from each other just tires you both out.`,
          )
        : pick(
            locale,
            `${lowerName}에게 ${note.dontExpect}을(를) 기대하면 자주 실망하기 쉬워요 — 원래 그 부분이 약한 성향이지, 관심이 없어서가 아니에요.`,
            `Expecting ${note.dontExpect.toLowerCase()} from ${lowerName} tends to end in disappointment — it's a genuine soft spot for them, not a lack of care.`,
          ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: pick(
      locale,
      "이 부분을 계속 요구하면 상대는 '난 늘 부족한 사람'이라는 느낌을 받을 수 있어요.",
      "Keep pushing for this and your partner can start to feel like they're perpetually falling short.",
    ),
    agreement: clean(
      pick(
        locale,
        `대신 ${note.instead}을(를) 서로 알아주기로 해요.`,
        `Instead, agree to notice that ${note.instead.toLowerCase()}.`,
      ),
      [],
      locale,
    ),
    usableLine: pick(
      locale,
      `"이 부분은 원래 그런 거니까 괜찮아, 대신 다른 걸로 채워줘도 돼."`,
      `"This one's just not your thing, and that's fine — you make up for it in other ways."`,
    ),
    checkSignal: pick(
      locale,
      "이 얘기를 웃으면서 할 수 있으면, 이미 기대치를 잘 조정하고 있다는 뜻이에요.",
      "If you can laugh about this one together, you've already recalibrated the expectation well.",
    ),
    provenance: [
      prov(`meta.psych_match.axis_results.${picked.axis_key}`, `meta.psych_match.axis_results.${picked.axis_key}`, "medium"),
    ],
  };
}

/**
 * Item 4 — 설렘과 연애 케미.
 * Pair CE bonding 패킷(group: bonding/energy)만 사용 — 개수만으로 강도를 표현, 코드/십성은 노출 안 함.
 */
export function buildRomanticChemistryScene(params: {
  bonding: RomanticPairCeBondingValue | null | undefined;
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { bonding, nameA, nameB, locale } = params;
  if (!bonding || bonding.count <= 0) return null;

  const strong = bonding.count >= 3;

  return {
    domainId: "romantic_chemistry",
    title: pick(locale, "왜 유독 서로에게 설레는가", "Why the Spark With Each Other Feels Different"),
    difference: clean(
      strong
        ? pick(
            locale,
            `${nameA}와 ${nameB} 사이에는 서로를 끌어당기는 신호가 한둘이 아니에요 — 이유를 콕 집어 말하기 어려운데도 자꾸 눈이 가고 함께 있고 싶어지는 케미가 실제로 있어요.`,
            `There's more than one pull working between ${nameA} and ${nameB} — a chemistry that's hard to put your finger on but keeps drawing your attention back to each other.`,
          )
        : pick(
            locale,
            `${nameA}와 ${nameB} 사이엔 분명한 끌림의 포인트가 하나 있어요 — 소소하지만 둘 사이에서만 유독 크게 느껴지는 설렘이에요.`,
            `There's one clear pull between ${nameA} and ${nameB} — small, maybe, but it reads unusually strong specifically between the two of you.`,
          ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: pick(
      locale,
      "설렘만 믿고 서로를 이해하려는 노력을 멈추면, 시간이 지나며 그 감정만으로는 부족해질 수 있어요.",
      "Coast on the spark alone without putting in the work to understand each other, and the feeling alone won't be enough over time.",
    ),
    agreement: pick(
      locale,
      "이 설렘을 당연하게 여기지 말고, 가끔은 서로에게 왜 좋은지 말로 표현해주기로 해요.",
      "Don't take the spark for granted — every so often, say out loud what draws you to the other.",
    ),
    usableLine: clean(
      pick(
        locale,
        `"오늘 너 보는데 또 설렜어."`,
        `"I got that little flutter again just looking at you today."`,
      ),
      [],
      locale,
    ),
    checkSignal: pick(
      locale,
      "오래 사귀어도 문득 서로를 볼 때 짧은 설렘이 남아있으면, 이 케미가 잘 유지되고 있는 신호예요.",
      "A good sign: even well into the relationship, a small flicker of that spark still shows up when you catch each other's eye.",
    ),
    provenance: [sajuProv("canonical_projections.pair_ce_bonding")],
  };
}

/**
 * Item 5 — 질투·소유욕·경계.
 * Pair CE friction 신호(원진/귀문)만 사용 — 용어 노출 없이 "예민해지는 지점"으로 번역.
 */
export function buildPossessivenessScene(params: {
  wonjin: { wonjinCount?: number; guimunCount?: number } | null | undefined;
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { wonjin, nameA, nameB, locale } = params;
  if (!wonjin || (Number(wonjin.wonjinCount ?? 0) <= 0 && Number(wonjin.guimunCount ?? 0) <= 0)) return null;

  return {
    domainId: "possessiveness_boundary",
    title: pick(locale, "질투가 훅 올라오는 순간", "The Moment Jealousy Suddenly Spikes"),
    difference: clean(
      pick(
        locale,
        `${nameA}와 ${nameB}는 서로에게 유독 예민해지는 지점이 있어요 — 별일 아닌데도 상대의 친구 관계나 연락 하나에 마음이 훅 올라올 때가 있어요.`,
        `${nameA} and ${nameB} have a real sensitivity spot with each other — a small thing, like a friendship or a text, can spike a jealous reaction out of nowhere.`,
      ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: pick(
      locale,
      "이 예민함을 확인이나 통제로 풀려고 하면 오히려 상대는 숨이 막힌다고 느껴요.",
      "Trying to soothe this sensitivity through checking-up or control just makes your partner feel boxed in.",
    ),
    agreement: pick(
      locale,
      "질투가 올라올 땐 추궁하기 전에 먼저 '나 지금 불안해'라고 감정부터 말해주기로 해요.",
      "When jealousy rises, name the feeling first — 'I'm feeling insecure right now' — before jumping to questions.",
    ),
    usableLine: clean(
      pick(
        locale,
        `"의심하는 게 아니라, 그냥 너랑 더 연결되고 싶어서 그래."`,
        `"This isn't me not trusting you — I just want to feel closer to you right now."`,
      ),
      [],
      locale,
    ),
    checkSignal: pick(
      locale,
      "질투를 느낄 때 침묵하거나 캐묻는 대신 담담하게 말로 꺼낼 수 있으면, 이 부분이 건강하게 다뤄지고 있다는 신호예요.",
      "A good sign: jealousy gets said out loud calmly, instead of going silent or turning into an interrogation.",
    ),
    provenance: [sajuProv("canonical_projections.cross_chart_wonjin_guimun")],
  };
}

/**
 * Item 6 — 장기 성장.
 * balance_of_power(구조적 안정성) + 오행 보완 신호(간지 합 개수)만 사용, 용신/기신 이름은 노출 안 함.
 */
export function buildLongTermGrowthScene(params: {
  hasBalance: boolean;
  combineHitCount: number;
  nameA: string;
  nameB: string;
  locale: NarrativeLocale;
}): RealLifeDomainCard | null {
  const { hasBalance, combineHitCount, nameA, nameB, locale } = params;
  if (!hasBalance && combineHitCount <= 0) return null;

  const hasComplement = combineHitCount > 0;

  return {
    domainId: "long_term_growth",
    title: pick(locale, "시간이 지날수록 이 관계가 성장하는 방식", "How This Relationship Grows Over Time"),
    difference: clean(
      hasComplement
        ? pick(
            locale,
            `${nameA}와 ${nameB}는 서로 부족한 부분을 자연스럽게 채워주는 조합이에요 — 초반의 설렘이 가라앉은 뒤에도 이 보완 관계 덕분에 관계가 더 단단해질 가능성이 높아요.`,
            `${nameA} and ${nameB} naturally fill in each other's gaps — even once the early spark settles, that complementary fit tends to make the relationship sturdier over time.`,
          )
        : pick(
            locale,
            `${nameA}와 ${nameB}는 서로 다른 속도로 가더라도 결국 같은 방향으로 향하는 구조를 가진 관계예요 — 급하게 서두르지 않아도 꾸준히 쌓이는 안정감이 있어요.`,
            `${nameA} and ${nameB} may move at different speeds, but the underlying shape of this relationship points the same direction — a steadiness that builds without needing to rush.`,
          ),
      [nameA, nameB],
      locale,
    ),
    riskCondition: pick(
      locale,
      "성장을 서두르거나 상대를 억지로 자신의 속도에 맞추려 하면 이 장점이 오히려 부담으로 바뀔 수 있어요.",
      "Push to grow faster or force the other onto your own timeline, and this strength can flip into pressure.",
    ),
    agreement: pick(
      locale,
      "1년, 3년 뒤를 함께 그려보는 대화를 가끔 나누며, 지금의 속도가 여전히 괜찮은지 확인해요.",
      "Every so often, talk through where you picture this in a year or three, and check that the current pace still feels right.",
    ),
    usableLine: clean(
      pick(
        locale,
        `"우리 지금 속도, 나는 편안해."`,
        `"I feel good about the pace we're at right now."`,
      ),
      [],
      locale,
    ),
    checkSignal: pick(
      locale,
      "다투고 난 뒤에도 결국 '그래도 우리는 맞다'는 확신이 남으면, 장기적으로 잘 자라고 있는 관계라는 신호예요.",
      "A good sign: even after a rough patch, you both still land on 'we're still right for each other.'",
    ),
    provenance: [
      sajuProv("canonical_projections.balance_of_power"),
      ...(hasComplement
        ? [sajuProv("canonical_projections.cross_chart_six_combine")]
        : []),
    ],
  };
}
