/**
 * Romantic V4 Chapter Lens Resolvers.
 * Deterministically projects Personal CE and Pair CE into rich, typed, pair-specific narratives
 * for Chapter 3 (Dynamics), Chapter 6 (Hidden Hearts), and Chapter 8 (Strength & Vulnerability).
 */

import type {
  StoryFace,
  HiddenHeartBits,
  BilateralChange,
  ProvenanceRef,
} from "./canonicalStoryPlanTypes";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";
import {
  topicP,
  subjectP,
  withP,
  roP,
  sanitizeParticles,
  pick,
  type NarrativeLocale,
} from "./narrativeLocale";

function createProv(
  evidenceId: string,
  source: string,
  sourcePath: string,
  appliesTo: "a" | "b" | "pair" | "relationship",
  confidence: "deterministic" | "high" | "medium" | "low" | "tentative" = "high",
  claimBoundary: "direct_evidence" | "combination_judgment" | "likely_behavior" | "limited_inference" = "direct_evidence",
): ProvenanceRef {
  return {
    evidenceId,
    source,
    sourcePath,
    appliesTo,
    confidence,
    claimBoundary,
    priority: "primary",
  };
}

// -----------------------------------------------------------------------------------------
// 1. Chapter 6: Hidden Hearts Lens Resolver (가장 깊은 곳, 숨은 마음)
// -----------------------------------------------------------------------------------------

