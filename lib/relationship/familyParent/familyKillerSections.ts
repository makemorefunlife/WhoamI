import { calculateSaju } from "@fullstackfamily/manseryeok";
import type { FamilyMasterScores } from "./familyEventScores";
import type { FamilyParentTenGodAnalysis } from "./familyParentTenGodAnalysis";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import { pick } from "./familyParentCopy";
import type { FamilyParentRole } from "./types";
import type { FamilyPairSajuAnalysis } from "@/lib/saju/familyAnalysis";
import { getBranch, toBranchCode } from "@/lib/saju/mapping";
import { REF_RELATION_RULES } from "@/lib/hardcoded/sajuReferenceData";
import type { Locale } from "@/lib/i18n/locale";
import {
  buildChildDeEscalationCard,
  type ChildDeEscalationCard,
} from "./childDeEscalationPrescriptions";

type RelationRuleRow = {
  relation_type: string;
  code_a: string;
  code_b: string;
};

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function hasBranchRelation(
  type: "branch_clash" | "branch_punishment",
  a: string,
  b: string,
): boolean {
  const key = pairKey(a, b);
  return (REF_RELATION_RULES as unknown as RelationRuleRow[]).some(
    (r) =>
      r.relation_type === type && pairKey(r.code_a, r.code_b) === key,
  );
}

function getCalendarYearBranch(calendarYear: number): string {
  const saju = calculateSaju(calendarYear, 6, 15, 12, 0) as {
    yearPillar: string;
  };
  return toBranchCode(getBranch(saju.yearPillar));
}

const GENIUS_TITLES: Record<Locale, Record<string, string>> = {
  "en-US": {
    wood: "🌿 Free-Spirited Explorer Genius",
    fire: "🔥 Idea-Sparking Genius",
    earth: "🧸 Steady Comfort Genius",
    metal: "💎 Clear-Standards Genius",
    water: "🌊 Deeply Empathetic Genius",
  },
  "ko-KR": {
    wood: "🌿 자유로운 탐험가형 천재",
    fire: "🔥 아이디어 폭발형 천재",
    earth: "🧸 든든한 안정감 천재",
    metal: "💎 명확한 기준형 천재",
    water: "🌊 깊은 공감형 천재",
  },
};

export type ChildDnaSection = {
  genius_title: string;
  communication_style: string;
  hidden_sensitivity: string;
  attention_focus_style: string;
  hidden_genius: string;
};

export type DestinyScoreSection = {
  harmony_one_liner: string;
  favoritism_warning: string;
};

export type GrowthTunnelSection = {
  current_challenge: string;
  focus_areas: string[];
};

export type FilialRewardSection = {
  future_reward: string;
  reward_index: "high" | "moderate" | "developing";
};

export type FamilySnapshotSection = {
  bond_pct: number;
  synergy_pct: number;
  risk_pct: number;
  one_line_family: string;
};

export type FamilyKillerSections = {
  section_child_dna: ChildDnaSection;
  section_snapshot: FamilySnapshotSection;
  section_destiny: DestinyScoreSection;
  section_growth_tunnel: GrowthTunnelSection;
  section_filial_reward: FilialRewardSection;
  section_de_escalation: ChildDeEscalationCard;
};

