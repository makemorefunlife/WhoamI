import type { Locale } from "@/lib/i18n/locale";
import type { WorkColleagueReportBody } from "../buildWorkColleagueReport";
import { pick, LEGACY_FALLBACK_LOCALE } from "../workColleagueCopy";
import type {
  WorkStoryChapterContract,
  WorkStoryPlanContract,
} from "./workStoryPlanTypes";

export function buildWorkStoryPlan(
  report: WorkColleagueReportBody,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): WorkStoryPlanContract {
  const meta = report.meta as any;
  const canonicalRoleMap = meta?.canonical_role_map;
  const mistakeResponse = meta?.mistake_response;
  const repairApology = meta?.repair_apology;
  const thinkVsDiscuss = meta?.think_vs_discuss;
  const mutualGrowthEffect = meta?.mutual_growth_effect;
  const bestVsRiskyConfig = meta?.best_vs_risky_config;

  const chapters: WorkStoryChapterContract[] = [
    {
      chapterKey: "ch1_glance",
      chapterNumber: 1,
      title: pick(locale, "01 · Partnership at a Glance", "01 · 파트너십 한눈에 보기"),
      userQuestion: pick(locale, "What kind of working pair are we, and what is our core fit?", "우리 둘은 업무적으로 어떤 파트너이며, 핵심 총점과 결합 구도는?"),
      narrativeGoal: pick(locale, "Establish high-level partnership scores and overall alignment.", "파트너십 핵심 총점과 전체적 결합 구도를 명확히 제시한다."),
      primaryMeanings: ["partnership_snapshot_scores", "best_vs_risky_summary"],
      supportingMeanings: ["one_line_definition", "grade_reason"],
      v1Assets: ["section_snapshot", "masterScores_activation_benefit_risk", "one_line_definition"],
      v2CanonicalMeanings: ["best_vs_risky_config.summary"],
      duplicateCandidates: [
        {
          candidate: "Snapshot Score Cards",
          overlappingWith: "Header Badges",
          disposition: "KEEP_BOTH",
        },
      ],
    },
    {
      chapterKey: "ch2_roles_rnr",
      chapterNumber: 2,
      title: pick(locale, "02 · Essential Roles & R&R Division", "02 · 업무 역할과 R&R 분담"),
      userQuestion: pick(locale, "Who should lead direction, execution, QA, and external presentation?", "누가 방향을 이끌고, 누가 실행과 검수, 대외 발표를 맡아야 가장 깔끔한가?"),
      narrativeGoal: pick(locale, "Define authoritative role ownership across all 8 work dimensions.", "8개 업무 차원에서 각자의 주도권과 R&R 분담을 명확히 정의한다."),
      primaryMeanings: ["canonical_work_role_model", "leadership_split", "ownership_delegation", "decision_partnership"],
      supportingMeanings: ["best_vs_risky_config", "weapons_badges"],
      v1Assets: ["section_roles", "leadership_split", "weapons", "contribution_style"],
      v2CanonicalMeanings: ["canonical_role_map", "ownership_delegation", "decision_partnership"],
      duplicateCandidates: [
        {
          candidate: "Office DNA Title",
          overlappingWith: "Role Matrix Role Title",
          disposition: "HUMAN_REVIEW_REQUIRED",
        },
        {
          candidate: "Leadership Split",
          overlappingWith: "Canonical Role External/QA Lead",
          disposition: "RELATED_BUT_DISTINCT",
        },
      ],
    },
    {
      chapterKey: "ch3_style_comm",
      chapterNumber: 3,
      title: pick(locale, "03 · Work Style & Communication Rhythm", "03 · 업무 스타일과 소통 리듬"),
      userQuestion: pick(locale, "Do we think before discussing, and how do we balance focus time?", "혼자 생각하는가 대화하며 푸는가? 집중 시간과 소통 거리는 어떻게 맞추는가?"),
      narrativeGoal: pick(locale, "Align thinking rhythms, focus boundaries, and reporting habits.", "사전 사고 리듬, 집중 시간 경계, 보고 및 대화 습관을 정렬한다."),
      primaryMeanings: ["think_vs_discuss", "office_distance_boundary", "big_picture_vs_detail", "reporting_style_fit"],
      supportingMeanings: ["communication_fit", "6_side_by_side_axes"],
      v1Assets: ["section_mix_fit", "person_a_work_style", "person_b_work_style", "reporting_style_fit", "compare_table"],
      v2CanonicalMeanings: ["think_vs_discuss", "office_distance_boundary", "big_picture_vs_detail"],
      duplicateCandidates: [
        {
          candidate: "6 Side-by-Side Axes",
          overlappingWith: "11-Axis Radar Graph",
          disposition: "KEEP_BOTH",
        },
      ],
    },
    {
      chapterKey: "ch4_crunch_pressure",
      chapterNumber: 4,
      title: pick(locale, "04 · Pressure, Stress & Crunch Mode", "04 · 마감 압박과 긴급 상황 대처"),
      userQuestion: pick(locale, "How do we react under heavy crunch pressure and tight deadlines?", "마감 임박이나 긴급 상황에서 둘의 일하는 방식과 압박 반응은 어떻게 달라지는가?"),
      narrativeGoal: pick(locale, "Map stress overload triggers, priority cut needs, and baseline holding.", "긴급 압박 시 과부하 지점과 우선순위 정리 버퍼 필요성을 명시한다."),
      primaryMeanings: ["crunch_deadline_mode", "psych_11_axis_radar", "energy_drain_line"],
      supportingMeanings: ["risk_and_rhythm_line", "self_control_axis"],
      v1Assets: ["psychRadar", "energy_drain_line", "workPairAnalysis_base"],
      v2CanonicalMeanings: ["crunch_deadline_mode"],
      duplicateCandidates: [
        {
          candidate: "Energy Drain Line",
          overlappingWith: "Crunch Mode Priority Cut Line",
          disposition: "RELATED_BUT_DISTINCT",
        },
      ],
    },
    {
      chapterKey: "ch5_mistake_repair",
      chapterNumber: 5,
      title: pick(locale, "05 · Mistakes, Conflict & Trust Repair", "05 · 실수 대처와 신뢰 복구"),
      userQuestion: pick(locale, "What restores trust when mistakes happen, and how do we repair?", "실수가 생겼을 때 상대는 무엇에 민감하며, 어떻게 보완해야 신뢰가 회복되는가?"),
      narrativeGoal: pick(locale, "Provide directional mistake sensitivity and trust restoration profiles.", "방향성 있는 실수 민감도와 1:1 신뢰 복구 프로토콜을 제시한다."),
      primaryMeanings: ["mistake_response", "repair_apology", "conflict_trigger", "de_escalation_card"],
      supportingMeanings: ["avoid_combination_line", "complaint_signal_line"],
      v1Assets: ["section_warning", "conflict_trigger", "de_escalation_card", "avoid_combination_line"],
      v2CanonicalMeanings: ["mistake_response", "repair_apology"],
      duplicateCandidates: [
        {
          candidate: "De-escalation Card",
          overlappingWith: "Repair Apology Protocol",
          disposition: "KEEP_BOTH",
        },
      ],
    },
    {
      chapterKey: "ch6_mutual_growth",
      chapterNumber: 6,
      title: pick(locale, "06 · Mutual Growth & Long-term Synergy", "06 · 상호 성장의 합과 시너지"),
      userQuestion: pick(locale, "How does each person grow through the other over time?", "함께 일하면서 서로에게 배우는 역량과 장기적인 시너지 효과는 무엇인가?"),
      narrativeGoal: pick(locale, "Illustrate directional mutual growth pathways and credit attribution.", "양방향 대각선 성장 모델과 공로 인정 명의 기재 가이드를 제시한다."),
      primaryMeanings: ["mutual_growth_effect", "recognition_credit_visibility", "synergy_one_liner", "deep_read_saju_overlay"],
      supportingMeanings: ["ten_god_complement", "business_saju_deep"],
      v1Assets: ["section_relationship_loop", "synergy_one_liner", "deepRead"],
      v2CanonicalMeanings: ["mutual_growth_effect", "recognition_credit_visibility"],
      duplicateCandidates: [
        {
          candidate: "Synergy One-Liner",
          overlappingWith: "Mutual Growth Effect",
          disposition: "RELATED_BUT_DISTINCT",
        },
      ],
    },
    {
      chapterKey: "ch7_playbook",
      chapterNumber: 7,
      title: pick(locale, "07 · Practical Playbook & Action Prescriptions", "07 · 실전 협업 가이드 & 처방전"),
      userQuestion: pick(locale, "What operational 1:1 rules and feedback cushions should we adopt today?", "오늘부터 당장 일할 때 적용할 수 있는 1:1 규칙과 피드백 가이드는?"),
      narrativeGoal: pick(locale, "Deliver actionable prescriptions, meeting sync rules, and feedback scripts.", "실전 업무 처방전, 미팅 동기화 규칙, 피드백 쿠션 스크립트를 최종 제공한다."),
      primaryMeanings: ["action_prescriptions", "sync_meeting_rules", "feedback_cushion_script"],
      supportingMeanings: ["break_boundary_fit", "avoid_combination_line"],
      v1Assets: ["section_prescription", "prescriptions_pack", "feedback_cushion_script"],
      v2CanonicalMeanings: ["best_vs_risky_config.riskyConfiguration"],
      duplicateCandidates: [
        {
          candidate: "Feedback Cushion Script",
          overlappingWith: "Conflict De-escalation Advice",
          disposition: "KEEP_BOTH",
        },
      ],
    },
  ];

  const contract: WorkStoryPlanContract = {
    version: "v2_phase4",
    locale,
    canonicalRoleMap,
    chapters,
  };
  return contract;
}
