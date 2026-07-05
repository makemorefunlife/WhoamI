export type LiteSection = { title: string; body: string };

export type CurrentSelfLiteReport = {
  report_type: "current_self_lite";
  language: string;
  one_line_summary: string;
  current_pattern: LiteSection;
  key_strength: LiteSection;
  growth_edge: LiteSection;
  decision_hint: LiteSection;
  small_action: LiteSection;
  evidence_notes?: {
    primary_signals_used?: string[];
    confidence_level?: "low" | "medium" | "high";
  };
};

export type InnateSelfLiteReport = {
  report_type: "innate_self_lite";
  language: string;
  one_line_summary: string;
  core_personality_insight: LiteSection;
  relationship_tendency_insight: LiteSection;
  environment_fit_hint?: LiteSection;
  evidence_notes?: {
    primary_signals_used?: string[];
    confidence_level?: "low" | "medium" | "high";
  };
};
