/**
 * Shared WorkColleagueReportBody fixtures — used by both the adapter unit
 * test (tests/unit/work-report-viewmodel.test.mjs) and the dev-only preview
 * route (app/dev/work-report-viewmodel/page.tsx), so the two never drift and
 * we don't keep two copies of the same ~150-line literal around.
 *
 * These are plain data fixtures, not real LLM/rule-engine output — they only
 * need to satisfy the WorkColleagueReportBody shape.
 */
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { WORK_REPORT_SCHEMA_VERSION } from "@/lib/relationship/workColleague/buildWorkColleagueReport";

/** Full payload — every optional field populated. */
export const fullWorkColleagueReportFixture: WorkColleagueReportBody = {
  headline: "황금 조합",
  summary_line: "핏 80% · 시너지 75% · 리스크 20%",
  one_line_definition: "톱니바퀴가 맞물리는 조합",
  snapshot_panel: {
    grade: "A",
    gaugeLabel: "오피스 파트너십 스냅샷",
    representativeLine: "파트너십 등급 A",
    keywords: ["협업 A"],
    relationshipGauges: [
      { topic: "intimacy", label: "업무 핏·신뢰", activation: 80, benefit: 70, risk: 20 },
      { topic: "stability", label: "프로젝트 시너지", activation: 65, benefit: 75, risk: 25 },
      { topic: "conflict", label: "업무 마찰·갈등", activation: 40, benefit: 30, risk: 20 },
    ],
    personA: { nickname: "Sera", metaphor: "", axes: [] },
    personB: { nickname: "동글", metaphor: "", axes: [] },
    personAxesSource: "hidden",
    narrative: {
      topics: [
        {
          topic: "intimacy",
          title: "① 업무 핏·신뢰",
          subtitle: "",
          activation: 80,
          benefit: 70,
          risk: 20,
          interpretation: "회의에서 말이 잘 통해요.",
          isWarning: false,
        },
        {
          topic: "stability",
          title: "② 프로젝트 시너지",
          subtitle: "",
          activation: 65,
          benefit: 75,
          risk: 25,
          interpretation: "장기 프로젝트에 유리합니다.",
          isWarning: false,
        },
        {
          topic: "conflict",
          title: "③ 업무 마찰·갈등",
          subtitle: "",
          activation: 40,
          benefit: 30,
          risk: 20,
          interpretation: "일정이 겹치면 예민해질 수 있어요.",
          isWarning: true,
        },
      ],
    },
  },
  office: {
    section_dna: {
      person_a: {
        nickname: "Sera",
        character_title: "실속 폭주 CFO",
        work_style: "큰 그림을 먼저 그려요.",
        inner_standard: "위기 때 기준이 분명해져요.",
        overall_character: "오피스에서 안정 에너지가 두드러져요.",
      },
      person_b: {
        nickname: "동글",
        character_title: "아이디어 뱅크",
        work_style: "섬세하게 조율해요.",
        inner_standard: "혼자 정리하는 편이에요.",
        overall_character: "표현·기획 강점이 있어요.",
      },
    },
    section_snapshot: {
      fit_pct: 80,
      synergy_pct: 75,
      risk_pct: 20,
      one_line_definition: "톱니바퀴가 맞물리는 조합",
    },
    section_mix_fit: {
      person_a_work_style: "Sera 업무 스타일",
      person_b_work_style: "동글 업무 스타일",
      communication_fit: "회의실에서 방향이 잘 맞아요.",
    },
    section_respect: {
      person_a_boundary: "Sera 경계",
      person_b_boundary: "동글 경계",
    },
    section_roles: {
      person_a: {
        nickname: "Sera",
        weapons: ["예산 관리"],
        handoff_tasks: [
          { task_label: "브레인스토밍", handoff_to: "동글", reason: "동글이 기획에 강해요." },
        ],
      },
      person_b: { nickname: "동글", weapons: ["기획"], handoff_tasks: [] },
      synergy_one_liner: "역할만 나누면 톱니바퀴가 돌아갑니다.",
      leadership_split: {
        external_lead: "a",
        internal_qa_lead: "b",
        summary: "Sera는 대외 발표 쪽이 잘 맞고, 동글은 실무 검수 쪽이 강해요.",
      },
    },
    section_upset: {
      person_a: {
        nickname: "Alex",
        upset_signals: "말수가 줄어요.",
        do_list: ["보완 계획 제시"],
        avoid_list: ["공개 지적"],
      },
      person_b: {
        nickname: "Jordan",
        upset_signals: "조용해져요.",
        do_list: ["시간 주기"],
        avoid_list: ["즉답 강요"],
      },
    },
    section_ideal_roles: {
      person_a: {
        nickname: "Alex",
        ideal_roles: ["사업개발"],
        ideal_departments: ["사업본부"],
        why: "실속 폭주 CFO라서",
      },
      person_b: {
        nickname: "Jordan",
        ideal_roles: ["서비스 기획"],
        ideal_departments: ["기획팀"],
        why: "아이디어 뱅크라서",
      },
      together_combo: "사업본부 × 기획팀 조합이 잘 맞아요.",
    },
    section_warning: {
      conflict_trigger: "일정 우선순위가 부딪힐 때 긴장이 오릅니다.",
      de_escalation: {
        hashtag: "#실속형사과가최고",
        color: "green",
        title: "말보다 결과·보상",
        detail: "실질 액션과 손해 보상이 있으면 금방 넘어갑니다.",
      },
    },
  },
  meta: {
    report_schema_version: WORK_REPORT_SCHEMA_VERSION,
    grade: "A",
    grade_reason: "파트너십 등급 A — 업무적 핏 80% · 협업 시너지 75% · 오피스 리스크 20%",
    uncertain_items: [],
    fit_pct: 80,
    synergy_pct: 75,
    risk_pct: 20,
    psych_match: {
      axis_results: [
        { axis_key: "structure", score_a: 70, score_b: 40, gap: 30, match_type: "tension" },
        { axis_key: "empathy", score_a: 60, score_b: 55, gap: 5, match_type: "similarity" },
      ],
      conflict_triggers: [{ axis_key: "structure", gap: 30, match_type: "tension" }],
    },
    psych_lens: {
      intro_line: "같이 일할 때 특히 눈에 띄는 축이에요.",
      highlights: [
        {
          axis_key: "structure",
          axis_label: "계획구조화",
          gap: 30,
          match_type: "tension",
          topic: "일정 관리",
          section_hint: "section_warning",
          hook: "일정 감각 차이",
          narrative: "한쪽은 계획형, 한쪽은 즉흥형이에요.",
        },
      ],
      lens_title: "🏢 같이 일할 때 특히 눈에 띄는 축",
      chart_note: "동료·파트너 둘의 현재 모습을 11축 설문으로 비교했어요.",
    },
    prescription_work: {
      schema_version: "work_prescription_v1",
      intro_line: "실행 처방입니다.",
      items: [
        {
          topic: "leadership_conflict",
          headline: "오피스 주도권 갈등 해소",
          evidence: { source: "pair_work_signals", signal_paths: [], summary: "요약", snapshot: {} },
          do_list: ["결정자 지정"],
          dont_list: ["발언 끊기"],
        },
        {
          topic: "office_baseline",
          headline: "매주 10분 — 협업 운영 점검",
          evidence: { source: "pair_work_signals", signal_paths: [], summary: "요약", snapshot: {} },
          do_list: ["금요일 10분 체크인"],
          dont_list: ["장문 카톡 연타"],
        },
      ],
    },
  },
};