export function resolveHiddenHeartsLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  locale?: NarrativeLocale;
}): HiddenHeartBits[] {
  const { relCeA, relCeB, names } = params;
  const locale: NarrativeLocale = params.locale ?? "ko-KR";
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const a = names.a;
  const b = names.b;

  const result: HiddenHeartBits[] = [];

  if (relCeA) {
    const spA = relCeA.spousePalaceProfile;
    const needText = spA?.intimateNeed ?? relCeA.relationshipNeeds[0]?.text ?? L(
      "자신의 속도와 기준이 온전히 존중받는 정서적 안전감",
      "an emotional safety of having their own pace and standards fully respected",
    );
    const repairText = spA?.profile.repairNeed ?? L(
      "차분하게 생각을 정리할 수 있는 여유와 따뜻한 신뢰의 확인",
      "the space to calmly sort out their thoughts and a warm confirmation of trust",
    );
    const visReaction = relCeA.stressResponse?.text ?? L(
      "감정 충돌을 피하며 차분히 생각을 정리하려 합니다.",
      "avoids emotional confrontation and tries to calmly sort out their thoughts.",
    );
    const innerFeel = relCeA.hiddenVulnerability?.text ?? L(
      "겉으로는 의연해 보이지만 내면 깊은 곳에서는 따뜻한 인정과 확신을 간절히 바라고 있습니다.",
      "They look composed on the surface, but deep inside they're quietly longing for warm recognition and reassurance.",
    );

    const reason = spA?.profile.core
      ? L(
          `${spA.profile.core}에서 비롯된 것으로, ${spA.profile.relationshipTendency}`,
          `This comes from ${spA.profile.core.charAt(0).toLowerCase()}${spA.profile.core.slice(1)} — ${spA.profile.relationshipTendency.charAt(0).toLowerCase()}${spA.profile.relationshipTendency.slice(1)}`,
        )
      : L(
          `${topicP(a, locale)} 관계의 중심을 지키고 상처를 최소화하고자 하기 때문입니다.`,
          `That's because ${topicP(a, locale)} wants to protect the relationship's center and minimize hurt.`,
        );
    const fear = spA?.profile.shadow
      ? L(
          `${topicP(a, locale)} 자신의 진심이 곡해되거나, ${spA.profile.shadow}`,
          `${topicP(a, locale)} fears their sincerity being misread, or that ${spA.profile.shadow.charAt(0).toLowerCase()}${spA.profile.shadow.slice(1)}`,
        )
      : L(
          `${topicP(a, locale)} 자신의 진심이 곡해되거나 상대에게 부담과 거절로 돌아올지 모른다는 두려움`,
          `${topicP(a, locale)} fears their sincerity being misread, or coming back to them as a burden or rejection`,
        );

    const provenance: ProvenanceRef[] = [
      createProv(
        `chart.a.spouse_palace.need`,
        "personal_saju_chart",
        "pillars.day.branch_ten_god",
        "a",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.a.hidden_vulnerability`,
        "personal_saju_chart",
        "day_master.vulnerability",
        "a",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.a.johu.stress`,
        "personal_saju_chart",
        "johu.temperature_band",
        "a",
        "high",
        "direct_evidence",
      ),
    ];

    result.push({
      person: "a",
      visibleReaction: sanitizeParticles(
        L(
          `${topicP(a, locale)} 갈등이나 서운함이 생겼을 때 ${visReaction}`,
          `When conflict or hurt comes up, ${topicP(a, locale)} ${visReaction.charAt(0).toLowerCase()}${visReaction.slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      innerFeeling: sanitizeParticles(`${innerFeel}`, [a, b], locale),
      reason: sanitizeParticles(reason, [a, b], locale),
      fear: sanitizeParticles(fear, [a, b], locale),
      whatHelps: sanitizeParticles(
        L(
          `${subjectP(b, locale)} ${repairText}를 실천하며, ${spA?.profile.recognitionNeed ?? "따뜻한 인정과 확신"}을 진심으로 지지해 주는 태도`,
          `An attitude where ${subjectP(b, locale)} practices ${repairText.charAt(0).toLowerCase()}${repairText.slice(1)}, and sincerely supports their need for ${(spA?.profile.recognitionNeed ?? "warm recognition and reassurance").charAt(0).toLowerCase()}${(spA?.profile.recognitionNeed ?? "warm recognition and reassurance").slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      unspokenNeed: sanitizeParticles(
        L(
          `말하지 않아도 가장 바라는 것은 ${needText}`,
          `What they want most, even unspoken, is ${needText.charAt(0).toLowerCase()}${needText.slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      provenance,
    });
  }

  if (relCeB) {
    const spB = relCeB.spousePalaceProfile;
    const needText = spB?.intimateNeed ?? relCeB.relationshipNeeds[0]?.text ?? L(
      "자신의 속도와 기준이 온전히 존중받는 정서적 안전감",
      "an emotional safety of having their own pace and standards fully respected",
    );
    const repairText = spB?.profile.repairNeed ?? L(
      "차분하게 생각을 정리할 수 있는 여유와 따뜻한 신뢰의 확인",
      "the space to calmly sort out their thoughts and a warm confirmation of trust",
    );
    const visReaction = relCeB.stressResponse?.text ?? L(
      "감정 충돌을 피하며 차분히 생각을 정리하려 합니다.",
      "avoids emotional confrontation and tries to calmly sort out their thoughts.",
    );
    const innerFeel = relCeB.hiddenVulnerability?.text ?? L(
      "겉으로는 의연해 보이지만 내면 깊은 곳에서는 따뜻한 인정과 확신을 간절히 바라고 있습니다.",
      "They look composed on the surface, but deep inside they're quietly longing for warm recognition and reassurance.",
    );

    const reason = spB?.profile.core
      ? L(
          `${spB.profile.core}에서 비롯된 것으로, ${spB.profile.relationshipTendency}`,
          `This comes from ${spB.profile.core.charAt(0).toLowerCase()}${spB.profile.core.slice(1)} — ${spB.profile.relationshipTendency.charAt(0).toLowerCase()}${spB.profile.relationshipTendency.slice(1)}`,
        )
      : L(
          `${topicP(b, locale)} 관계의 중심을 지키고 상처를 최소화하고자 하기 때문입니다.`,
          `That's because ${topicP(b, locale)} wants to protect the relationship's center and minimize hurt.`,
        );
    const fear = spB?.profile.shadow
      ? L(
          `${topicP(b, locale)} 자신의 진심이 곡해되거나, ${spB.profile.shadow}`,
          `${topicP(b, locale)} fears their sincerity being misread, or that ${spB.profile.shadow.charAt(0).toLowerCase()}${spB.profile.shadow.slice(1)}`,
        )
      : L(
          `${topicP(b, locale)} 자신의 진심이 곡해되거나 상대에게 부담과 거절로 돌아올지 모른다는 두려움`,
          `${topicP(b, locale)} fears their sincerity being misread, or coming back to them as a burden or rejection`,
        );

    const provenance: ProvenanceRef[] = [
      createProv(
        `chart.b.spouse_palace.need`,
        "personal_saju_chart",
        "pillars.day.branch_ten_god",
        "b",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.b.hidden_vulnerability`,
        "personal_saju_chart",
        "day_master.vulnerability",
        "b",
        "high",
        "direct_evidence",
      ),
      createProv(
        `chart.b.johu.stress`,
        "personal_saju_chart",
        "johu.temperature_band",
        "b",
        "high",
        "direct_evidence",
      ),
    ];

    result.push({
      person: "b",
      visibleReaction: sanitizeParticles(
        L(
          `${topicP(b, locale)} 갈등이나 서운함이 생겼을 때 ${visReaction}`,
          `When conflict or hurt comes up, ${topicP(b, locale)} ${visReaction.charAt(0).toLowerCase()}${visReaction.slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      innerFeeling: sanitizeParticles(`${innerFeel}`, [a, b], locale),
      reason: sanitizeParticles(reason, [a, b], locale),
      fear: sanitizeParticles(fear, [a, b], locale),
      whatHelps: sanitizeParticles(
        L(
          `${subjectP(a, locale)} ${repairText}를 실천하며, ${spB?.profile.recognitionNeed ?? "따뜻한 인정과 확신"}을 진심으로 지지해 주는 태도`,
          `An attitude where ${subjectP(a, locale)} practices ${repairText.charAt(0).toLowerCase()}${repairText.slice(1)}, and sincerely supports their need for ${(spB?.profile.recognitionNeed ?? "warm recognition and reassurance").charAt(0).toLowerCase()}${(spB?.profile.recognitionNeed ?? "warm recognition and reassurance").slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      unspokenNeed: sanitizeParticles(
        L(
          `말하지 않아도 가장 바라는 것은 ${needText}`,
          `What they want most, even unspoken, is ${needText.charAt(0).toLowerCase()}${needText.slice(1)}`,
        ),
        [a, b],
        locale,
      ),
      provenance,
    });
  }

  return result;
}

// -----------------------------------------------------------------------------------------
// 2. Chapter 3: Dynamics Lens Resolver (우리가 관계를 맺는 방식)
// -----------------------------------------------------------------------------------------

export function resolveDynamicsLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  comparisonTable?: Record<string, any>;
  locale?: NarrativeLocale;
}): StoryFace[] {
  const { relCeA, relCeB, names } = params;
  const locale: NarrativeLocale = params.locale ?? "ko-KR";
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const a = names.a;
  const b = names.b;

  const faces: StoryFace[] = [];

  // Face 1: Private (둘만 있을 때)
  const careA = relCeA?.careExpression?.text ?? L(
    `${topicP(a, locale)} 행동과 배려로 마음을 전합니다.`,
    `${topicP(a, locale)} shows their heart through action and care.`,
  );
  const careB = relCeB?.careExpression?.text ?? L(
    `${topicP(b, locale)} 묵묵한 신뢰와 세심함으로 마음을 전합니다.`,
    `${topicP(b, locale)} shows their heart through quiet trust and attentiveness.`,
  );

  const facePrivateProv: ProvenanceRef[] = [
    createProv(
      "chart.a.day_master.nature",
      "personal_saju_chart",
      "day_master.stem",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.day_master.nature",
      "personal_saju_chart",
      "day_master.stem",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.a.affection_language",
      "romantic_saju_signals",
      "affection_language.affection_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.b.affection_language",
      "romantic_saju_signals",
      "affection_language.affection_band",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "private",
    appearance: sanitizeParticles(
      L(
        `둘만의 편안한 공간에서 ${topicP(a, locale)} ${careA} 한편, ${topicP(b, locale)} ${careB} 이로써 두 사람은 서로에게 온전한 안식처가 되어줍니다.`,
        `In the comfort of private space, ${topicP(a, locale)} ${careA.charAt(0).toLowerCase()}${careA.slice(1)} Meanwhile, ${topicP(b, locale)} ${careB.charAt(0).toLowerCase()}${careB.slice(1)} Together, you become a full refuge for each other.`,
      ),
      [a, b],
      locale,
    ),
    // Final Evidence-to-Voice pass, item 2 — this mechanism line used to
    // re-quote coreRelationshipNature.text (the identity label already
    // stated once in Hero). Uses familiarRelationshipRole here instead —
    // real, distinct evidence from the same day-stem table, framed as what
    // each person DOES in this context rather than restating who they ARE.
    mechanism: sanitizeParticles(
      L(
        `${topicP(a, locale)} ${roP(relCeA?.familiarRelationshipRole?.text ?? "자신만의 온기", locale)} 곁을 지키고, ${topicP(b, locale)} ${roP(relCeB?.familiarRelationshipRole?.text ?? "묵묵한 균형", locale)} 안정을 잡아주어 둘만의 공간이 편안해집니다.`,
        `${topicP(a, locale)} stays close as ${(relCeA?.familiarRelationshipRole?.text ?? "their own warmth").charAt(0).toLowerCase()}${(relCeA?.familiarRelationshipRole?.text ?? "their own warmth").slice(1)}, and ${topicP(b, locale)} steadies things as ${(relCeB?.familiarRelationshipRole?.text ?? "a quiet balance").charAt(0).toLowerCase()}${(relCeB?.familiarRelationshipRole?.text ?? "a quiet balance").slice(1)}, making your private space feel comfortable.`,
      ),
      [a, b],
      locale,
    ),
    benefit: sanitizeParticles(
      L(
        `외부의 간섭 없이 둘만의 친밀한 교감과 온전한 휴식을 누릴 수 있는 편안한 안정감`,
        `A comfortable sense of stability, free of outside interference, where you can enjoy intimate connection and full rest together`,
      ),
      [a, b],
      locale,
    ),
    riskWhenExcess: sanitizeParticles(
      L(
        `한쪽이 표현을 당연하게 여기거나 상대방의 침묵을 무관심으로 오해할 때 감정의 온도가 어긋날 수 있습니다.`,
        `If one of you takes the other's expression for granted, or misreads the other's silence as indifference, your emotional temperatures can fall out of sync.`,
      ),
      [a, b],
      locale,
    ),
    observableSignal: sanitizeParticles(
      L(
        `지친 하루 끝에 만났을 때, ${subjectP(a, locale)} 먼저 하루의 기분을 털어놓고 ${subjectP(b, locale)} 이를 조용히 경청하며 편안한 쉼터를 내어주는 모습`,
        `At the end of a tiring day, ${subjectP(a, locale)} shares how the day went first, and ${subjectP(b, locale)} quietly listens and offers a comfortable place to rest`,
      ),
      [a, b],
      locale,
    ),
    provenance: facePrivateProv,
  });

  // Face 2: Responsibility (현실과 책임을 다룰 때)
  const decA = relCeA?.decisionStyle?.text ?? L(
    "상황을 직관적으로 파악하고 명확하게 결단을 내립니다.",
    "reads the situation intuitively and makes a clear call.",
  );
  const decB = relCeB?.decisionStyle?.text ?? L(
    "현실적인 세부 사항과 실리를 꼼꼼하게 검토하여 신중하게 결정합니다.",
    "carefully reviews the practical details and real benefit before deciding.",
  );

  const faceRespProv: ProvenanceRef[] = [
    createProv(
      "chart.a.day_master.decision",
      "personal_saju_chart",
      "day_master.stem",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.day_master.decision",
      "personal_saju_chart",
      "day_master.stem",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.a.five_elements.dominant",
      "personal_saju_chart",
      "five_elements.dominant",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.five_elements.dominant",
      "personal_saju_chart",
      "five_elements.dominant",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "responsibility",
    appearance: sanitizeParticles(
      L(
        `현실적인 과제나 일정을 조율할 때 ${topicP(a, locale)} ${decA} ${topicP(b, locale)} ${decB} 이처럼 두 사람은 각자의 강점을 발휘하여 상호 보완적인 역할 분담을 형성합니다.`,
        `When coordinating a real-world task or schedule, ${topicP(a, locale)} ${decA.charAt(0).toLowerCase()}${decA.slice(1)} ${topicP(b, locale)} ${decB.charAt(0).toLowerCase()}${decB.slice(1)} In this way, you each play to your strengths and form a complementary division of roles.`,
      ),
      [a, b],
      locale,
    ),
    // Final Evidence-to-Voice pass, item 2 — same dedup as face.private above.
    mechanism: sanitizeParticles(
      L(
        `${a}가 ${roP(relCeA?.familiarRelationshipRole?.text ?? "명확한 원칙과 결단력", locale)} 방향을 잡으면, ${b}는 ${roP(relCeB?.familiarRelationshipRole?.text ?? "묵묵한 현실 관리력", locale)} 그 방향을 실제로 굴러가게 만듭니다.`,
        `When ${a} sets the direction as ${(relCeA?.familiarRelationshipRole?.text ?? "clear principle and decisiveness").charAt(0).toLowerCase()}${(relCeA?.familiarRelationshipRole?.text ?? "clear principle and decisiveness").slice(1)}, ${b} is the one who actually makes it work as ${(relCeB?.familiarRelationshipRole?.text ?? "quiet real-world management").charAt(0).toLowerCase()}${(relCeB?.familiarRelationshipRole?.text ?? "quiet real-world management").slice(1)}.`,
      ),
      [a, b],
      locale,
    ),
    benefit: sanitizeParticles(
      L(
        `어려운 문제나 중요한 결정 앞에서도 우왕좌왕하지 않고 빠르고 견고하게 해결책을 찾아내는 실행력`,
        `The ability to find a solution quickly and solidly even for a hard problem or big decision, without floundering`,
      ),
      [a, b],
      locale,
    ),
    riskWhenExcess: sanitizeParticles(
      L(
        `역할 분담이 고착화되어 한 사람에게 결정이나 현실 관리의 보이지 않는 노동이 집중될 경우 피로감이 쌓일 수 있습니다.`,
        `If the division of roles hardens and the invisible labor of deciding or managing real life keeps landing on just one of you, fatigue can build up.`,
      ),
      [a, b],
      locale,
    ),
    observableSignal: sanitizeParticles(
      L(
        `여행이나 공동의 계획을 세울 때 ${subjectP(a, locale)} 큰 그림과 테마를 제안하고, ${subjectP(b, locale)} 구체적인 동선과 예산을 꼼꼼히 정리하는 호흡`,
        `When planning a trip or a shared plan, ${subjectP(a, locale)} proposes the big picture and theme, and ${subjectP(b, locale)} carefully sorts out the concrete route and budget`,
      ),
      [a, b],
      locale,
    ),
    provenance: faceRespProv,
  });

  // Face 3: Stress (갈등 및 위기 상황) — classification now reads the
  // locale-independent stressTempBand category (cold=withdraw, hot=confront)
  // instead of pattern-matching Korean keywords in the rendered stress text,
  // which would silently break once that text is in English.
  const stressA = relCeA?.stressResponse?.text ?? L(
    "감정이 고조되어 즉각적인 대화와 해답을 원합니다.",
    "their emotions spike and they want an immediate conversation and answer.",
  );
  const stressB = relCeB?.stressResponse?.text ?? L(
    "혼자만의 시간을 가지며 생각을 차분히 정리한 뒤에야 마음을 엽니다.",
    "they take time alone to calmly sort out their thoughts before opening up.",
  );

  const isSlowA = relCeA?.stressTempBand === "cold";
  const isSlowB = relCeB?.stressTempBand === "cold";
  const isFastA = relCeA?.stressTempBand === "hot";
  const isFastB = relCeB?.stressTempBand === "hot";

  let mechanismStress = L(
    `${a}와 ${b}은/는 각자의 방식으로 감정의 파도를 가라앉히고 차분하게 문제의 본질에 접근합니다.`,
    `${a} and ${b} each settle the wave of emotion in their own way and calmly approach the heart of the problem.`,
  );
  let riskStress = L(
    `서로의 스트레스 신호를 제때 감지하지 못해 작은 감정의 응어리가 방치될 위험`,
    `The risk of not catching each other's stress signals in time, letting a small knot of feeling go unaddressed`,
  );
  let signalStress = L(
    `갈등 상황에서 잠시 숨을 고른 뒤 서로의 생각을 조심스럽게 꺼내놓는 순간`,
    `The moment when, in a moment of conflict, you each take a breath before carefully putting your thoughts into words`,
  );

  if (isSlowA && isSlowB) {
    mechanismStress = L(
      `두 사람 모두 갈등 시 즉각적으로 맞서기보다 감정을 가라앉히고 혼자만의 생각을 정리할 시간을 우선시합니다.`,
      `In conflict, you both prioritize settling your emotions and taking time to think alone rather than confronting it head-on right away.`,
    );
    riskStress = L(
      `서로가 동시에 침묵의 동굴로 물러서며 오해가 장기화되거나 감정의 벽이 두터워질 위험`,
      `The risk that you both retreat into silence at the same time, letting the misunderstanding drag on or the emotional wall grow thicker`,
    );
    signalStress = L(
      `의견이 부딪힌 후 두 사람 모두 말을 아끼며 각자의 공간에서 차분히 마음을 추스르는 순간`,
      `The moment after opinions clash where you both go quiet and calmly settle yourselves in your own space`,
    );
  } else if (isFastA && isFastB) {
    mechanismStress = L(
      `두 사람 모두 문제를 마음에 담아두지 않고 그 자리에서 즉각적인 대화와 확인을 통해 풀고자 합니다.`,
      `You both want to resolve things on the spot through immediate conversation and confirmation, rather than holding a problem in.`,
    );
    riskStress = L(
      `감정이 동시에 고조되어 불필요한 언쟁으로 번지거나 서로에게 상처를 주는 말을 쏟아낼 위험`,
      `The risk that your emotions spike at the same time, spilling into an unnecessary argument or hurtful words toward each other`,
    );
    signalStress = L(
      `의견이 엇갈렸을 때 두 사람 모두 즉시 상황을 짚으며 적극적으로 대화를 시도하는 순간`,
      `The moment when, as soon as opinions diverge, you both immediately name what's happening and actively try to talk it through`,
    );
  } else if (isFastA && isSlowB) {
    mechanismStress = L(
      `${a}은/는 빠른 확인을 통해 불안을 해소하려 하고, ${b}은/는 감정의 정돈을 통해 이성적인 대화로 진입하려 합니다.`,
      `${a} tries to ease their anxiety through a quick check-in, while ${b} tries to sort out their emotions first before entering a level-headed conversation.`,
    );
    riskStress = L(
      `${a}의 다급한 확인이 ${b}에게는 압박으로 느껴지고, ${b}의 침묵이 ${a}에게는 회피로 오해되어 추격-회피의 고리가 형성될 위험`,
      `The risk that ${a}'s urgent need to check in feels like pressure to ${b}, while ${b}'s silence gets misread by ${a} as avoidance — forming a pursue-withdraw loop`,
    );
    signalStress = L(
      `의견이 맞부딪힌 직후 ${subjectP(a, locale)} 즉시 대화를 이어가려 하고, ${subjectP(b, locale)} 한 걸음 물러서서 생각할 시간을 요청하는 순간`,
      `Right after opinions clash, ${subjectP(a, locale)} tries to keep the conversation going immediately, while ${subjectP(b, locale)} steps back and asks for time to think`,
    );
  } else if (isSlowA && isFastB) {
    mechanismStress = L(
      `${b}은/는 빠른 확인을 통해 불안을 해소하려 하고, ${a}은/는 감정의 정돈을 통해 이성적인 대화로 진입하려 합니다.`,
      `${b} tries to ease their anxiety through a quick check-in, while ${a} tries to sort out their emotions first before entering a level-headed conversation.`,
    );
    riskStress = L(
      `${b}의 다급한 확인이 ${a}에게는 압박으로 느껴지고, ${a}의 침묵이 ${b}에게는 회피로 오해되어 추격-회피의 고리가 형성될 위험`,
      `The risk that ${b}'s urgent need to check in feels like pressure to ${a}, while ${a}'s silence gets misread by ${b} as avoidance — forming a pursue-withdraw loop`,
    );
    signalStress = L(
      `의견이 맞부딪힌 직후 ${subjectP(b, locale)} 즉시 대화를 이어가려 하고, ${subjectP(a, locale)} 한 걸음 물러서서 생각할 시간을 요청하는 순간`,
      `Right after opinions clash, ${subjectP(b, locale)} tries to keep the conversation going immediately, while ${subjectP(a, locale)} steps back and asks for time to think`,
    );
  }

  const faceStressProv: ProvenanceRef[] = [
    createProv(
      "chart.a.johu.stress",
      "personal_saju_chart",
      "johu.temperature_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "chart.b.johu.stress",
      "personal_saju_chart",
      "johu.temperature_band",
      "b",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.a.conflict_response",
      "romantic_saju_signals",
      "conflict_response.conflict_band",
      "a",
      "high",
      "direct_evidence",
    ),
    createProv(
      "signals.b.conflict_response",
      "romantic_saju_signals",
      "conflict_response.conflict_band",
      "b",
      "high",
      "direct_evidence",
    ),
  ];

  faces.push({
    situation: "stress",
    appearance: sanitizeParticles(
      L(
        `갈등이나 긴장 상황이 발생하면 ${topicP(a, locale)} ${stressA} 반면 ${topicP(b, locale)} ${stressB} 이로 인해 스트레스를 소화하는 처리 속도와 접근 방식의 차이가 드러납니다.`,
        `When conflict or tension arises, ${topicP(a, locale)} ${stressA.charAt(0).toLowerCase()}${stressA.slice(1)} By contrast, ${topicP(b, locale)} ${stressB.charAt(0).toLowerCase()}${stressB.slice(1)} This reveals a difference in the pace and approach you each use to process stress.`,
      ),
      [a, b],
      locale,
    ),
    mechanism: sanitizeParticles(mechanismStress, [a, b], locale),
    benefit: sanitizeParticles(
      L(
        `즉각적인 폭발을 방지하면서도 문제를 덮어두지 않고 차분하게 본질을 해결할 수 있는 균형점`,
        `A balance point that prevents an immediate blowup while still calmly resolving the heart of the issue instead of burying it`,
      ),
      [a, b],
      locale,
    ),
    riskWhenExcess: sanitizeParticles(riskStress, [a, b], locale),
    observableSignal: sanitizeParticles(signalStress, [a, b], locale),
    provenance: faceStressProv,
  });

  return faces;
}

// -----------------------------------------------------------------------------------------
// 3. Chapter 8: Strength & Vulnerability Lens Resolver (함께라서 강해지는 것과 취약해지는 것)
// -----------------------------------------------------------------------------------------

export function resolveStrengthVulnerabilityLens(params: {
  relCeA?: PersonalRelationshipCe | null;
  relCeB?: PersonalRelationshipCe | null;
  names: { a: string; b: string };
  locale?: NarrativeLocale;
}): {
  bilateralChanges: BilateralChange[];
  sharedStrength: string;
  sharedVulnerability: string;
  balancedProtection: string;
} {
  const { relCeA, relCeB, names } = params;
  const locale: NarrativeLocale = params.locale ?? "ko-KR";
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const a = names.a;
  const b = names.b;

  const strengthA = relCeA?.strengthsGivenToPartner[0]?.text ?? L(
    "솔직한 열정과 추진력으로 활력을 불어넣어 줌",
    "brings energy through honest passion and drive",
  );
  const deplA = relCeA?.depletionRisk?.text ?? L(
    "상대를 챙기느라 자신의 에너지를 과도하게 소진할 위험",
    "the risk of overspending their own energy while taking care of the other",
  );

  const strengthB = relCeB?.strengthsGivenToPartner[0]?.text ?? L(
    "흔들림 없는 책임감과 신중함으로 든든한 버팀목이 되어줌",
    "becomes a dependable pillar through unshaken responsibility and care",
  );
  const deplB = relCeB?.depletionRisk?.text ?? L(
    "모든 무게를 혼자 짊어지다 침묵 속에 지칠 위험",
    "the risk of quietly wearing themselves out carrying the full weight alone",
  );

  const bilateralChanges: BilateralChange[] = [
    {
      from: "a",
      to: "b",
      change: sanitizeParticles(
        L(
          `${topicP(a, locale)} ${withP(b, locale)} 함께할 때 ${strengthA}의 면모를 유감없이 발휘하며, ${b}의 삶에 새로운 생기와 과감한 확장의 용기를 불어넣어 줍니다.`,
          `When ${topicP(a, locale)} is with ${b}, they fully bring out ${strengthA.charAt(0).toLowerCase()}${strengthA.slice(1)}, breathing new life into ${b}'s world and the courage to boldly expand it.`,
        ),
        [a, b],
        locale,
      ),
      excessVulnerability: sanitizeParticles(
        L(
          `다만 ${deplA}이 있으므로, ${a}의 활력과 헌신이 당연시되지 않도록 상호 간의 세심한 인정과 배려가 필요합니다.`,
          `But since there's ${deplA.charAt(0).toLowerCase()}${deplA.slice(1)}, mutual, attentive recognition and care are needed so ${a}'s energy and devotion are never taken for granted.`,
        ),
        [a, b],
        locale,
      ),
      provenance: [
        createProv(
          "chart.a.strength_given",
          "personal_saju_chart",
          "day_master.strength",
          "a",
          "high",
          "direct_evidence",
        ),
        createProv(
          "chart.a.depletion_risk",
          "personal_saju_chart",
          "day_master.depletion",
          "a",
          "high",
          "direct_evidence",
        ),
      ],
    },
    {
      from: "b",
      to: "a",
      change: sanitizeParticles(
        L(
          `${topicP(b, locale)} ${withP(a, locale)} 함께할 때 ${strengthB}의 면모를 유감없이 발휘하며, ${a}의 조급함을 가라앉히고 안정적인 현실의 기반을 다져줍니다.`,
          `When ${topicP(b, locale)} is with ${a}, they fully bring out ${strengthB.charAt(0).toLowerCase()}${strengthB.slice(1)}, settling ${a}'s impatience and building a stable, real-world foundation.`,
        ),
        [a, b],
        locale,
      ),
      excessVulnerability: sanitizeParticles(
        L(
          `다만 ${deplB}이 있으므로, ${b}의 침묵과 인내를 알아채고 먼저 다정한 손을 내밀어 주는 노력이 필요합니다.`,
          `But since there's ${deplB.charAt(0).toLowerCase()}${deplB.slice(1)}, effort is needed to notice ${b}'s silence and patience and reach out warmly first.`,
        ),
        [a, b],
        locale,
      ),
      provenance: [
        createProv(
          "chart.b.strength_given",
          "personal_saju_chart",
          "day_master.strength",
          "b",
          "high",
          "direct_evidence",
        ),
        createProv(
          "chart.b.depletion_risk",
          "personal_saju_chart",
          "day_master.depletion",
          "b",
          "high",
          "direct_evidence",
        ),
      ],
    },
  ];

  // Classification now reads the locale-independent stressTempBand category
  // (see the Chapter 3 resolver above) instead of pattern-matching Korean
  // keywords in the rendered stressResponse text.
  const isSlowA = relCeA?.stressTempBand === "cold";
  const isSlowB = relCeB?.stressTempBand === "cold";
  const isFastA = relCeA?.stressTempBand === "hot";
  const isFastB = relCeB?.stressTempBand === "hot";

  let sharedVulnText = L(
    `두 사람의 가장 큰 취약점은 갈등 시 '서로의 스트레스 처리 속도 차이를 기다려주지 못할 때' 발생합니다. 한쪽의 확인 요구와 다른 쪽의 동굴 후퇴가 엇갈리면 강점이던 균형이 일시적으로 단절로 바뀔 수 있습니다.`,
    `Your biggest shared vulnerability shows up in conflict, when you can't wait out each other's different pace for processing stress. When one side's need to check in collides with the other's retreat, the balance that's usually your strength can briefly turn into disconnection.`,
  );
  let balancedProtText = L(
    `이 기여를 지키는 핵심 합의: ${a}은/는 ${b}에게 생각할 시간을 보장하고, ${b}은/는 침묵 대신 '언제까지 정리해서 말하겠다'는 확실한 신호를 전달하는 것입니다.`,
    `The key agreement that protects this: ${a} guarantees ${b} the time to think, and ${b}, instead of just going silent, gives a clear signal of "I'll have my thoughts sorted out and talk to you by ___."`,
  );

  if (isSlowA && isSlowB) {
    sharedVulnText = L(
      `두 사람의 가장 큰 취약점은 갈등 시 '동시에 침묵의 동굴로 물러나 대화의 타이밍을 놓칠 때' 발생합니다. 서로가 먼저 손 내밀기를 기다리다 보면 감정의 거리가 벌어질 수 있습니다.`,
      `Your biggest shared vulnerability shows up when, in conflict, you both retreat into silence at the same time and miss the moment to talk. If you both wait for the other to reach out first, emotional distance can grow.`,
    );
    balancedProtText = L(
      `이 기여를 지키는 핵심 합의: 혼자 삭이지 않고, '생각을 정리한 뒤 몇 시(또는 며칠 뒤)에 다시 이야기하자'는 대화 재개의 신호를 확실히 공유하는 것입니다.`,
      `The key agreement that protects this: instead of quietly sitting with it alone, clearly share a signal for reopening the conversation — "let's talk again at ___ (or in a few days) once I've sorted out my thoughts."`,
    );
  } else if (isFastA && isFastB) {
    sharedVulnText = L(
      `두 사람의 가장 큰 취약점은 갈등 시 '감정이 고조된 상태에서 즉각적인 결론을 밀어붙일 때' 발생합니다.`,
      `Your biggest shared vulnerability shows up when, in conflict, you both push for an immediate conclusion while emotions are still running high.`,
    );
    balancedProtText = L(
      `이 기여를 지키는 핵심 합의: 감정이 격해졌을 때는 잠시 대화를 멈추고 각자 10분간 호흡을 가다듬은 뒤 차분하게 다시 마주하는 것입니다.`,
      `The key agreement that protects this: when emotions run high, pause the conversation, each take 10 minutes to catch your breath, and come back to face each other calmly.`,
    );
  } else if ((isFastA && isSlowB) || (isSlowA && isFastB)) {
    // Pair-first fix: the mixed hot/cold combo — the most common real case —
    // used to fall through to the generic default text above (audit: only
    // same-speed pairs had their own branch). Now it names which person is
    // which, since that's exactly what the vulnerability actually is.
    const fastName = isFastA ? a : b;
    const slowName = isFastA ? b : a;
    sharedVulnText = L(
      `두 사람의 가장 큰 취약점은 갈등 시 ${fastName}이/가 빠르게 확인받고 싶어 할 때 ${slowName}이/가 아직 정리 중이라는 걸 서로 못 기다려줄 때 생겨요.`,
      `Your biggest shared vulnerability shows up when ${fastName} wants to check in quickly, but ${slowName} is still processing — and neither of you can wait out the gap.`,
    );
    balancedProtText = L(
      `이 기여를 지키는 핵심 합의: ${slowName}이/가 "지금은 아니고 이따 얘기하자"처럼 자기 상태를 먼저 말해주고, ${fastName}이/가 그 말을 재촉 없이 받아주는 것입니다.`,
      `The key agreement that protects this: ${slowName} says where they're at first — "not right now, let's talk later" — and ${fastName} takes that without pushing.`,
    );
  }

  // Final Evidence-to-Voice pass, item 2 — was quoting coreRelationshipNature
  // (Hero's identity label) a 5th time. strengthsGivenToPartner is the
  // thematically correct field for a "greatest strength" line, and is
  // already the source for gift.a_to_b/gift.b_to_a just above in this same
  // chapter — reusing it here is intra-chapter synthesis, not cross-chapter
  // repetition.
  const sharedStrength = sanitizeParticles(
    L(
      `두 사람이 함께할 때 가장 강력해지는 지점은 '${a}가 주는 ${relCeA?.strengthsGivenToPartner?.[0]?.text ?? "결단력"}과 ${b}가 주는 ${relCeB?.strengthsGivenToPartner?.[0]?.text ?? "묵묵한 안정감"}'이 만나는 순간입니다. 혼자일 때는 놓치기 쉬운 시야와 세밀함을 서로가 빈틈없이 채워주어, 어떤 도전 앞에서도 흔들리지 않는 단단한 팀워크를 발휘합니다.`,
      `Where you two become strongest together is the moment ${a}'s ${(relCeA?.strengthsGivenToPartner?.[0]?.text ?? "decisiveness").charAt(0).toLowerCase()}${(relCeA?.strengthsGivenToPartner?.[0]?.text ?? "decisiveness").slice(1)} meets ${b}'s ${(relCeB?.strengthsGivenToPartner?.[0]?.text ?? "quiet steadiness").charAt(0).toLowerCase()}${(relCeB?.strengthsGivenToPartner?.[0]?.text ?? "quiet steadiness").slice(1)}. You fill in each other's blind spots and details without a gap, showing a teamwork that stays firm in the face of any challenge.`,
    ),
    [a, b],
    locale,
  );

  const sharedVulnerability = sanitizeParticles(sharedVulnText, [a, b], locale);
  const balancedProtection = sanitizeParticles(balancedProtText, [a, b], locale);

  return {
    bilateralChanges,
    sharedStrength,
    sharedVulnerability,
    balancedProtection,
  };
}
