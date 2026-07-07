export type SlimV1ReportResult = {
  source: "v1/slim-integrated";
  prompt: string;
  report: string;
  llm_source: "llm" | "fallback";
  phase1_chars: number;
  phase2_chars: number;
  inputs_preview: {
    survey_chars: number;
    innate_chars: number;
    birth_energy_chars: number;
  };
  inputs_meta: {
    survey_source: "v2_survey_10q" | "none_fallback";
    innate_analysis: {
      includes_shinsal: boolean;
      shinsal_count: number;
      shinsal_names: string[];
    };
    birth_energy: {
      astrology_included: boolean;
      birth_place_used: string | null;
      coord_source: string;
      relationship_excluded: string;
    };
    dropped: string[];
  };
  inputs: {
    surveyAnalysis: string;
    innateAnalysisSummary: string;
    astrologyInterpretation: string;
  };
};

export type InnateDeepPreviewResponse = {
  ok: true;
  slim_v1: SlimV1ReportResult;
};
