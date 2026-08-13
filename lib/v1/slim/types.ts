import type { DeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";
import type { Part01IdentityEvidencePacket } from "@/lib/v1/slim/part01IdentityEvidence";

export type SlimV1ReportResult = {
  source: "v1/slim-integrated";
  prompt: string;
  report: string;
  llm_source: "llm" | "fallback";
  phase1_chars: number;
  phase2_chars: number;
  /**
   * Part 01~05 + 부록 구조화 결과. null이면 프론트는 기존 산문(report)
   * 렌더링으로 폴백한다. en-US · ko-KR 둘 다 생성.
   * 스키마: lib/report/deepEssenceStructuredSchema.ts
   */
  structured: DeepEssenceStructuredReport | null;
  structured_source: "llm" | "fallback";
  /** 레이더 차트 "현재 상태" — 설문 채점 결과, LLM을 거치지 않은 결정론적 값 */
  radar_current: PrimaryAxesScores | null;
  /**
   * Batch 2 — Part 01 Identity Lens 결과. 아직 어떤 prompt/UI도 소비하지
   * 않는다(additive only). CE 배선 실패 시 null.
   */
  part01_identity_evidence?: Part01IdentityEvidencePacket | null;
  inputs_preview: {
    survey_chars: number;
    essence_chars: number;
    birth_energy_chars: number;
  };
  inputs_meta: {
    survey_source: "v2_survey_10q" | "none_fallback";
    essence_analysis: {
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
    essenceAnalysisSummary: string;
    astrologyInterpretation: string;
  };
};

export type EssenceDeepPreviewResponse = {
  ok: true;
  slim_v1: SlimV1ReportResult;
};
