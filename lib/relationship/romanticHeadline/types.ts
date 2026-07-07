/** Headline Engine — selector 입력/출력 (계산은 기존 saju·pair 엔진 결과 재사용) */

export type RomanticInsightSource =
  | "pair_cross"
  | "pair_day_stem"
  | "pair_element"
  | "person_relation"
  | "metaphor_combo"
  | "strength_complement";

export type RomanticScreenHint =
  | "opening"
  | "nature"
  | "bond"
  | "hidden"
  | "conflict"
  | "action";

export type RomanticInsightCandidate = {
  id: string;
  source: RomanticInsightSource;
  ruleType?: string;
  /** ref_relation_rules.priority_score 등 기존 rule 값 */
  priority: number;
  impact: number;
  surprise: number;
  /** selector 정렬용 (priority·impact·surprise 가중) */
  score: number;
  headline: string;
  body: string;
  screenHint: RomanticScreenHint;
};

export type RomanticOpeningSelection = {
  relationship_name: string;
  one_line_summary: string;
  grade: "A" | "B" | "C" | "D";
  grade_reason: string;
  event_scores?: import("@/lib/relationship/pairEventScores").RelationshipEventScores;
  selected_insight_id: string;
  ranked_insights: RomanticInsightCandidate[];
};
