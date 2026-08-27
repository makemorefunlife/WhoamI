import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { readRomanticBalanceCanonicalProjection } from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import type { RomanticExperienceViewModel, ConfidenceLevel } from "./romanticExperienceTypes";

export type PremiumNarrativeModule = {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  evidence?: string[];
  realLifeExample?: string;
  action?: string;
  confidence?: ConfidenceLevel;
};

/**
 * `good_match` and `drawn_to_each_other` are built here (typed sourcing, no
 * duplication of Hero/Flow content) but intentionally not rendered — see the
 * RENDERABLE_MODULE_IDS note in RomanticExperienceView.tsx. Do not add a
 * standalone card for either without first checking that "duplicated
 * ownership" note.
 */
export function buildRomanticPremiumNarrative(
  vm: RomanticExperienceViewModel,
  report: RomanticSajuDeepReport["report"],
): PremiumNarrativeModule[] {
  const modules: PremiumNarrativeModule[] = [];
  const { meta, premiumOverview, snapshot, flow, hiddenHeart, differenceMap, specialDynamics, essence } = vm;

  const nameA = meta.myName;
  const nameB = meta.partnerName;
  const balance = readRomanticBalanceCanonicalProjection(report);

  // 2. Are we a good match?
  if (premiumOverview.available && premiumOverview.eventScores) {
    const scores = premiumOverview.eventScores;
    
    // Concrete insight based on scores (without saying Affinity/Chemistry)
    let matchAnswer = "두 분은 기본적으로 잘 맞는 흐름을 타고 있습니다.";
    let matchExplanation = "가장 자연스러운 상태일 때 서로에게 긍정적인 자극이 되는 관계입니다.";
    
    if (scores.activation > 75 && scores.benefit > 75) {
      matchAnswer = "두 분은 대화나 일상을 나눌 때 서로에게서 큰 에너지를 얻는 관계입니다.";
      matchExplanation = "기본적인 삶의 방향이나 취향이 잘 통하기 때문에, 함께 있을 때 혼자일 때보다 더 큰 안정감을 느낍니다.";
    } else if (scores.risk > 75) {
      matchAnswer = "두 사람 모두 서로에게 거는 기대가 커서, 작은 차이에도 예민하게 반응할 수 있는 관계입니다.";
      matchExplanation = "서로 바라는 점이 명확하기 때문에, 표현 방식만 조금 다듬어도 훨씬 단단해질 수 있습니다.";
    }
    
    // Concrete differences without "Gap/pts/2가지 영역"
    const evidenceList: string[] = [];
    if (differenceMap.available && differenceMap.buckets.length > 0) {
      const tensionBucket = differenceMap.buckets.find(b => b.kind === "translation_required");
      if (tensionBucket && tensionBucket.items.length > 0) {
        evidenceList.push(`어느 한 사람은 갈등을 빨리 풀고 싶어 하고 다른 한 사람은 생각할 시간이 필요하거나, 혼자서 결정을 내릴지 함께 상의할지가 서로 다를 수 있습니다. 하지만 이 차이를 이해하면 오히려 관계를 튼튼하게 만드는 열쇠가 됩니다.`);
      }
    }

    modules.push({
      id: "good_match",
      question: "우리는 전반적으로 잘 맞는 커플인가요?",
      answer: matchAnswer,
      explanation: matchExplanation,
      evidence: evidenceList.length > 0 ? evidenceList : undefined,
      confidence: "high"
    });
  }

  // 3. Why we are drawn to each other — reads canonical balance_of_power
  // directly (typed bandA/bandB) instead of parsing the already-formatted
  // snapshot label string.
  if (specialDynamics.available || snapshot.available) {
    let answerText = "한 사람이 먼저 다가가고, 다른 한 사람이 그것을 자연스럽게 받아주는 호흡이 좋습니다.";

    if (balance && balance.balance_a !== balance.balance_b) {
      // balance_a/balance_b are report-fixed (person A/B), not viewer-relative —
      // use meta.nameA/nameB here, not the myName/partnerName aliases above.
      const leader =
        balance.balance_a === "leader"
          ? meta.nameA
          : balance.balance_b === "leader"
            ? meta.nameB
            : null;
      const receiver =
        balance.balance_a === "receiver"
          ? meta.nameA
          : balance.balance_b === "receiver"
            ? meta.nameB
            : null;
      if (leader && receiver) {
        answerText = `${leader} 쪽이 먼저 감정을 꺼내어 나누고, ${receiver} 쪽이 그것을 편안하게 안아줄 때 두 사람의 관계가 가장 빛납니다.`;
      }
    }

    modules.push({
      id: "drawn_to_each_other",
      question: "우리가 자연스럽게 끌리는 이유는 무엇일까요?",
      answer: answerText,
      explanation: specialDynamics.onlyTogether ?? specialDynamics.whySpecial ?? "서로 다른 방식이 만났을 때 오히려 대화가 풍부해지고 관계가 안정되기 때문입니다.",
      confidence: snapshot.confidence
    });
  }

  // 4. How each person experiences the relationship
  if (essence.available && essence.me && essence.partner) {
    modules.push({
      id: "how_we_experience",
      question: "우리는 이 관계를 어떻게 느끼고 있을까요?",
      answer: "사랑을 느끼고 표현하는 방식이 서로 다릅니다.",
      explanation: `${essence.me.narrative}\n\n${essence.partner.narrative}`,
      confidence: essence.confidence
    });
  }

  // 5. Where differences become misunderstandings
  if (snapshot.available) {
    let misunderstandingAnswer = "감정을 처리하는 속도와 시간의 차이에서 비롯됩니다.";
    let explanation = "한 사람은 갈등이 생기면 바로 대화로 풀고 싶어 하는 반면, 다른 한 사람은 자신의 감정을 차분히 돌아볼 충분한 시간이 필요합니다. 이 속도의 차이가 때로는 서로를 불안하게 만들 수 있습니다.";
    
    const tensionSignal = snapshot.signals.find(s => s.kind === "meaningful_tension")?.summary;
    if (tensionSignal && tensionSignal.includes("회복") && tensionSignal.includes("숙성")) {
      const parts = tensionSignal.split("·");
      if (parts.length >= 2) {
        const fastOne = parts.find(p => p.includes("급속 회복"))?.split(":")[0]?.trim();
        const slowOne = parts.find(p => p.includes("심층 숙성"))?.split(":")[0]?.trim();
        
        if (fastOne && slowOne) {
           misunderstandingAnswer = "감정을 가라앉히고 대화를 다시 시작하는 속도가 다르기 때문입니다.";
           explanation = `${fastOne} 쪽은 서운한 점이 생기면 금방 털어내고 다시 연결되고 싶어 하지만, ${slowOne} 쪽은 자신의 감정이 정리될 때까지 안전한 거리가 필요합니다. 이 엇갈림이 서로를 오해하게 만들 수 있습니다.`;
        }
      }
    }

    modules.push({
      id: "misunderstandings",
      question: "가장 자주 오해가 생기는 지점은 어디인가요?",
      answer: misunderstandingAnswer,
      explanation: explanation,
      confidence: "high"
    });
  }

  // 6. What each person is actually trying to say
  if (hiddenHeart.available) {
    const meNeed = hiddenHeart.me?.voice ?? hiddenHeart.me?.need;
    const partnerNeed = hiddenHeart.partner?.voice ?? hiddenHeart.partner?.need;
    
    modules.push({
      id: "actual_needs",
      question: "서로에게 진짜 바라는 것은 무엇인가요?",
      answer: "표현하는 언어는 다르지만, 두 사람 모두 관계 안에서 안전하다고 느끼고 싶어 합니다.",
      explanation: `${nameA} 쪽은 ${meNeed ? `"${meNeed}"라고 말하며 불안을 달래고 싶어 하고` : "관심을 자주 확인받고 싶어 하고"},\n${nameB} 쪽은 ${partnerNeed ? `"${partnerNeed}"라며 마음이 편안해지기를 원합니다.` : "혼자 감정을 정리할 안전한 시간을 원합니다."}`,
      realLifeExample: hiddenHeart.mutualGift ?? undefined,
      confidence: hiddenHeart.confidence
    });
  }

  // 7. Final Ending (Emotional & Practical Conclusion)
  // Derive value, recurring risk, and one next action
  let endingValue = "서로의 다름이 오히려 가장 편안한 안식이 되는 관계입니다.";
  let endingRisk = "표현 속도와 감정을 다루는 시간의 차이가 가끔은 서로를 불안하게 만들 수도 있습니다.";
  let endingAction = "오해가 생겼을 때는 각자에게 필요한 안전한 시간과 거리를 먼저 배려해 보세요.";

  if (premiumOverview.eventScores) {
     if (premiumOverview.eventScores.risk > 70) {
        endingValue = "강한 이끌림 속에서 서로에게 큰 자극과 영감이 되는 관계입니다.";
        endingRisk = "서로에게 바라는 기준이 높아 때로는 작은 다름에도 예민해질 수 있습니다.";
        endingAction = "상대방의 방식이 틀린 것이 아니라 다를 뿐이라는 점을 한 번 더 떠올려 보세요.";
     }
  }

  modules.push({
    id: "final_conclusion",
    question: "우리의 관계를 단단하게 지키려면?",
    answer: endingValue,
    explanation: `${endingRisk}\n\n${endingAction}`,
    confidence: "high"
  });

  return modules;
}
