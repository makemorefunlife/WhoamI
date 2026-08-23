import type { FamilyRuleContext } from "./buildFamilyRuleContext";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick } from "./familyParentCopy";
import {
  josaIGa,
  josaEunNeun,
  josaEulReul,
  josaGwaWa,
} from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";

export type FamilyOverviewCardNarrative = {
  key: "bond" | "synergy" | "risk";
  topic: "intimacy" | "stability" | "conflict";
  gradeLabel: string;
  oneLiner: string;
  measures: string;
  shortWhy: string;
  why: string; // Detailed interaction mechanism for Chapter 01
  scene: string;
  strength: string;
  caution: string;
  axisNote?: string | null;
};

/**
 * Family Overview 3-Card & Chapter 01 Evidence Narrative Engine
 *
 * Provides:
 * 1. Short scannable 2-sentence summaries for the Top 3 Overview Cards (matching Romantic standard)
 * 2. Detailed interaction mechanisms & observable moments for Chapter 01 ("우리가 함께 있을 때의 모습")
 */
export function buildFamilyOverviewCardNarratives(
  ctx: FamilyRuleContext,
  personCorePsych?: {
    psychA?: PsychMasterJson | null;
    psychB?: PsychMasterJson | null;
  },
): Record<"bond" | "synergy" | "risk", FamilyOverviewCardNarrative> {
  const locale = ctx.locale;
  const parentName = ctx.parentNickname;
  const childName = ctx.childNickname;
  const roleLabel = pick(locale, ctx.parentRole === "mother" ? "Mom" : "Dad", ctx.parentRole === "mother" ? "엄마" : "아빠");
  const { masterScores } = ctx;

  const psychA = personCorePsych?.psychA ?? null;
  const psychB = personCorePsych?.psychB ?? null;

  // Proper Korean particle (josa) helpers for names
  const cIGa = josaIGa(childName);
  const cEunNeun = josaEunNeun(childName);
  const cEulReul = josaEulReul(childName);
  const pIGa = josaIGa(parentName);
  const pEunNeun = josaEunNeun(parentName);
  const pGwaWa = josaGwaWa(parentName);
  const cGwaWa = josaGwaWa(childName);

  // Parent & Child Ten-God Evidence (Dominant energy signals)
  const parentResource = ctx.tenGod.countsParent.resource > 0;
  const parentOfficer = ctx.tenGod.countsParent.officer > 0;
  const parentCompanion = ctx.tenGod.countsParent.companion > 0;
  const parentOutput = ctx.tenGod.countsParent.output > 0;
  const parentWealth = ctx.tenGod.countsParent.wealth > 0;

  const childResource = ctx.tenGod.countsChild.resource > 0;
  const childOfficer = ctx.tenGod.countsChild.officer > 0;
  const childCompanion = ctx.tenGod.countsChild.companion > 0;
  const childOutput = ctx.tenGod.countsChild.output > 0;
  const childWealth = ctx.tenGod.countsChild.wealth > 0;

  // Pair Saju Signals
  const dayStemInteraction = ctx.familyPairAnalysis?.dayStemInteraction ?? (typeof ctx.pairAnalysis?.dayStemInteraction === "string" ? ctx.pairAnalysis.dayStemInteraction : "");
  const isHarmonious = typeof dayStemInteraction === "string" ? (dayStemInteraction.includes("상생") || dayStemInteraction.includes("합")) : false;

  // Psych 11-Axis Signals (if available)
  const empathyA = psychA?.secondary_axes.empathy ?? 50;
  const empathyB = psychB?.secondary_axes.empathy ?? 50;
  const conflictGap = Math.abs((psychA?.secondary_axes.conflict_style ?? 50) - (psychB?.secondary_axes.conflict_style ?? 50));

  // =========================================================================
  // CARD 1: 🔥 정서적 유대 (Emotional Bond)
  // Lens: "마음을 나누고 위로가 필요할 때"
  // Opening Rhythm: Direct daily scene moment
  // =========================================================================
  const bondScore = masterScores.bond;
  const bondGradeLabel =
    bondScore >= 70
      ? pick(locale, "Warm & Resilient Connection", "따뜻하고 단단한 정서적 교감")
      : bondScore >= 50
        ? pick(locale, "Loving Bond with Timing Gaps", "서로 아끼지만 조율이 필요한 온도")
        : pick(locale, "Bond Needing Expressive Attunement", "표현 방식의 차이로 노력이 필요한 유대");

  const bondOneLiner = pick(locale, "When sharing feelings and seeking comfort", "마음을 나누고 위로가 필요할 때");
  const bondMeasures = pick(
    locale,
    `How deeply ${roleLabel} and Child connect emotionally when comfort or acceptance is needed`,
    `두 사람이 부모와 자녀로서 정서적으로 얼마나 깊이 연결되어 있는지`,
  );

  let bondScene = "";
  if (childResource || empathyB >= 60) {
    bondScene = pick(
      locale,
      `When ${childName} returns home upset after a stressful day outside and seeks reassurance`,
      `${cIGa} 밖에서 억울하거나 힘든 일을 겪고 집으로 들어와 마음을 털어놓으려 할 때`,
    );
  } else if (childCompanion || childOfficer) {
    bondScene = pick(
      locale,
      `When ${childName} quietly retreats to their room to process feelings internally before speaking`,
      `${cIGa} 말없이 자기 방으로 들어가 혼자 감정을 먼저 정리하려 할 때`,
    );
  } else {
    bondScene = pick(
      locale,
      `When ${childName} subtly signals a need for advice or quiet presence from ${parentName}`,
      `${cIGa} 고민이나 마음속 진심을 ${roleLabel}(${parentName})에게 슬쩍 내비치는 순간`,
    );
  }

  // Short 2-sentence concise summary for Overview Card (Zero score numbers, warm advice tone)
  let bondShortWhy = "";
  if (bondScore >= 70) {
    bondShortWhy = pick(
      locale,
      `${parentName}'s warm resonance and ${childName}'s reception align naturally. Deep emotional safety flows effortlessly between you two.`,
      `${pGwaWa} ${cIGa} 단둘이 마음을 나눌 때 깊은 안도감을 주는 관계예요. 따뜻한 공감과 정서적 수용 반응이 맞아떨어져 큰 설명 없이도 마음이 통합니다.`,
    );
  } else if (bondScore >= 50) {
    bondShortWhy = pick(
      locale,
      `Deep mutual affection exists, but pacing and expression timing differ slightly. Active listening deepens your connection comfortably.`,
      `서로를 아끼는 마음은 깊으나 다가가는 타이밍과 소통 속도에 약간의 차이가 있어요. 들어주는 시간과 따뜻한 기다림이 더해질 때 마음이 온전히 가닿습니다.`,
    );
  } else {
    bondShortWhy = pick(
      locale,
      `${parentName} offers practical solutions while ${childName} seeks emotional empathy. Replacing advice with listening opens heart doors.`,
      `${pEunNeun} 실질적인 해결책으로 마음을 전하려 하고 ${cEunNeun} 감정적 공감을 먼저 원해 소통 언어의 차이가 생겨요. 대안 제시보다 감정을 인정해 줄 때 다리가 놓입니다.`,
    );
  }

  // Full detailed interaction mechanism for Chapter 01 (Warm empathetic advice tone)
  let bondWhy = "";
  if (bondScore >= 70) {
    if (isHarmonious || parentResource) {
      bondWhy = pick(
        locale,
        `When ${childName} experiences emotional stress, they feel safe approaching ${parentName} without hesitation. ${parentName}'s supportive reception and ${childName}'s openness align naturally, creating an effortless reservoir of mutual trust where feelings flow freely.`,
        `${cIGa} 밖에서 억울하거나 힘든 일을 겪고 돌아온 날, 망설임 없이 ${pGwaWa} 마음을 털어놓는 모습을 보입니다. ${pEunNeun} 아이의 이야기를 따뜻하게 들어주고 ${cEunNeun} 그 품 안에서 깊은 안도감을 얻어요. 소통 템포가 자연스럽게 맞아떨어져 “이 사람은 언제나 내 편”이라는 단단한 신뢰가 일상에 흐릅니다.`,
      );
    } else {
      bondWhy = pick(
        locale,
        `Both ${parentName} and ${childName} maintain a comfortable balance of care and personal space. Emotional support is delivered with steady respect without overwhelming intrusion, allowing closeness to flourish naturally.`,
        `${pGwaWa} 자녀(${childName}) 모두 정서적 교감과 개인 공간을 균형 있게 존중하는 지혜로운 관계예요. 지나친 개입 없이도 필요할 때 든든한 버팀목이 되어 주어, 서로에게 침범받지 않으면서도 온기를 나누는 편안한 유대가 유지됩니다.`,
      );
    }
  } else if (bondScore >= 50) {
    if (childCompanion || childOfficer) {
      bondWhy = pick(
        locale,
        `When ${childName} returns home with heavy feelings, they need time to process internally before opening up. Meanwhile, ${parentName} naturally reaches out to check in right away. While mutual affection is deep, this timing gap means closeness feels close in heart but needs gentle pacing in daily rhythm.`,
        `${cIGa} 힘든 일을 겪고 돌아오면 바로 털어놓기보다 혼자 마음을 정리할 시간이 먼저 필요해요. 반면 ${pEunNeun} 괜찮은지 빨리 확인하고 싶어 가까이 다가가는 편이에요. 마음의 크기보다 다가가는 타이밍이 달라, 서로 아끼면서도 순간적으로는 “왜 내 마음을 몰라주지?”라는 조급함이 생길 수 있어요. 성급히 질문을 건네기보다 따뜻하게 기다려주는 한 박자의 쉼표가 들어갈 때 비로소 마음이 온전히 통합니다.`,
      );
    } else {
      bondWhy = pick(
        locale,
        `When ${childName} signals a need for comfort, ${parentName} tends to offer practical solutions, whereas ${childName} craves empathetic listening first. Deep love exists on both sides, but prioritizing active listening over immediate advice is the key to unlocking emotional resonance.`,
        `${cIGa} 고민이나 힘든 감정을 내비칠 때, ${pEunNeun} 실질적인 해결책을 제시하여 마음을 보살피려 하고 아이는 조용히 들어주는 공감을 먼저 바라는 모습이 나타나요. 부모의 조언은 애정에서 비롯되었지만 아이에게는 “내 감정보다 답이 중요하구나”로 오해될 때가 있습니다. 해결에 앞서 아이의 마음을 있는 그대로 인정해 줄 때 정서적 유대가 빠르게 깊어집니다.`,
      );
    }
  } else {
    bondWhy = pick(
      locale,
      `When ${childName} seeks acceptance, ${parentName}'s direct advice can inadvertently feel like emotional pressure. Overcoming this misread intention requires replacing rapid problem-solving with calm, non-judgmental reception.`,
      `${cIGa} 마음을 털어놓으려 할 때 ${pGwaWa}의 조언이나 지적이 정서적 부담으로 작용하곤 합니다. 관심과 위로의 의도와 달리 전달되는 순간에 오해가 생겨 아이가 “말해봤자 지적만 받는다”며 방어적으로 입을 닫는 흐름이 반복되기 쉬워요. 성급한 대안 제시 대신 판단 없이 들어주는 공감의 첫마디를 건넬 때 비로소 굳은 다리가 풀어집니다.`,
    );
  }

  const intimacyNote = empathyA >= 60 && empathyB >= 60
    ? pick(locale, "Both share high empathy, deepening emotional trust beyond baseline traits.", "두 사람 모두 정서적 공감력이 높아, 마음의 문을 열면 유대가 더욱 깊어지는 관계입니다.")
    : undefined;

  // =========================================================================
  // CARD 2: 🧩 성장 시너지 (Growth Synergy)
  // Lens: "배우고 도전하고 자기 길을 찾을 때"
  // Opening Rhythm: Relationship mechanism / principle opening
  // =========================================================================
  const synergyScore = masterScores.synergy;
  const synergyGradeLabel =
    synergyScore >= 75
      ? pick(locale, "Exceptional Growth Synergy", "강점이 맞물리는 탁월한 성장 시너지")
      : synergyScore >= 55
        ? pick(locale, "Steady Complementary Synergy", "서로의 속도를 존중하는 안정적 시너지")
        : pick(locale, "Synergy Needing Guidance Pace Adjustments", "가이드 방식의 조율이 필요한 단계");

  const synergyOneLiner = pick(locale, "When learning, trying new things, and finding their path", "배우고 도전하고 자기 길을 찾을 때");
  const synergyMeasures = pick(
    locale,
    `How effectively parent's guidance supports child's learning, trial, and growth`,
    `부모의 가이드 방식이 자녀의 성장을 얼마나 잘 뒷받침하는지`,
  );

  let synergyScene = "";
  if (childCompanion || childOutput) {
    synergyScene = pick(
      locale,
      `When ${childName} announces a desire to pursue a new interest or independent project`,
      `${cIGa} 새로운 과제나 활동에 스스로 도전하겠다고 선언할 때`,
    );
  } else if (parentOfficer || parentWealth) {
    synergyScene = pick(
      locale,
      `When ${childName} seeks advice from ${parentName} regarding academic or career directions`,
      `${cIGa} 진로나 성적, 선택을 두고 앞으로의 방향을 고민할 때`,
    );
  } else {
    synergyScene = pick(
      locale,
      `When ${childName} faces a setback or lower-than-expected result and needs to rebuild momentum`,
      `${cIGa} 시험이나 경쟁에서 예상보다 아쉬운 결과를 마주했을 때`,
    );
  }

  // Short 2-sentence concise summary for Overview Card
  let synergyShortWhy = "";
  if (synergyScore >= 75) {
    synergyShortWhy = pick(
      locale,
      `${parentName}'s structural guidance and ${childName}'s trial autonomy complement each other like puzzle pieces, sparking high potential.`,
      `부모(${parentName})의 든든한 방향 잡기와 자녀(${childName})의 자율적 시도가 퍼즐처럼 맞아떨어져요. 서로의 강점이 만날 때 잠재력을 폭발적으로 끌어올리는 시너지가 발휘됩니다.`,
    );
  } else if (synergyScore >= 55) {
    synergyShortWhy = pick(
      locale,
      `${parentName}'s advice offers a reliable safety rail, while growth unfolds steadily as each other's pace is respected.`,
      `상대를 억지로 이끌기보다는 ${pGwaWa} ${cGwaWa} 각자의 속도와 방식을 존중할 때 안정감을 주는 조합이에요. 조용한 파트너십으로 꾸준한 시너지를 이끌어냅니다.`,
    );
  } else {
    synergyShortWhy = pick(
      locale,
      `${parentName}'s eagerness to guide requires patience for ${childName}'s trial-and-error process. Synergy builds as boundaries clarify.`,
      `부모(${parentName})의 조언 의도와 자녀(${childName})의 자율 탐색 욕구 사이에 호흡 차이가 있어요. 시행착오를 수용해 주는 한 박자 쉬어가는 가이드가 성장의 밑거름이 됩니다.`,
    );
  }

  // Full detailed interaction mechanism for Chapter 01 (Varying rhythm & natural prose)
  let synergyWhy = "";
  if (synergyScore >= 75) {
    if (parentOfficer || parentResource) {
      synergyWhy = pick(
        locale,
        `Growth flourishes when ${parentName} sets clear boundaries while granting ${childName} full autonomy in execution. Supported by parent's structural safety, ${childName} explores without fear of failure, turning guidance into bold momentum.`,
        `이 관계의 강점은 ${pEunNeun} 방향의 든든한 기준을 잡아주고, ${cEunNeun} 자기 방식으로 시도할 자율 공간을 확보할 때 가장 빛이 납니다. ${cIGa} 새로운 과제나 진로에 도전할 때 ${pEunNeun} 세부 실행을 믿고 맡겨주어요. 아이는 실패 부담 없이 잠재력을 마음껏 발휘하고, 부모의 조용한 지지는 성장의 강력한 엔진이 됩니다. “방향은 부모가 가이드하고 방법은 아이가 선택할 때” 최고의 성장이 촉진됩니다.`,
      );
    } else {
      synergyWhy = pick(
        locale,
        `${parentName}'s encouraging style and ${childName}'s curiosity build a positive feedback loop. Parent's inspiration sparks trial, and child's progress gives parent deep fulfillment.`,
        `${pGwaWa} ${cEunNeun} 격려와 자율적 호기심이 만나 긍정적인 순환을 만들어가요. ${pEunNeun} 영감을 주는 자극으로 도전에 불을 지피고, ${cIGa} 성취를 통해 성장하며 부모에게 기쁨과 신뢰를 답합니다. 서로 잘하는 부분이 퍼즐처럼 맞아떨어지는 탁월한 성장 결합이에요.`,
      );
    }
  } else if (synergyScore >= 55) {
    if (childCompanion || childOutput) {
      synergyWhy = pick(
        locale,
        `A gentle pace gap exists between ${parentName}'s structured advice and ${childName}'s desire for independent trial. While parent's experience offers a vital safety rail, allowing ${childName} space to learn through personal trial maximizes steady progress.`,
        `${pEunNeun}가 제시하는 체계적인 가이드와 ${cEunNeun}가 원하는 자율적 탐색 사이에 소폭의 호흡 차이가 존재해요. ${pEunNeun} 안전펜스 역할을 든든히 해주지만, ${cIGa} 스스로 시행착오를 겪고 깨달을 수 있는 탐색 시간을 허용할 때 협력 가치가 제대로 발휘돼요. 조급하게 정답을 내려주기보다 아이의 시도 과정을 지켜봐 줄 때 단단한 시너지가 이어집니다.`,
      );
    } else {
      synergyWhy = pick(
        locale,
        `${parentName} and ${childName} share a quiet, low-friction growth rhythm. While progress unfolds steadily rather than explosively, mutual respect ensures reliable momentum.`,
        `${pGwaWa} 자녀(${childName})는 서로의 영역을 침범하지 않고 차근차근 성장을 이어가는 조용한 파트너십을 보여주어요. 단기 성과보다는 꾸준한 습관 형성을 통해 잔잔하지만 단단한 성장 흐름을 만들어갑니다.`,
      );
    }
  } else {
    synergyWhy = pick(
      locale,
      `${parentName}'s eagerness to help can manifest as premature solutions, which ${childName} may interpret as control. Synergy strengthens as parent shifts from directing to supporting independent choices.`,
      `성장을 바라는 마음은 같으나 가이드 방식에서 템포 마찰이 생기기 쉬운 조합이에요. ${pEunNeun} 시행착오를 줄여주려 미리 답을 주려 하지만, ${cEunNeun} 이를 “내 능력을 안 믿어주나?”라는 간섭으로 받아들여 방어적인 태도를 취하곤 합니다. 결과보다는 아이의 주도적 시도 자체를 정서적으로 인정해 줄 때 비로소 시너지가 활짝 피어납니다.`,
    );
  }

  const stabilityNote = psychA?.secondary_axes.stimulation && psychB?.secondary_axes.stimulation && (psychA.secondary_axes.stimulation >= 60 && psychB.secondary_axes.stimulation >= 60)
    ? pick(locale, "Both share high growth stimulation, expanding the synergy range.", "둘 다 새로운 자극과 성장을 즐기는 편이라 시너지의 폭이 큽니다.")
    : undefined;

  // =========================================================================
  // CARD 3: ⚡ 훈육 마찰 (Discipline Friction Risk)
  // Lens: "기준을 세우거나 잘못을 바로잡을 때"
  // Opening Rhythm: Trigger sequence opening
  // =========================================================================
  const riskScore = masterScores.risk;
  const riskGradeLabel =
    riskScore >= 65
      ? pick(locale, "High Friction Risk in Discipline", "훈육 시 감정 대립 주의 필요")
      : riskScore >= 45
        ? pick(locale, "Moderate Discipline Tension", "지적 방식의 섬세한 조율 필요")
        : pick(locale, "Low Friction & Safe Cushion", "감정 싸움으로 안 번지는 안전한 쿠션");

  const riskOneLiner = pick(locale, "When setting boundaries or correcting mistakes", "기준을 세우거나 잘못을 바로잡을 때");
  const riskMeasures = pick(
    locale,
    `Likelihood of emotional friction when setting rules or correcting behavior`,
    `생활 규칙이나 잘못을 지적하고 바로잡을 때 감정 마찰이 생길 가능성`,
  );

  let riskScene = "";
  if (childOfficer || childCompanion) {
    riskScene = pick(
      locale,
      `When ${parentName} corrects an unfulfilled commitment (curfew, screen time, chores) and ${childName} shuts down defensively`,
      `${pEunNeun} 약속된 생활 규칙(귀가시간·스마트폰·집안일) 미준수를 지적할 때, ${cIGa} 입을 닫고 방어적으로 돌아서는 순간`,
    );
  } else if (childOutput) {
    riskScene = pick(
      locale,
      `When ${parentName} demands an immediate answer and ${childName} responds back with emotional arguments`,
      `${pEunNeun} 즉각적인 설명이나 행동 수정을 요구할 때, ${cIGa} 곧바로 말을 되받아치는 상황`,
    );
  } else {
    riskScene = pick(
      locale,
      `When a minor disagreement over daily routines escalates into quiet silent treatment`,
      `일상적인 생활 방식 차이로 지적이 나오면서 ${pGwaWa} ${cGwaWa} 사이 분위기가 서먹하게 얼어붙을 때`,
    );
  }

  // Short 2-sentence concise summary for Overview Card
  let riskShortWhy = "";
  if (riskScore >= 65) {
    riskShortWhy = pick(
      locale,
      `Direct corrections prompt ${childName} to build a defensive wall, while ${parentName}'s urge for answers escalates friction. Clear boundaries and cooling off manage risk.`,
      `직설적인 지적에 ${cIGa} 자존심이 상해 입을 닫고, ${pEunNeun} 응답을 재촉하면서 감정 대립이 커지기 쉬워요. 한 박자 쉬어가는 쿨다운이 감정 마찰을 막아주는 열쇠입니다.`,
    );
  } else if (riskScore >= 45) {
    riskShortWhy = pick(
      locale,
      `Pacing gaps exist when discipline arises, requiring a brief buffer instead of sharp tone. Cool-down time keeps communication healthy.`,
      `훈육 상황에서 ${pEunNeun}의 지적 템포와 ${cEunNeun}의 수용 템포에 약간의 시차가 있어요. 감정 톤을 가라앉힌 뒤 사안에만 집중하면 무리 없이 조율됩니다.`,
    );
  } else {
    riskShortWhy = pick(
      locale,
      `Disagreements focus on behaviors rather than personal dignity. A solid emotional cushion prevents minor friction from escalating.`,
      `의견 충돌이 생겨도 ${pGwaWa} ${cEunNeun} 자존심을 건드리지 않고 사안에만 집중하는 편이에요. 감정 싸움으로 번지지 않고 조율하는 완충 쿠션이 작용합니다.`,
    );
  }

  // Full detailed interaction mechanism for Chapter 01 (Varying rhythm & natural prose)
  let riskWhy = "";
  if (riskScore >= 65) {
    if (childCompanion || childOfficer || parentOfficer) {
      riskWhy = pick(
        locale,
        `When discipline issues arise, ${parentName}'s immediate demand for answers triggers ${childName}'s defensive withdrawal. As parent interprets silence as reluctance and raises voice tone, an escalation loop develops rapidly. The key is separating the issue from ego and establishing a cool-down buffer before demanding responses.`,
        `생활 규칙이나 약속 미준수를 두고 지적이 나오는 순간, ${pEunNeun}의 즉각적인 확인 요구와 ${cEunNeun}의 방어적 반응이 빠르게 부딪혀요. 부모가 잘못을 정면으로 언급하면 ${cIGa} 자존심이 상해 입을 닫고, ${pEunNeun} 그 침묵을 “내 말을 무시하나?”라 느껴 톤이 높아지는 악순환이 생기기 십상입니다. 지적의 내용보다 답을 요구하는 속도와 아이가 감정적으로 닫히는 속도가 부딪히는 지점을 정돈하는 것이 핵심입니다.`,
      );
    } else {
      riskWhy = pick(
        locale,
        `Under discipline stress, ${parentName}'s urgent tone prompts immediate emotional pushback from ${childName}. Without a structured pause, minor behavioral corrections escalate into heated arguments.`,
        `훈육 시 ${pEunNeun}의 감정 톤이 높아지면 ${cIGa} 반응적으로 대립하는 양상이 나타나요. 이 과정에서 본래 규칙보다 “말투가 왜 그래?”라는 감정이 먼저 부딪혀 대화가 차단되기 쉽습니다. 지적을 전달할 때 감정과 사안을 엄격히 분리하고 쿨다운 시간을 두는 지혜가 필요한 지점입니다.`,
      );
    }
  } else if (riskScore >= 45) {
    if (conflictGap >= 30) {
      riskWhy = pick(
        locale,
        `Discipline scenarios trigger a pacing gap: ${parentName} seeks rapid resolution while ${childName} needs time to absorb feedback. Allowing a brief pause prevents minor friction from becoming tension.`,
        `훈육 상황이 생기면 지적이 전달되는 속도와 ${cEunNeun}가 이를 받아들이는 수용 속도 사이에 약간의 시차가 발생해요. ${pEunNeun}가 규칙 미준수를 언급했을 때 ${cIGa} 즉각 반응하기보다 생각할 시간이 필요합니다. 감정이 과열되기 전 한 박자 쉬었다가 사안에만 집중해 대화하면 큰 대립 없이 원만하게 조율되는 관계예요.`,
      );
    } else {
      riskWhy = pick(
        locale,
        `Discipline creates occasional tension, but neither holds lasting grudges. Maintaining a calm, objective tone keeps boundary enforcement constructive and smooth.`,
        `훈육 과정에서 ${pGwaWa} ${cEunNeun} 입장이 부딪히지만 감정 대립이 오래가지 않는 안정적인 수준이에요. 규칙 지적 시 자존심을 건드리지 않는 정돈된 톤을 유지하면 일상 속 문제들이 자연스럽게 수용됩니다.`,
      );
    }
  } else {
    riskWhy = pick(
      locale,
      `When correcting ${childName}, ${parentName} focuses strictly on the behavior without attacking dignity, and ${childName} receives guidance without feeling hostile. A healthy buffer protects the bond from escalating friction.`,
      `의견 충돌이나 지적이 오가더라도 감정 싸움으로 번지지 않는 안전한 완충 구역이 존재해요. ${pEunNeun}는 자녀(${childName})의 자존심을 건드리지 않고 사안 자체만 정돈해 지적하며, ${cEunNeun} 역시 부모의 안내를 공격으로 오해하지 않습니다. 서로를 존중하는 정돈된 톤이 유지되어 일상 속 규칙들이 원만하고 평화롭게 조율됩니다.`,
    );
  }

  const conflictNote = conflictGap >= 30
    ? pick(locale, "Clashing conflict styles may amplify friction if tempers flare.", "갈등 대처 방식의 차이가 있어, 훈육 시 템포 조율이 중요합니다.")
    : undefined;

  // Strength & Caution for Card 1 (Bond)
  const bondStrength = bondScore >= 70
    ? pick(locale, "Deep trust and warm empathy form a resilient sanctuary in difficult moments.", "서로를 향한 따뜻한 공감과 신뢰가 단단하여, 힘든 순간에 언제든 든든한 안식처가 되어주는 관계")
    : bondScore >= 50
      ? pick(locale, "Deep foundational love allows connection to deepen rapidly once pacing is attuned.", "마음속 깊은 애정이 바탕이 되어, 소통 템포를 조금만 조율해도 빠르게 마음이 통하는 유대")
      : pick(locale, "Sincere care exists beneath differences, ready to flourish with attentive listening.", "서로에게 관심을 기울이려는 본심이 살아있어, 들어주는 습관만으로도 금방 오해가 풀어지는 관계");

  const bondCaution = bondScore >= 70
    ? pick(locale, "Deep emotional attunement may lead to over-identifying with each other's moods.", "유대가 깊은 만큼 상대의 미세한 감정 변화에 예민해지기 쉬우므로 과도한 감정 전이 주의")
    : bondScore >= 50
      ? pick(locale, "Differences in emotional processing speed can create temporary miscommunication.", "감정을 다스리는 속도 차이로 인해 한 사람은 답답하고 다른 사람은 부담스러울 수 있음")
      : pick(locale, "Offering premature advice can cause defensive withdrawal; focus on calm reception.", "조급하게 대안이나 지적을 꺼내면 아이가 마음을 닫을 수 있으므로 성급한 판단 주의");

  // Strength & Caution for Card 2 (Synergy)
  const synergyStrength = synergyScore >= 75
    ? pick(locale, "Parental safety and child autonomy complement seamlessly to boost potential.", "부모의 든든한 울타리와 아이의 자율적 시도가 맞물려 자녀의 잠재력을 폭발적으로 끌어올리는 시너지")
    : synergyScore >= 55
      ? pick(locale, "Respecting each other's pace establishes a steady and reliable growth partnership.", "각자의 방식을 존중하며 잔잔하지만 꾸준하게 성장을 돕는 안정적인 파트너십")
      : pick(locale, "Shared growth intention creates new momentum when trial autonomy is granted.", "성장을 바라는 마음은 같으므로 실행 방식에서 자율도를 부여할 때 새로운 동력이 생김");

  const synergyCaution = synergyScore >= 75
    ? pick(locale, "Ensure high growth expectations do not turn into pressure; celebrate the process.", "부모의 높은 기대감이 과도한 성과 압박으로 작용하지 않도록 과정 자체를 칭찬할 것")
    : synergyScore >= 55
      ? pick(locale, "Guidance pace preceding trial pace can create minor friction; allow discovery time.", "부모의 가이드 템포가 아이의 시행착오 속도보다 빠르면 작은 마찰이 생길 수 있음")
      : pick(locale, "Avoid dictating answers upfront; grant sufficient space for independent discovery.", "미리 답을 주고 이끌려 하기보다 자녀 스스로 선택하고 경험할 탐색 시간을 충분히 줄 것");

  // Strength & Caution for Card 3 (Risk)
  const riskStrength = riskScore >= 65
    ? pick(locale, "Strong willingness to address issues ensures quick resolution once rules are clear.", "문제 상황을 피하지 않고 직접 다루려는 의지가 강하여, 규칙이 명확해지면 빠르게 정돈됨")
    : riskScore >= 45
      ? pick(locale, "Tension does not linger long; cool-down time restores rational communication.", "훈육 상황에서도 감정 대립이 오래가지 않고, 한 박자 쉬어가면 이성적으로 해결됨")
      : pick(locale, "Personality is separated from issues, creating a safe cushion against arguments.", "사안과 인격을 엄격히 분리하여, 지적이 오가더라도 감정 싸움으로 번지지 않는 안전한 완충 쿠션");

  const riskCaution = riskScore >= 65
    ? pick(locale, "Direct correction and immediate demands can trigger defensive withdrawal and escalation.", "직설적인 지적과 즉각적인 확인 요구가 아이의 방어적 침묵을 자극해 감정 대립이 격화될 위험")
    : riskScore >= 45
      ? pick(locale, "Delivery speed and absorption speed differ; allow cool-down before resolution.", "지적 전달 속도와 수용 속도의 시차가 있으므로 감정이 가라앉을 때까지 쿨다운 타임 필요")
      : pick(locale, "While the buffer is strong, ensure essential boundaries are clearly enforced when needed.", "완충 구역이 단단한 대신 명확한 경계선 설정이 필요한 순간에는 확실히 짚고 넘어갈 것");

  return {
    bond: {
      key: "bond",
      topic: "intimacy",
      gradeLabel: bondGradeLabel,
      oneLiner: bondOneLiner,
      measures: bondMeasures,
      shortWhy: bondShortWhy,
      why: bondWhy,
      scene: bondScene,
      strength: bondStrength,
      caution: bondCaution,
      axisNote: intimacyNote,
    },
    synergy: {
      key: "synergy",
      topic: "stability",
      gradeLabel: synergyGradeLabel,
      oneLiner: synergyOneLiner,
      measures: synergyMeasures,
      shortWhy: synergyShortWhy,
      why: synergyWhy,
      scene: synergyScene,
      strength: synergyStrength,
      caution: synergyCaution,
      axisNote: stabilityNote,
    },
    risk: {
      key: "risk",
      topic: "conflict",
      gradeLabel: riskGradeLabel,
      oneLiner: riskOneLiner,
      measures: riskMeasures,
      shortWhy: riskShortWhy,
      why: riskWhy,
      scene: riskScene,
      strength: riskStrength,
      caution: riskCaution,
      axisNote: conflictNote,
    },
  };
}