export function buildFamilyKillerSections(params: {
  ctx: {
    childNickname: string;
    parentNickname: string;
    parentRole: FamilyParentRole;
    familyPairAnalysis: FamilyPairSajuAnalysis;
    tenGod: FamilyParentTenGodAnalysis;
    masterScores: FamilyMasterScores;
    locale: Locale;
    /** 성장 터널 분석 연도. 생략 시 현재 연도(기존 동작). */
    analysisYear?: number;
    /** true면 시청자=자녀(Track B) — 시그니처 한 줄 요약 톤 분기용. */
    childIsViewer?: boolean;
  };
}): FamilyKillerSections {
  const {
    childNickname,
    parentNickname,
    parentRole,
    familyPairAnalysis,
    tenGod,
    masterScores,
    locale,
  } = params.ctx;
  const childIsViewer = params.ctx.childIsViewer === true;
  const analysisYear = params.ctx.analysisYear ?? new Date().getFullYear();
  const sig = familyPairAnalysis.scoringSignals;
  const childSig = familyPairAnalysis.childSignals;
  const roleLabel = pick(locale, parentRole === "mother" ? "Mom" : "Dad", parentRole === "mother" ? "엄마" : "아빠");

  const geniusTitle =
    GENIUS_TITLES[locale][childSig.dominantArchetype] ?? GENIUS_TITLES[locale].earth!;

  const commMap: Record<string, string> = {
    expressive: pick(
      locale,
      `${childNickname} tends to say what's on their mind the moment it comes up — sharing how they feel right now rather than turning it over silently first.`,
      `${childNickname}는 생각이 떠오르면 바로 말로 꺼내는 편이에요. 머릿속을 길게 굴리기보다 '지금 느끼는 것'을 먼저 공유합니다.`,
    ),
    analytical: pick(
      locale,
      `${childNickname} settles their heart with logic and facts. Accepting emotion alone isn't enough — they need to understand "why" before they feel at ease.`,
      `${childNickname}는 논리와 사실로 마음을 정리해요. 감정만 받아들이기보다 '왜 그랬는지' 이해해야 안심합니다.`,
    ),
    sensitive: pick(
      locale,
      `${childNickname} reacts strongly to tone, expression, and mood. A gentle tone lands far better than a raised voice.`,
      `${childNickname}는 말투·표정·분위기에 예민하게 반응해요. 큰 소리보다 부드러운 톤이 훨씬 잘 들립니다.`,
    ),
    steady: pick(
      locale,
      `${childNickname} speaks slowly but deeply. Rushing them for an instant answer can make them shut down.`,
      `${childNickname}는 천천히, 그러나 깊게 말하는 타입이에요. 즉답을 재촉하면 입을 닫을 수 있습니다.`,
    ),
    playful: pick(
      locale,
      `${childNickname} often opens up through humor and playfulness. Too serious an atmosphere can feel like pressure.`,
      `${childNickname}는 유머와 장난으로 마음을 여는 경우가 많아요. 너무 진지한 분위기는 부담이 될 수 있습니다.`,
    ),
  };

  let hiddenSensitivity = pick(
    locale,
    `${childNickname} may look fine on the surface, but can hold onto even small criticism for a long time.`,
    `${childNickname}는 겉으론 괜찮아 보여도, 작은 비난에도 오래 마음에 담아두는 편일 수 있어요.`,
  );
  if (childSig.hasWonjinGuimunIntra || childSig.hasExcessSeal) {
    hiddenSensitivity = pick(
      locale,
      `${childNickname} carries a "hidden radar" that's especially sensitive to stimulation. Loud noises, sudden changes, and being compared to others make their body tense up first. Giving a heads-up like "this is about to change" and keeping a safe routine helps them feel much more at ease.`,
      `${childNickname}는 자극에 유독 예민한 '숨겨진 레이더'를 달고 있어요. ` +
        `큰 소리·갑작스런 변화·비교당하는 순간 몸이 먼저 긴장합니다. ` +
        `미리 "곧 바뀔 거야"라고 예고하고, 안전한 루틴을 지켜주면 훨씬 편안해집니다.`,
    );
  }

  let attentionFocus = pick(
    locale,
    `${childNickname} is the type to lose track of time once absorbed in something they're interested in.`,
    `${childNickname}는 관심 분야에 몰입하면 시간 가는 줄 모르는 타입이에요.`,
  );
  if (childSig.hasExcessFoodOrOfficer) {
    attentionFocus = pick(
      locale,
      `${childNickname} is a high-energy, immersive type. Rather than sitting still for long stretches, learning through movement or breaking tasks into short segments keeps their focus alive. A micro-goal like "just the next 10 minutes" works better than pushing them for being distracted.`,
      `${childNickname}는 에너지가 넘치는 몰입형이에요. 한 가지에 오래 앉아 있기보다 ` +
        `움직이며 배우거나, 짧은 구간으로 끊어 주는 방식이 집중력을 살려줍니다. ` +
        `산만하다고 몰아붙이기보다 '다음 10분만' 같은 마이크로 목표가 효과적입니다.`,
    );
  } else if (childSig.hasStrongFocusStyle) {
    attentionFocus = pick(
      locale,
      `${childNickname} is a deep-focus type who dives in completely once engaged. An undisturbed environment, a steady rhythm, and a single line of praise maximize their concentration.`,
      `${childNickname}는 한 번 빠지면 깊게 파고드는 고집중형이에요. ` +
        `방해하지 않는 환경·규칙적인 리듬·칭찬 한 줄이 집중력을 극대화합니다.`,
    );
  }

  let hiddenGenius = pick(
    locale,
    `${childNickname} may seem slow or quirky right now, but has the potential to grow greatly at their own pace.`,
    `${childNickname}는 지금은 느리거나 엉뚱해 보일 때가 있어도, 자기만의 속도로 크게 자랄 잠재력이 있어요.`,
  );
  if (childSig.hasLateBloomerPotential) {
    hiddenGenius = pick(
      locale,
      `${childNickname} is a late bloomer who matures more slowly on the surface. Rather than the moment adults rush with "already?", their skills tend to leap forward during the period when they build their own experience of "I did it." Trust them with "your pace is good" instead of comparison.`,
      `${childNickname}는 겉보기엔 늦게 성숙하는 대기만성형이에요. ` +
        `어른들이 '벌써?'라고 재촉하는 시기보다, 스스로 '해냈다'는 경험을 쌓는 시기에 ` +
        `실력이 뛰어나게 튀어 오릅니다. 비교 대신 "네 페이스가 좋아"라고 믿어 주세요.`,
    );
  }

  let oneLine = childIsViewer
    ? pick(
        locale,
        `${childNickname} & ${parentNickname} — a relationship that grows more comfortable the more you each understand the other's rhythm`,
        `${childNickname} & ${parentNickname} — 서로 다른 리듬을 이해할수록 마음이 편해지는 부모-자식 사이`,
      )
    : pick(
        locale,
        `${childNickname} & ${parentNickname} — a ${roleLabel}–child bond that deepens the more you understand each other's different rhythms`,
        `${childNickname} & ${parentNickname} — 서로 다른 리듬을 이해할수록 깊어지는 ${roleLabel}-자녀 관계`,
      );
  if (masterScores.bond >= 70 && masterScores.risk < 40) {
    oneLine = childIsViewer
      ? pick(
          locale,
          `${childNickname} & ${parentNickname} — a place to lean on anytime, close to an irreplaceable comfort`,
          `${childNickname} & ${parentNickname} — 언제든 기댈 수 있는, 둘도 없이 편안한 사이`,
        )
      : pick(
          locale,
          `${childNickname} & ${parentNickname} — close to an inseparable, warm bond`,
          `${childNickname} & ${parentNickname} — 죽고 못 사는 찰떡궁합에 가까운 따뜻한 유대`,
        );
  } else if (sig.hasStrongParentChildClash || sig.hasDayMonthTensionBond) {
    oneLine = childIsViewer
      ? pick(
          locale,
          `${childNickname} & ${parentNickname} — a warm hedgehog's-dilemma relationship that finally feels comfortable once you each respect the other's boundaries`,
          `${childNickname} & ${parentNickname} — 다정하지만 서로의 선을 존중할 때 비로소 편안해지는 고슴도치 관계`,
        )
      : pick(
          locale,
          `${childNickname} & ${parentNickname} — a precious hedgehog's-dilemma relationship: loving, but needing one step of distance`,
          `${childNickname} & ${parentNickname} — 사랑하지만 한 걸음 떨어져 지켜봐야 할 소중한 고슴도치 관계`,
        );
  } else if (masterScores.synergy >= 65) {
    oneLine = childIsViewer
      ? pick(
          locale,
          `${childNickname} & ${parentNickname} — a steady backing that helps you grow through each other's different strengths`,
          `${childNickname} & ${parentNickname} — 서로 다른 강점으로 나를 자라게 해주는 든든한 뒷배`,
        )
      : pick(
          locale,
          `${childNickname} & ${parentNickname} — growth partners who fill in each other's gaps`,
          `${childNickname} & ${parentNickname} — 서로의 빈틈을 채워 주는 성장 파트너`,
        );
  }

  let harmonyLine = pick(
    locale,
    "Two people with different charms — understanding each other unlocks real synergy.",
    "서로 다른 매력을 가진 두 사람 — 이해하면 시너지가 큽니다.",
  );
  if (sig.hasStrongParentChildClash || sig.hasDayMonthTensionBond) {
    harmonyLine = pick(
      locale,
      "The love runs deep, but staying too close can turn into friction. Independent distance, personal space, and a cooldown period for emotions are the right formula for this relationship.",
      "사랑은 깊지만, 붙어 있으면 가시로 찌를 수 있어요. " +
        "독립적인 거리두기·각자만의 공간·감정 쿨다운 시간이 정답인 관계입니다.",
    );
  } else if (sig.hasStrongParentChildCombine || masterScores.bond >= 70) {
    harmonyLine = pick(
      locale,
      "Close to soulmates who understand each other without words. Just don't let \"respect\" slip away because it's too comfortable.",
      "말하지 않아도 마음이 통하는 소울메이트에 가까운 조합이에요. " +
        "다만 너무 편해서 경계가 흐려지지 않게 '존중' 한 줄은 잊지 마세요.",
    );
  }

  let favoritism = pick(
    locale,
    `${parentNickname} may be especially awkward with ${childNickname}. When it comes across as colder than intended, check in on the feelings first.`,
    `${parentNickname}는 ${childNickname}에게 특별히 서툰 편일 수 있어요. 의도와 다르게 냉정해 보일 때, 먼저 감정을 확인해 주세요.`,
  );
  if (sig.hasStrongParentChildCombine) {
    favoritism = pick(
      locale,
      `You may unconsciously feel more at ease with ${childNickname} than with other family members. There's a risk of favoritism, so share the same respect and time fairly with siblings or other children.`,
      `다른 가족에 비해 ${childNickname}를 무의식적으로 더 편하게 느낄 수 있어요. ` +
        `편애 리스크가 있으니 형제·다른 자녀에게도 같은 존중과 시간을 공평하게 나눠 주세요.`,
    );
  } else if (sig.hasStrongParentChildClash) {
    favoritism = pick(
      locale,
      `${childNickname} and ${parentNickname} can easily feel "why are they like that?" about each other. Since the flip side of favoritism — awkwardness in how you treat them — can show up, this child especially needs more praise and specific recognition.`,
      `${childNickname}와 ${parentNickname}는 서로 '왜 저렇게?'라고 느끼기 쉬워요. ` +
        `편애의 반대편인 '대하기 서툼'이 올 수 있으니, 이 아이만큼은 더 많은 칭찬·구체적 인정이 필요합니다.`,
    );
  }

  const yearBranch = getCalendarYearBranch(analysisYear);
  const child = familyPairAnalysis.chartChild;
  const yearClashDay = hasBranchRelation("branch_clash", yearBranch, child.dayBranchCode);
  const yearClashMonth = hasBranchRelation("branch_clash", yearBranch, child.monthBranchCode);
  const focusAreas: string[] = [];
  if (yearClashDay) focusAreas.push(pick(locale, "Self-esteem & identity", "자존감·정체성"));
  if (yearClashMonth) focusAreas.push(pick(locale, "School & friendships", "학교·친구 관계"));
  if (!focusAreas.length) {
    focusAreas.push(
      pick(locale, "New challenges", "새로운 도전"),
      pick(locale, "Emotional expression", "감정 표현"),
    );
  }

  let growthChallenge = pick(
    locale,
    `In ${analysisYear}, ${childNickname} is moving through a time-specific growth tunnel — a stretch of defining "who I am" that belongs to this year, not a fixed trait.`,
    `${analysisYear}년, ${childNickname}는 올해의 성장 터널을 지나고 있어요 — '내가 누구인지'를 스스로 다듬는 시기적 과제이며, 고정된 성격이 아닙니다.`,
  );
  if (yearClashDay || yearClashMonth) {
    growthChallenge = pick(
      locale,
      `In ${analysisYear}, ${childNickname} is in a time-specific growth tunnel. ` +
        `${yearClashMonth ? "School or peer sensitivity may rise this year, " : ""}` +
        `${yearClashDay ? "and small remarks can shake pride more than usual. " : ""}` +
        `This is about the pressure of this year — listening to "why this stretch feels hard" matters more than grades or rankings right now.`,
      `${analysisYear}년, ${childNickname}는 올해의 성장 터널 구간에 있어요. ` +
        `${yearClashMonth ? "학교·또래 관계에서 예민해질 수 있고, " : ""}` +
        `${yearClashDay ? "작은 지적에도 자존심이 크게 흔들릴 수 있어요. " : ""}` +
        `고정된 문제가 아니라 올해의 압력입니다. 성적·순위보다 '네가 힘든 이유'를 먼저 들어 주는 게 최우선입니다.`,
    );
  }

  const parentHour = familyPairAnalysis.chartParent.pillars.find(
    (p) => p.name === "시주",
  );
  let filialReward = pick(
    locale,
    `${childNickname} may grow up to be the type who offers ${parentNickname} emotional comfort.`,
    `${childNickname}는 커서 ${parentNickname}에게 정서적 위로를 건네는 타입으로 자랄 가능성이 있어요.`,
  );
  let rewardIndex: FilialRewardSection["reward_index"] = "moderate";
  if (
    parentHour &&
    (sig.hasStrongParentChildCombine ||
      sig.hasJohuElementSupport ||
      tenGod.parentProfile.support_strength === "strong")
  ) {
    filialReward = pick(
      locale,
      `${childNickname} may grow into a solid "family reward" for ${parentNickname}'s later years — a possibility rooted in how you relate now, not a fixed trait. They may repay you in at least one of economics, caregiving, or emotional support.`,
      `${childNickname}는 ${parentNickname}의 인생 후반전에 든든한 '패밀리 리워드'가 될 수 있어요 — 지금 관계 패턴에서 이어질 가능성이지, 정해진 성격의 단정은 아닙니다. ` +
        `경제·돌봄·정서 중 하나 이상에서 보답으로 이어질 여지가 있습니다.`,
    );
    rewardIndex = "high";
  } else if (sig.hasStrongParentChildClash) {
    filialReward = pick(
      locale,
      `${childNickname} and ${parentNickname} have a difference in temperament, but as adults, the relationship can mature into repaying each other "in their own way." For now, distance and respect are the seeds.`,
      `${childNickname}와 ${parentNickname}는 성격 온도차가 있지만, ` +
        `성인이 되면 '서로 다른 방식으로' 보답하는 관계로 성숙할 수 있어요. 지금은 거리와 존중이 씨앗입니다.`,
    );
    rewardIndex = "developing";
  }

  const deEscalation = buildChildDeEscalationCard({
    childNickname,
    parentNickname,
    parentRole,
    childCounts: tenGod.countsChild,
    locale,
  });

  return {
    section_child_dna: {
      genius_title: sanitizeFamilyParentText(geniusTitle),
      communication_style: sanitizeFamilyParentText(
        commMap[childSig.communicationStyle] ?? commMap.steady!,
      ),
      hidden_sensitivity: sanitizeFamilyParentText(hiddenSensitivity),
      attention_focus_style: sanitizeFamilyParentText(attentionFocus),
      hidden_genius: sanitizeFamilyParentText(hiddenGenius),
    },
    section_snapshot: {
      bond_pct: masterScores.bond,
      synergy_pct: masterScores.synergy,
      risk_pct: masterScores.risk,
      one_line_family: sanitizeFamilyParentText(oneLine),
    },
    section_destiny: {
      harmony_one_liner: sanitizeFamilyParentText(harmonyLine),
      favoritism_warning: sanitizeFamilyParentText(favoritism),
    },
    section_growth_tunnel: {
      current_challenge: sanitizeFamilyParentText(growthChallenge),
      focus_areas: focusAreas.map((f) => sanitizeFamilyParentText(f)),
    },
    section_filial_reward: {
      future_reward: sanitizeFamilyParentText(filialReward),
      reward_index: rewardIndex,
    },
    section_de_escalation: deEscalation,
  };
}
