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

/**
 * First clause/sentence of a longer EvidenceBackedMeaning.text — used
 * whenever a supporting line needs to reference real per-person evidence
 * without either (a) fully re-quoting a multi-sentence field already
 * quoted in full elsewhere in the same chapter (repetition), or (b) trying
 * to grammatically continue a field that is already a complete, period-
 * terminated sentence (produces a dangling fragment like "...습니다. 쪽으로
 * 흐를 수 있어요.").
 */
function firstClause(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const match = /^[\s\S]*?[.!?다요][)"'』」]*(?=\s|$)/.exec(text);
  return (match ? match[0] : text).trim();
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
    const innerFeel = relCeA.hiddenVulnerability?.text ?? (
      relCeA.stressTempBand === "cold"
        ? L("겉으로 말을 아끼는 것은 서운함을 숨기기 위함이 아니라 스스로 마음을 차분히 묶어두려는 노력입니다.", "Going quiet on the outside is not to hide hurt, but an effort to hold their thoughts together calmly.")
        : relCeA.stressTempBand === "hot"
          ? L("직설적 표현 너머에는 상대로부터 다정한 확답과 관계의 안전함을 빨리 확인받고 싶은 소망이 있습니다.", "Behind the direct words is a wish to quickly receive warm reassurance and safety from their partner.")
          : L("소원함을 느끼더라도 자존심보다 관계의 평화를 우선하여 조용히 감내하려는 마음입니다.", "Even when feeling distant, they quietly endure to prioritize the relationship's peace over pride.")
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
      : (
          relCeA.stressTempBand === "cold"
            ? L(`${topicP(a, locale)} 감정이 정리되지 않은 상태에서 억지로 자리에 매여 마음이 지쳐버릴까 봐 느끼는 우려`, `${topicP(a, locale)} fears getting worn out by being forced to talk before sorting out their thoughts`)
            : relCeA.stressTempBand === "hot"
              ? L(`${topicP(a, locale)} 자신의 솔직한 표현이 상대에게 부담이나 무관심으로 반사될까 봐 느껴지는 불안`, `${topicP(a, locale)} fears their honest expression being returned as a burden or indifference`)
              : L(`${topicP(a, locale)} 자신의 노력이 당연하게 여겨지며 소원해질지 모른다는 은은한 서운함`, `${topicP(a, locale)} quietly fears their effort being taken for granted`)
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
    const innerFeel = relCeB.hiddenVulnerability?.text ?? (
      relCeB.stressTempBand === "cold"
        ? L("겉으로 조용해 보여도 무관심해서가 아니에요 — 서로 상처 주지 않게 할 말을 고르는 중인 거예요.", "The quiet on the outside isn't indifference — they're just choosing their words carefully so neither of you gets hurt.")
        : relCeB.stressTempBand === "hot"
          ? L("직설적 화법 뒤에는 솔직한 공감을 통해 정서적 거리를 좁히고 싶은 소망이 있습니다.", "Behind direct speech is a wish to narrow emotional distance through honest empathy.")
          : L("서운함이 생기더라도 상대를 탓하기 전에 스스로 상황을 먼저 납득해 보려는 마음입니다.", "Even when hurt, they try to understand the situation first before pointing fingers.")
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
      : (
          relCeB.stressTempBand === "cold"
            ? L(`${topicP(b, locale)} 자신의 동굴 시간을 상대가 무관심이나 냉대로 오해할까 봐 느껴지는 부담`, `${topicP(b, locale)} fears their cave time being misread as indifference or coldness`)
            : relCeB.stressTempBand === "hot"
              ? L(`${topicP(b, locale)} 자신의 솔직함이 상대에게 부담이나 다툼의 소지로 남을까 봐 느끼는 불안`, `${topicP(b, locale)} fears their honesty remaining as a burden or source of argument`)
              : L(`${topicP(b, locale)} 자신의 묵묵한 노력이 상대에게 조용히 잊힐까 봐 느끼는 씁쓸함`, `${topicP(b, locale)} quietly fears their steady effort being forgotten`)
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
    // Semantic-leak fix: dropped the fixed closing sentence ("이로써 두
    // 사람은 서로에게 온전한 안식처가 되어줍니다.") — a generic default
    // (spec explicitly bans "안식처") that was identical for every couple
    // regardless of careA/careB. The "why this works" synthesis now lives
    // in `benefit` below, built from the same two variables instead of a
    // disconnected fixed line tacked onto the primary paragraph.
    appearance: sanitizeParticles(
      L(
        `둘만의 편안한 공간에서 ${topicP(a, locale)} ${careA} 한편, ${topicP(b, locale)} ${careB}`,
        `In the comfort of private space, ${topicP(a, locale)} ${careA.charAt(0).toLowerCase()}${careA.slice(1)} Meanwhile, ${topicP(b, locale)} ${careB.charAt(0).toLowerCase()}${careB.slice(1)}`,
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
    // Semantic-leak fix: was a fixed sentence ("정서적 결수와... 안정적
    // 템포가 만나...") — identical for every couple, and "정서적 결수" was
    // also a corrupted/malformed compound (not a real Korean word). Now
    // built directly from careA/careB (same evidence as the primary line
    // above) — genuinely differs per pair because the quoted care style
    // differs, not just the names.
    benefit: sanitizeParticles(
      L(
        `이게 잘 맞는 이유는 단순해요 — ${a}는 ${firstClause(careA)}, ${b}는 ${firstClause(careB)} 방식은 달라도 둘 다 상대를 편하게 해주려는 쪽으로 움직이다 보니 자연스럽게 맞물려요.`,
        `The reason this works is simple — ${a} ${firstClause(careA)?.charAt(0).toLowerCase()}${firstClause(careA)?.slice(1)} and ${b} ${firstClause(careB)?.charAt(0).toLowerCase()}${firstClause(careB)?.slice(1)} Different methods, but both aimed at putting the other at ease, so they naturally mesh.`,
      ),
      [a, b],
      locale,
    ),
    // Semantic-leak fix: was a fixed sentence ("표현 강도 차이로 인해...")
    // regardless of pair. Now sourced from hiddenVulnerability (real,
    // per-person evidence not otherwise used in this chapter) framed as
    // what happens when this specific private-space comfort is leaned on
    // too hard — omitted entirely when that evidence isn't available.
    // Presented as its own sentence (not a mid-sentence continuation) since
    // hiddenVulnerability.text is itself a complete, period-terminated
    // sentence — appending a continuation after it produced a dangling
    // fragment in an earlier version of this fix.
    riskWhenExcess: (relCeA?.hiddenVulnerability?.text || relCeB?.hiddenVulnerability?.text)
      ? sanitizeParticles(
          L(
            `다만 이 편안함에 기대는 게 당연해지면 위험해질 수 있어요. ${relCeA?.hiddenVulnerability?.text ? `${a}는 ${relCeA.hiddenVulnerability.text}` : `${b}는 ${relCeB?.hiddenVulnerability?.text}`}`,
            `But this comfort can turn risky once it's taken for granted. ${relCeA?.hiddenVulnerability?.text ? `${a} ${relCeA.hiddenVulnerability.text.charAt(0).toLowerCase()}${relCeA.hiddenVulnerability.text.slice(1)}` : `${b} ${relCeB?.hiddenVulnerability?.text?.charAt(0).toLowerCase()}${relCeB?.hiddenVulnerability?.text?.slice(1)}`}`,
          ),
          [a, b],
          locale,
        )
      : "",
    observableSignal: sanitizeParticles(
      L(
        `단둘이 만났을 때 ${subjectP(a, locale)} ${relCeA?.careExpression?.text ?? "마음을 편안히 털어놓고"} ${subjectP(b, locale)} ${relCeB?.careExpression?.text ?? "묵묵히 경청하며"} 마음의 온도를 맞추는 순간`,
        `When alone together, ${subjectP(a, locale)} ${(relCeA?.careExpression?.text ?? "opens up comfortably").charAt(0).toLowerCase()}${(relCeA?.careExpression?.text ?? "opens up comfortably").slice(1)} and ${subjectP(b, locale)} ${(relCeB?.careExpression?.text ?? "listens quietly").charAt(0).toLowerCase()}${(relCeB?.careExpression?.text ?? "listens quietly").slice(1)}, matching your emotional warmth`,
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
    // Semantic-leak fix: dropped the fixed closing sentence ("이처럼 두
    // 사람은... 상호 보완적인 역할 분담을 형성합니다.") — "상호보완" is an
    // explicitly banned generic default, identical for every couple. The
    // "why this works" synthesis now lives in `benefit` below.
    appearance: sanitizeParticles(
      L(
        `현실적인 과제나 일정을 조율할 때 ${topicP(a, locale)} ${decA} ${topicP(b, locale)} ${decB}`,
        `When coordinating a real-world task or schedule, ${topicP(a, locale)} ${decA.charAt(0).toLowerCase()}${decA.slice(1)} ${topicP(b, locale)} ${decB.charAt(0).toLowerCase()}${decB.slice(1)}`,
      ),
      [a, b],
      locale,
    ),
    mechanism: sanitizeParticles(
      L(
        `${a}가 ${roP(relCeA?.familiarRelationshipRole?.text ?? "명확한 원칙과 결단력", locale)} 방향을 잡으면, ${b}는 ${roP(relCeB?.familiarRelationshipRole?.text ?? "묵묵한 현실 관리력", locale)} 그 방향을 실제로 굴러가게 만듭니다.`,
        `When ${a} sets the direction as ${(relCeA?.familiarRelationshipRole?.text ?? "clear principle and decisiveness").charAt(0).toLowerCase()}${(relCeA?.familiarRelationshipRole?.text ?? "clear principle and decisiveness").slice(1)}, ${b} is the one who actually makes it work as ${(relCeB?.familiarRelationshipRole?.text ?? "quiet real-world management").charAt(0).toLowerCase()}${(relCeB?.familiarRelationshipRole?.text ?? "quiet real-world management").slice(1)}.`,
      ),
      [a, b],
      locale,
    ),
    // Semantic-leak fix: was a fixed sentence regardless of pair. Now
    // built directly from decA/decB (same evidence as the primary line).
    benefit: sanitizeParticles(
      L(
        `이게 도움이 되는 이유는, ${a}는 ${firstClause(decA)}, ${b}는 ${firstClause(decB)} 두 방식이 겹치니까 결정 앞에서 한쪽으로 쏠리지 않아요.`,
        `This helps because ${a} ${firstClause(decA)?.charAt(0).toLowerCase()}${firstClause(decA)?.slice(1)} and ${b} ${firstClause(decB)?.charAt(0).toLowerCase()}${firstClause(decB)?.slice(1)} With both approaches in play, decisions don't tip too far to one side.`,
      ),
      [a, b],
      locale,
    ),
    // Semantic-leak fix: was a fixed sentence regardless of pair. Now
    // sourced from hiddenVulnerability, presented as its own sentence
    // (see the identical fix and its comment in face.private above).
    riskWhenExcess: (relCeA?.hiddenVulnerability?.text || relCeB?.hiddenVulnerability?.text)
      ? sanitizeParticles(
          L(
            `다만 이 역할 분담이 굳어지면 위험해질 수 있어요. ${relCeB?.hiddenVulnerability?.text ? `${b}는 ${relCeB.hiddenVulnerability.text}` : `${a}는 ${relCeA?.hiddenVulnerability?.text}`}`,
            `But this division of roles can turn risky once it hardens into habit. ${relCeB?.hiddenVulnerability?.text ? `${b} ${relCeB.hiddenVulnerability.text.charAt(0).toLowerCase()}${relCeB.hiddenVulnerability.text.slice(1)}` : `${a} ${relCeA?.hiddenVulnerability?.text?.charAt(0).toLowerCase()}${relCeA?.hiddenVulnerability?.text?.slice(1)}`}`,
          ),
          [a, b],
          locale,
        )
      : "",
    observableSignal: sanitizeParticles(
      L(
        `공동의 계획이나 현실 과제를 다룰 때 ${subjectP(a, locale)} 방향과 기준을 짚고 ${subjectP(b, locale)} 세부 조율을 더하며 맞춰가는 순간`,
        `When managing shared plans or tasks, ${subjectP(a, locale)} sets the direction while ${subjectP(b, locale)} adds the detailed alignment`,
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

  // Shared Vulnerability: Describes the EMERGENT BLIND SPOT created when strengths combine
  // (not a paraphrase of how the fight escalates in Chapter 3).
  const sharedVulnText = ((isFastA && isSlowB) || (isFastB && isSlowA))
    ? L(
        `이 조합의 약점은 여기서 나와요 — 평소엔 ${isFastA ? a : b}의 해결 의지랑 ${isSlowA ? a : b}의 신중함이 잘 맞물리는데, 예민한 얘기 앞에서는 '이번엔 진짜 잘 풀어야 해'라는 부담이 서로 커지면서 오히려 작은 대화도 무겁게 느껴질 수 있어요.`,
        `Here's where this combination gets tricky — normally ${isFastA ? a : b}'s drive to solve things and ${isSlowA ? a : b}'s carefulness work well together, but on a sensitive topic, that same pressure to "get it right this time" can make even a small conversation feel heavy.`,
      )
    : (isSlowA && isSlowB)
      ? L(
          `둘 다 상대를 워낙 배려하고 조심스러워서, 서운한 일이 생겨도 '내가 그냥 넘어가지'하며 참는 쪽을 택하기 쉬워요. 그러다 보면 정작 진짜 마음을 나눌 타이밍을 놓치게 돼요.`,
          `You're both so considerate of each other that when something stings, you tend to just let it go rather than say it. The catch is you can end up missing the moment to actually talk about it.`,
        )
      : (isFastA && isFastB)
        ? L(
            `둘 다 솔직하고 에너지가 넘쳐서 뭐든 빠르게 밀어붙이는 편인데, 그러다 보니 지칠 때도 같이 지치기 쉬워요. 서로 속도를 늦춰줄 사람이 없다 보니 둘 다 한꺼번에 방전될 수 있어요.`,
            `You're both direct and full of energy, so you tend to push things forward fast — but that also means you can burn out together, since neither of you is the one slowing things down.`,
          )
        : L(
            `서로 잘 맞춰주는 편이라 평소엔 부드럽게 넘어가는데, 그러다 보니 중요한 선이나 서운함을 제때 구체적으로 짚고 넘어가지 않는 편이에요. 그게 작은 앙금으로 쌓일 수 있어요.`,
            `You adapt to each other so easily that things usually go smoothly — but that can mean important boundaries or small hurts don't get named in the moment, and they quietly build up.`,
          );

  const slowName = isFastA ? b : a;
  const fastName = isFastA ? a : b;
  const balancedProtText = ((isFastA && isSlowB) || (isSlowA && isFastB))
    ? L(
        `이 기여를 지키는 핵심 합의: ${slowName}님이 "지금은 아니고 이따 얘기하자"처럼 자기 상태를 먼저 말해주고, ${fastName}님이 그 말을 재촉 없이 받아주는 것입니다.`,
        `The key agreement that protects this: ${slowName} says where they're at first — "not right now, let's talk later" — and ${fastName} takes that without pushing.`,
      )
    : (isSlowA && isSlowB)
      ? L(
          `이 기여를 지키는 핵심 합의: 혼자 삭이지 않고, '생각을 정리한 뒤 몇 시에 다시 이야기하자'는 대화 재개의 신호를 확실히 공유하는 것입니다.`,
          `The key agreement that protects this: instead of sitting with it alone, clearly share a signal for reopening the conversation — "let's talk again at ___ once I've sorted my thoughts."`,
        )
      : L(
          `이 기여를 지키는 핵심 합의: 감정이 격해졌을 때는 잠시 대화를 멈추고 각자 10분간 호흡을 가다듬은 뒤 차분하게 다시 마주하는 것입니다.`,
          `The key agreement that protects this: when emotions run high, pause the conversation, each take 10 minutes to catch your breath, and come back calmly.`,
        );

  // Shared Strength: Describes an EMERGENT CAPABILITY (what these two accomplish together that neither does alone).
  // Phase 6 fix: this used to be one fixed sentence skeleton ("A의 X과 B의 Y이
  // 결합하여, 불확실한 순간에도...") with only the two strength phrases
  // swapped in — real data plugged into unchanging structure, still template
  // leakage even though the words varied. The frame itself now changes with
  // the same hot/cold signal already used for sharedVulnText just above, so
  // different mechanisms actually read as different sentences, not the same
  // sentence with different nouns.
  const strengthAText = relCeA?.strengthsGivenToPartner?.[0]?.text ?? relCeA?.careExpression?.text ?? relCeA?.familiarRelationshipRole?.text ?? L("다정한 활력", "warm vitality");
  const strengthBText = relCeB?.strengthsGivenToPartner?.[0]?.text ?? relCeB?.careExpression?.text ?? relCeB?.familiarRelationshipRole?.text ?? L("흔들림 없는 신중함", "steady prudence");

  const sharedStrength = sanitizeParticles(
    ((isFastA && isSlowB) || (isFastB && isSlowA))
      ? L(
          `이 조합은 부딪힌 뒤에도 관계 자체를 쉽게 놓지 않는 힘이 있어요. ${a}의 ${strengthAText}이 상황을 앞장서 정리하고, ${b}의 ${strengthBText}이 그 뒤를 흔들림 없이 받쳐줘요.`,
          `What this combination gives you is the strength to not give up on the relationship even after a clash. ${a}'s ${strengthAText} pushes to sort things out, and ${b}'s ${strengthBText} steadies things right behind them.`,
        )
      : (isSlowA && isSlowB)
        ? L(
            `복잡한 일이 생겼을 때 감정과 현실을 같이 짚어낼 수 있는 조합이에요. ${a}의 ${strengthAText}과 ${b}의 ${strengthBText}이 서로를 침착하게 받쳐줘요.`,
            `When things get complicated, this is a pairing that can hold both the feelings and the practical side at once — ${a}'s ${strengthAText} and ${b}'s ${strengthBText} steady each other.`,
          )
        : (isFastA && isFastB)
          ? L(
              `같은 목표를 잡으면 생각보다 훨씬 빨리 움직이는 커플이에요. ${a}의 ${strengthAText}과 ${b}의 ${strengthBText}이 만나면 속도가 붙어요.`,
              `Once you two agree on a goal, you move faster than you'd expect — ${a}'s ${strengthAText} meeting ${b}'s ${strengthBText} picks up real speed.`,
            )
          : L(
              `서로 다른 강점이 자연스럽게 맞물려요. ${a}의 ${strengthAText}이 놓치는 부분을 ${b}의 ${strengthBText}이 채워줘요.`,
              `Your different strengths interlock naturally — where ${a}'s ${strengthAText} misses something, ${b}'s ${strengthBText} tends to catch it.`,
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