/**
 * Minimal / legacy payload — several optional sources absent, to exercise the
 * omit-not-fabricate path. `office.section_respect/section_upset/section_ideal_roles`
 * are non-optional in today's `OfficePartnershipReport` type because the current
 * rule engine always produces them, but real legacy JSONB rows written before
 * those sections existed do NOT have them — that's exactly the "old cache row"
 * scenario buildWorkReportViewModel's optional chaining is defending against.
 * `as unknown as WorkColleagueReportBody` models that real-world, untyped-at-rest
 * DB shape rather than pretending this fixture satisfies today's stricter type.
 */
const minimalWorkColleagueReportFixtureRaw = {
  headline: "미니멀 조합",
  summary_line: "",
  one_line_definition: "미니멀 조합",
  snapshot_panel: {
    grade: "B",
    gaugeLabel: "",
    representativeLine: "",
    keywords: [],
    relationshipGauges: [],
    personA: { nickname: "Alex", metaphor: "", axes: [] },
    personB: { nickname: "Jordan", metaphor: "", axes: [] },
    personAxesSource: "hidden",
    narrative: { topics: [] },
  },
  office: {
    section_dna: {
      person_a: {
        nickname: "Alex",
        character_title: "실행형",
        work_style: "빠르게 판단해요.",
        inner_standard: "중심을 잡아요.",
        overall_character: "안정 에너지가 있어요.",
      },
      person_b: {
        nickname: "Jordan",
        character_title: "지원형",
        work_style: "천천히 판단해요.",
        inner_standard: "원칙을 지켜요.",
        overall_character: "분석 에너지가 있어요.",
      },
    },
    section_snapshot: { fit_pct: 55, synergy_pct: 50, risk_pct: 45, one_line_definition: "미니멀 조합" },
    section_mix_fit: {
      person_a_work_style: "Alex 스타일",
      person_b_work_style: "Jordan 스타일",
      communication_fit: "회의 스타일이 꽤 달라요.",
    },
    // section_respect 없음 — 레거시 payload 시뮬레이션
    section_roles: {
      person_a: { nickname: "Alex", weapons: ["협업·실행"], handoff_tasks: [] },
      person_b: { nickname: "Jordan", weapons: ["팀 조율"], handoff_tasks: [] },
      synergy_one_liner: "역할만 명확히 하면 충분히 잘 굴러갑니다.",
    },
    // section_upset 없음
    // section_ideal_roles 없음
    section_warning: {
      conflict_trigger: "역할·책임 경계가 불분명할 때 마찰이 올라갑니다.",
      de_escalation: {
        hashtag: "#시간이지나면풀린다",
        color: "orange",
        title: "즉답 압박이 독",
        detail: "오늘은 여기까지, 내일 다시가 최고의 갈등 해독제입니다.",
      },
    },
  },
  meta: {
    report_schema_version: WORK_REPORT_SCHEMA_VERSION,
    grade: "B",
    grade_reason: "파트너십 등급 B",
    uncertain_items: [],
    fit_pct: 55,
    synergy_pct: 50,
    risk_pct: 45,
    // psych_match, psych_lens, prescription_work 모두 없음
  },
};

export const minimalWorkColleagueReportFixture =
  minimalWorkColleagueReportFixtureRaw as unknown as WorkColleagueReportBody;
