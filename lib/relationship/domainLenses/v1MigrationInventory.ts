/**
 * V1 Asset Preservation and Migration Inventory
 *
 * Machine-readable and human-readable register of all recovered V1 assets
 * across Partner (Marriage), Family Parent-Child, Friend, and Cowork domains.
 *
 * Preservation Policy: V1 runtime code is 100% PRESERVED and never deleted.
 */

export type V1MigrationStatus =
  | "PRESERVED_AS_IS"
  | "REUSE_AS_EVIDENCE"
  | "ADAPT_INTO_DOMAIN_LENS"
  | "ADAPT_INTO_CANONICAL_MEANING"
  | "RETAIN_AS_PSYCH_ONLY"
  | "REWRITE_FOR_CONFIDENCE"
  | "DEFER";

export type V1AssetMigrationRecord = {
  asset_id: string;
  domain: "partner" | "family" | "friend" | "work";
  source_file: string;
  source_key_or_export: string;
  target_lens_id: string;
  status: V1MigrationStatus;
  user_question_answered_ko: string;
  saju_evidence_dependency: string;
  preservation_rationale: string;
  confidence_adaptation_note?: string;
};

export const V1_MIGRATION_INVENTORY: V1AssetMigrationRecord[] = [
  // ==========================================================================
  // 1. Partner (Marriage) Domain Assets
  // ==========================================================================
  {
    asset_id: "partner_v1_cfo_canonical",
    domain: "partner",
    source_file: "lib/relationship/marriage/marriageOperatingCfoCanonical.ts",
    source_key_or_export: "buildMarriageOperatingCfoCanonical",
    target_lens_id: "partner_operating_cfo",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "우리 집 재정과 지출 관리는 누가 더 적합하고 어떻게 합의해야 할까?",
    saju_evidence_dependency: "Personal Ten-Gods (정재/편재) + Day Branch Rootedness + Psych CFO scores",
    preservation_rationale: "Operating CFO logic provides proven real-world money coordination guidance.",
  },
  {
    asset_id: "partner_v1_bedroom_profile",
    domain: "partner",
    source_file: "lib/relationship/marriage/bedroomProfile.ts",
    source_key_or_export: "resolveRejectionAxisNote",
    target_lens_id: "partner_bedroom_intimacy",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "우리 둘의 침실 온도와 스킨십/수면 리듬은 어떻게 조화시킬까?",
    saju_evidence_dependency: "Johu temperature + Day Branch Six Combine/Clash + Stamina profiles",
    preservation_rationale: "Recovers respectful, confidence-aware language for intimacy and sleep rhythm.",
  },
  {
    asset_id: "partner_v1_parenting_style",
    domain: "partner",
    source_file: "lib/relationship/marriage/marriageTenGodAnalysis.ts",
    source_key_or_export: "refineParentingStyle",
    target_lens_id: "partner_parenting_alignment",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "자녀 양육 시 부모로서의 역할 분담과 훈육 방식의 차이는 어떻게 조율할까?",
    saju_evidence_dependency: "Ten Gods (관성/인성/식상) + Pair Balance of Power",
    preservation_rationale: "Preserves rich role definitions (Coach, Anchor, Cheerleader) in co-parenting.",
  },
  {
    asset_id: "partner_v1_cohabitation_killer",
    domain: "partner",
    source_file: "lib/relationship/marriage/buildCohabitationKillerQuestions.ts",
    source_key_or_export: "buildCohabitationKillerQuestions",
    target_lens_id: "partner_household_chores",
    status: "PRESERVED_AS_IS",
    user_question_answered_ko: "동거 및 결혼 생활에서 가장 먼저 부딪힐 현실적 생활 문제는 무엇일까?",
    saju_evidence_dependency: "Comparison Table 6 axes + Branch clashes",
    preservation_rationale: "V1 killer questions provide concrete life scene prompts directly usable in reports.",
  },

  // ==========================================================================
  // 2. Family Parent–Child Domain Assets
  // ==========================================================================
  {
    asset_id: "family_v1_household_roles",
    domain: "family",
    source_file: "lib/relationship/familyParent/buildFamilyHouseholdRoles.ts",
    source_key_or_export: "buildFamilyHouseholdRoles",
    target_lens_id: "family_household_roles",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "한집에서 살아갈 때 부모와 자녀의 생활 역할과 권한 분담은 어떻게 이뤄질까?",
    saju_evidence_dependency: "Parent/Child Ten Gods + Day Branch interactions",
    preservation_rationale: "Prevents parental role confusion and models healthy household collaboration.",
  },
  {
    asset_id: "family_v1_talent_align",
    domain: "family",
    source_file: "lib/relationship/familyParent/familyTalentAlign.ts",
    source_key_or_export: "alignFamilyTalents",
    target_lens_id: "family_hidden_needs",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "자녀가 가진 숨은 재능과 본질적 기질을 어떻게 발현시켜 줄 수 있을까?",
    saju_evidence_dependency: "Month Branch Seasonality + Stem Rootedness + Ten God archetypes",
    preservation_rationale: "Recovers empowering talent guidance without deterministic career pigeonholing.",
  },
  {
    asset_id: "family_v1_sos_script",
    domain: "family",
    source_file: "lib/relationship/familyParent/familySosScript.ts",
    source_key_or_export: "buildFamilySosScript",
    target_lens_id: "family_crisis_recovery",
    status: "ADAPT_INTO_CANONICAL_MEANING",
    user_question_answered_ko: "심각한 감정 대립이나 훈육 마찰 후 어떻게 안전하게 화해할까?",
    saju_evidence_dependency: "Wonjin/Guimun + Branch Clashes + Psych self-control scores",
    preservation_rationale: "Provides emergency conversation scripts for real-world emotional repair.",
  },

  // ==========================================================================
  // 3. Friend Domain Assets
  // ==========================================================================
  {
    asset_id: "friend_v1_treasurer_canonical",
    domain: "friend",
    source_file: "lib/relationship/friend/friendTreasurerCanonical.ts",
    source_key_or_export: "buildFriendTreasurerCanonical",
    target_lens_id: "friend_treasurer_split",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "친구 모임에서 총무/정산과 모임 비용 관리는 누가 맡는 것이 자연스러울까?",
    saju_evidence_dependency: "정재/편재/겁재 counts + Structure psych axis",
    preservation_rationale: "Unique high-value feature answering daily friend group 1/N dynamic.",
  },
  {
    asset_id: "friend_v1_travel_planner",
    domain: "friend",
    source_file: "lib/relationship/friend/friendTravelPlannerCanonical.ts",
    source_key_or_export: "buildFriendTravelPlannerCanonical",
    target_lens_id: "friend_travel_lead",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "함께 여행을 떠날 때 코스 기획과 현장 길잡이는 누가 리드해야 편할까?",
    saju_evidence_dependency: "식신/상관 (기획) vs 정관/정재 (일정 관리) + Energy flow",
    preservation_rationale: "High user engagement module providing concrete trip role assignments.",
  },
  {
    asset_id: "friend_v1_deescalation",
    domain: "friend",
    source_file: "lib/relationship/friend/friendDeEscalationPrescriptions.ts",
    source_key_or_export: "buildFriendDeEscalationPrescriptions",
    target_lens_id: "friend_repair_reconciliation",
    status: "ADAPT_INTO_CANONICAL_MEANING",
    user_question_answered_ko: "서운한 점이 생겼을 때 자존심 상하지 않고 쿨하게 푸는 방법은?",
    saju_evidence_dependency: "Stem clash + Wonjin + Empathy psych scores",
    preservation_rationale: "Preserves mature friendship recovery advice.",
  },

  // ==========================================================================
  // 4. Cowork (Work Colleague) Domain Assets
  // ==========================================================================
  {
    asset_id: "work_v1_leadership_canonical",
    domain: "work",
    source_file: "lib/relationship/workColleague/workLeadershipCanonical.ts",
    source_key_or_export: "buildWorkLeadershipCanonical",
    target_lens_id: "work_leadership_split",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "업무 협업에서 프로젝트 리딩과 실무 조율의 주도권은 어떻게 나뉠까?",
    saju_evidence_dependency: "편관/정관/비견/겁재 + Power balance metrics",
    preservation_rationale: "Clean canonical leadership split without toxic hierarchy assumptions.",
  },
  {
    asset_id: "work_v1_office_language",
    domain: "work",
    source_file: "lib/relationship/workColleague/officeLanguage.ts",
    source_key_or_export: "resolveOfficeVocabulary",
    target_lens_id: "work_feedback_cushion",
    status: "ADAPT_INTO_CANONICAL_MEANING",
    user_question_answered_ko: "상대방의 기분을 상하게 하지 않고 핵심 피드백을 전달하는 쿠션어는?",
    saju_evidence_dependency: "상관/식신 vs 편관/정관 + Communication psych scores",
    preservation_rationale: "Recovers professional corporate communication cushions and speech tips.",
  },
  {
    asset_id: "work_v1_ten_god_complement",
    domain: "work",
    source_file: "lib/relationship/workColleague/tenGodComplement.ts",
    source_key_or_export: "resolveTenGodComplement",
    target_lens_id: "work_special_weapon",
    status: "ADAPT_INTO_DOMAIN_LENS",
    user_question_answered_ko: "서로의 다른 기질이 어떻게 조직 내에서 상호보완적 무기로 작동할까?",
    saju_evidence_dependency: "Cross-Ten-God complementation + Noble star synergy",
    preservation_rationale: "Strengthens synergy discovery between diverse work styles.",
  },
];
