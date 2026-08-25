import type { Locale } from "@/lib/i18n/locale";
import type { MarriageCanonicalBundle } from "./marriageCanonicalTypes";
import type {
  CanonicalMarriageStoryPlan,
  MarriageChapterOwnership,
  ContradictionResolvedItem,
  LegacyContentRef,
} from "./canonicalMarriageStoryPlanTypes";

export type BuildCanonicalMarriageStoryPlanParams = {
  nameA: string;
  nameB: string;
  householdOS: MarriageCanonicalBundle;
  legacyHomeReport?: any;
  locale?: Locale;
};

export function buildCanonicalMarriageStoryPlan(
  params: BuildCanonicalMarriageStoryPlanParams,
): CanonicalMarriageStoryPlan {
  const locale = params.locale ?? "ko-KR";
  const isEn = locale === "en-US";
  const { nameA: a, nameB: b, householdOS: os } = params;

  // 1. Chapter Ownership & Single Primary Owner Assembly
  const chapters: MarriageChapterOwnership[] = [
    {
      chapterId: "c1_who_we_are",
      chapterNumber: "01",
      title: isEn ? "Who We Are: The Core Chemistry" : "왜 우리인가: 두 사람이 서로에게 특별한 이유",
      userQuestion: isEn
        ? "What is the core attraction, complementary bond, and identity of our marriage?"
        : "우리 두 사람이 처음 강하게 끌렸던 기질적 결합력과 서로가 만나 비로소 완성되는 상보적 커플 정체성은 무엇인가?",
      primaryOwnerMeanings: ["Why Us Core Attraction", "Couple Magic", "A + B -> C Identity"],
      secondaryRefMeanings: ["3-Score Overview"],
      summary: isEn
        ? `${a} & ${b} form a complementary team where ${a}'s drive and ${b}'s stability activate each other.`
        : `${a}님이 먼저 방향을 잡고 ${b}님이 안정적으로 받아줄 때 둘의 서로 다른 라이프스타일이 가장 기분 좋게 맞물립니다.`,
    },
    {
      chapterId: "c2_lifestyle_dna",
      chapterNumber: "02",
      title: isEn ? "Life Style & Household DNA" : "우리는 어떻게 다른가: 함께 살 때 드러나는 기질적 템포",
      userQuestion: isEn
        ? "How do our daily habits, bio-rhythms, decision tempos, and personal spaces fit together?"
        : "한 공간에 함께 살기 시작할 때 드러나는 라이프스타일, 수면 템포, 의사결정 속도, 개인 공간의 차이는 어떠한가?",
      primaryOwnerMeanings: ["11-Axis Radar & Dark Axis Insights", "Lifestyle Fit", "Sleep Fit", "Spouse Palace Bond"],
      secondaryRefMeanings: ["Bio-rhythm Sync"],
      summary: [os.marriage11Axis.highlights.maxTension.realLifePhenomenon, os.marriage11Axis.highlights.maxTension.coordinationPoint].filter(Boolean).join(" "),
    },
    {
      chapterId: "c3_household_os",
      chapterNumber: "03",
      title: isEn ? "Household OS: Money, Chores & PM" : "어떻게 함께 살아가는가: 돈, 집안일, 보이지 않는 가정 운영 책임",
      userQuestion: isEn
        ? "Who earns, manages, saves, and reviews risk in our household economic partnership?"
        : "누가 벌고, 누가 관리하고, 누가 모으고, 큰돈 결정은 어떤 순서로 해야 우리 부부에게 가장 유리한가?",
      primaryOwnerMeanings: ["Household PM / Mental Load", "Planner vs Executor", "Decision Power Map", "Operating CFO", "Economic Partnership"],
      secondaryRefMeanings: ["Chores Allocation"],
      summary: [os.economicPartnership.pairSynergy, os.plannerExecutor.shiftNote].filter(Boolean).join(" "),
    },
    {
      chapterId: "c4_intimacy_bedroom",
      chapterNumber: "04",
      title: isEn ? "How We Love & Build Intimacy" : "우리는 어떻게 사랑하고 가까워지는가",
      userQuestion: isEn
        ? "Do we recognize each other's love, and how do we draw close in emotional & physical intimacy?"
        : "우리는 서로의 사랑을 제대로 알아보고 있을까? 그리고 둘만 있을 때 마음과 몸의 거리는 어떤 방식으로 가까워질까?",
      primaryOwnerMeanings: ["Love Transmission Channel", "Saju Pair Intimacy", "Bedroom Temperature"],
      secondaryRefMeanings: ["Desire Mismatch & Rejection"],
      summary: os.chapter04Intelligence
        ? os.chapter04Intelligence.introQuestion
        : [os.loveDeliveryMatch.matchAtoB.narrative, os.loveDeliveryMatch.overallSummary].filter(Boolean).join(" "),
    },
    {
      chapterId: "c5_conflict_deescalation",
      chapterNumber: "05",
      title: isEn ? "Conflict, De-Escalation & Emergency SOS" : "어디서 무너지는가: 갈등의 감정 전이와 위기 회복",
      userQuestion: isEn
        ? "What triggers our clashes, how do our emotion stages escalate, and how do we recover?"
        : "싸움이 시작될 때 두 사람의 감정은 어떤 수순으로 증폭되며, 관계의 긴장을 다스리는 쿨링다운과 SOS 대본은 무엇인가?",
      primaryOwnerMeanings: ["Conflict 4-Stage State Transition", "When We Need Each Other Most", "Emergency SOS Scripts", "Crisis Role", "Home De-Escalation"],
      secondaryRefMeanings: ["De-Escalation Protocol"],
      summary: [os.conflict4Stage.pairSummary, os.emergencySosCombined.scriptAtoB?.firstLine ? `${isEn ? "SOS script" : "SOS 대본"}: "${os.emergencySosCombined.scriptAtoB.firstLine}"` : null].filter(Boolean).join(" "),
    },
    {
      chapterId: "c6_family_parenting_career",
      chapterNumber: "06",
      title: isEn ? "New Family Transition & Life Stage Pressure" : "현실 앞에서 한 팀인가: 원가족 독립, 양육과 커리어 수호",
      userQuestion: isEn
        ? "Are we an independent new family unit capable of defending our home against outside pressure?"
        : "부부가 된 후 각자의 원가족 독립을 이루고 둘만의 새로운 가족 단위를 1순위로 지켜낼 수 있는가?",
      primaryOwnerMeanings: ["New Family Transition", "In-Law / Original Family Boundary", "Spouse Protection Style", "Life Stage Transition", "Career x Home Transition", "Parenting Synergy"],
      secondaryRefMeanings: ["Work-Life Support"],
      summary: [os.inLawBoundary.narrative, os.careerHomeTransition.overallNarrative].filter(Boolean).join(" "),
    },
    {
      chapterId: "c7_longterm_compounding",
      chapterNumber: "07",
      title: isEn ? "Long-Term Compounding: Assets & Liabilities Across Time" : "시간이 지나면 무엇이 쌓이는가: 부부 자산과 부채의 복리",
      userQuestion: isEn
        ? "How do our current patterns compound across decades into household assets or liabilities?"
        : "현재의 생활과 역할 분담이 5년, 10년 반복되면 어떤 것은 부부 자산이 되고 어떤 것은 결함 부채로 누적되는가?",
      primaryOwnerMeanings: ["Couple Burnout / Household Overload", "What Not to Expect", "Need x Actual Delivery x Gap", "Long-Term Compounding"],
      secondaryRefMeanings: ["Future Risk Forecast"],
      summary: os.chapter03Intelligence?.assets?.[0]?.mechanism || "",
    },
    {
      chapterId: "c8_partnership_verdict",
      chapterNumber: "08",
      title: isEn ? "Life Partnership Final Verdict" : "그래서 좋은 인생 파트너인가: 부부 파트너십 최종 판정",
      userQuestion: isEn
        ? "What is the overall verdict on our lifelong partnership and core synergy?"
        : "인생이라는 긴 여정을 함께 운영할 부부 파트너로서 우리의 최종 동반 적합성과 핵심 강점/취약점은 무엇인가?",
      primaryOwnerMeanings: ["Life Partnership Verdict Scores & Narrative"],
      secondaryRefMeanings: ["Synergy Scores"],
      summary: os.lifePartnershipVerdict.oneLineVerdict,
    },
    {
      chapterId: "c9_next_chapter_rituals",
      chapterNumber: "09",
      title: isEn ? "Our Next Chapter: Action Playbook & Rituals" : "어떻게 살아야 하는가: 우리 부부의 실전 사용설명서",
      userQuestion: isEn
        ? "What specific Do's & Don'ts and weekly rituals will sustain our marriage?"
        : "오래 지속되는 안식을 위해 오늘부터 당장 실천해야 할 것(Do)과 절대 하지 말아야 할 것(Don't)은 무엇인가?",
      primaryOwnerMeanings: ["Action Prescriptions & Long-Term Rituals"],
      secondaryRefMeanings: ["Daily Action Items"],
      summary: isEn
        ? "Establishing clear daily cooling-down routines, weekly financial reviews, and mutual appreciation rituals."
        : "매일의 쿨링다운 시간 확보, 주간 재정 점검, 상호 감사 표현을 고정 주거 리추얼로 정착시킵니다.",
    },
  ];

  // 2. Contradiction Resolution (Innate vs Current vs Pair Dynamic)
  const contradictionResolutions: ContradictionResolvedItem[] = os.discrepancies.map((d) => ({
    domain: d.domain,
    innateFact: d.innateTendency,
    currentBehavior: d.currentBehavior,
    pairDynamic: d.pairDynamicShift,
    unifiedNarrative: d.summaryDiscrepancy,
  }));

  // 3. Legacy Content Preservation Map
  const legacyContentReferences: LegacyContentRef[] = [
    {
      legacySectionKey: "section_origin_story",
      ownerChapterId: "c1_who_we_are",
      status: "REMAP",
      keyOutputs: ["why_us", "positive_change_a", "positive_change_b"],
    },
    {
      legacySectionKey: "section_snapshot",
      ownerChapterId: "c1_who_we_are",
      status: "REMAP",
      keyOutputs: ["romantic_fit_pct", "life_synergy_pct", "home_risk_pct", "one_line_household"],
    },
    {
      legacySectionKey: "section_home_life",
      ownerChapterId: "c2_lifestyle_dna",
      status: "REMAP",
      keyOutputs: ["lifestyle_title", "life_values", "private_home_self", "energy_battery", "family_identity"],
    },
    {
      legacySectionKey: "section_sleep_fit",
      ownerChapterId: "c2_lifestyle_dna",
      status: "REMAP",
      keyOutputs: ["sleep_fit_narrative", "bio_rhythm_sync"],
    },
    {
      legacySectionKey: "section_money_chores",
      ownerChapterId: "c3_household_os",
      status: "REMAP",
      keyOutputs: ["cfo_nickname", "cfo_reason", "chores_guideline", "spending_style_note", "mental_load_note"],
    },
    {
      legacySectionKey: "section_bedroom",
      ownerChapterId: "c4_intimacy_bedroom",
      status: "REMAP",
      keyOutputs: ["stamina", "fantasy", "manner", "rejection_axis_note"],
    },
    {
      legacySectionKey: "section_conflict_communication",
      ownerChapterId: "c5_conflict_deescalation",
      status: "REMAP",
      keyOutputs: ["conflict_trigger", "communication_tempo"],
    },
    {
      legacySectionKey: "section_de_escalation",
      ownerChapterId: "c5_conflict_deescalation",
      status: "REMAP",
      keyOutputs: ["person_a_script", "person_b_script", "shared_trigger_note"],
    },
    {
      legacySectionKey: "section_parenting",
      ownerChapterId: "c6_family_parenting_career",
      status: "REMAP",
      keyOutputs: ["combined_attitude", "person_a_style", "person_b_style", "harmony_tip"],
    },
    {
      legacySectionKey: "section_family_boundary",
      ownerChapterId: "c6_family_parenting_career",
      status: "REMAP",
      keyOutputs: ["inlaw_stress_summary", "person_a_boundary_note", "person_b_boundary_note"],
    },
    {
      legacySectionKey: "section_action_plan",
      ownerChapterId: "c9_next_chapter_rituals",
      status: "REMAP",
      keyOutputs: ["couple_action_plan_1", "couple_action_plan_2", "couple_action_plan_3"],
    },
  ];

  // 4. Romantic Reference Placeholder Ownership Allocation
  const placeholders = {
    radar11Axis: true, // Reserved for Chapter 02
    darkAxisInsights: true, // Reserved for Chapter 02
    conflict4Stage: true, // Reserved for Chapter 05
    wantedVsGivenLove: true, // Reserved for Chapter 04
    whatNotToExpect: true, // Reserved for Chapter 07
    whenNeededMost: true, // Reserved for Chapter 05
    emergencySosScript: true, // Reserved for Chapter 05
  };

  return {
    names: { a, b },
    locale,
    chapters,
    householdOS: os,
    contradictionResolutions,
    legacyContentReferences,
    candidates: os.candidateContract,
    placeholders,
  };
}
