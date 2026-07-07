import { formatInnateAnalysisForIntegrated } from "@/lib/report/formatInnateAnalysisForIntegrated";

import { runIntegratedPremiumLlm } from "@/lib/report/runIntegratedPremiumLlm";

import { buildBirthEnergyContext } from "@/lib/v1/slim/buildBirthEnergyContext";

import { buildSurveyAnalysisForSlimV1 } from "@/lib/v1/slim/surveyAnalysis";

import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

import type { SlimV1ReportResult } from "@/lib/v1/slim/types";

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";

import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";

import type {

  CurrentSelfProfile,

  SurveyAnswersInput,

} from "@/lib/v2/survey/types";



export type SlimIntegratedRunInput = {

  birthDate: string;

  birthTime?: string | null;

  birthTimeUnknown?: boolean;

  birthPlace?: string | null;

  surveyAnswers?: SurveyAnswersInput | null;

  currentSelfProfile?: CurrentSelfProfile | null;

};



/**

 * Slim V1 — 나에 대한 심화 통합 리포트

 * 1) v2 설문 → Human Framework

 * 2) 기질 분석(신살 포함)

 * 3) 출생 에너지(점성만 — 관계 맥락 제외)

 */

export async function runSlimIntegratedReport(

  input: SlimIntegratedRunInput,

): Promise<SlimV1ReportResult> {

  const bundle = calculateSajuBundle({

    birthDate: input.birthDate,

    birthTime: input.birthTime,

    birthTimeUnknown: input.birthTimeUnknown,

  });



  const v2Profile =

    input.currentSelfProfile ??

    (input.surveyAnswers ? scoreSurveyAnswers(input.surveyAnswers) : null);



  const survey = buildSurveyAnalysisForSlimV1(v2Profile);



  const innateAnalysisSummary = formatInnateAnalysisForIntegrated(

    toV1SajuApiPayload(bundle),

  );



  const birthEnergy = await buildBirthEnergyContext({

    birthDate: input.birthDate,

    birthTime: input.birthTime,

    birthTimeUnknown: input.birthTimeUnknown,

    birthPlace: input.birthPlace,

  });



  const integrated = await runIntegratedPremiumLlm({

    surveyAnalysis: survey.text,

    sajuSummary: innateAnalysisSummary,

    astrologyInterpretation: birthEnergy.astrology,

  });



  const shinsalNames = bundle.shinsals.map((s) => s.name_ko);



  return {

    source: "v1/slim-integrated",

    prompt: "lib/prompts/integratedPremiumReport.ts",

    report: integrated.report,

    llm_source: integrated.source,

    phase1_chars: integrated.phase1_chars,

    phase2_chars: integrated.phase2_chars,

    inputs_preview: {

      survey_chars: survey.text.length,

      innate_chars: innateAnalysisSummary.length,

      birth_energy_chars: birthEnergy.astrology.length,

    },

    inputs_meta: {

      survey_source: survey.source,

      innate_analysis: {

        includes_shinsal: shinsalNames.length > 0,

        shinsal_count: shinsalNames.length,

        shinsal_names: shinsalNames,

      },

      birth_energy: {

        astrology_included: birthEnergy.astrology.length > 20,

        birth_place_used: birthEnergy.birth_place_used,

        coord_source: birthEnergy.coord_source,

        relationship_excluded:

          "관계 분석은 별도 관계 리포트에서만 제공",

      },

      dropped: [

        "v2 deep pipeline (03B/03C/03D)",

        "관계 맥락 (relationship/generate)",

        "레거시 설문 (미사용)",

      ],

    },

    inputs: {

      surveyAnalysis: survey.text,

      innateAnalysisSummary,

      astrologyInterpretation: birthEnergy.astrology,

    },

  };

}


