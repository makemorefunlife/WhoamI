import { formatEssenceAnalysisForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";

import { runIntegratedPremiumLlm } from "@/lib/report/runIntegratedPremiumLlm";
import { runDeepEssenceStructuredLlm } from "@/lib/report/runDeepEssenceStructuredLlm";

import { buildBirthEnergyContext } from "@/lib/v1/slim/buildBirthEnergyContext";

import { buildSurveyAnalysisForSlimV1 } from "@/lib/v1/slim/surveyAnalysis";

import { toV1SajuApiPayload } from "@/lib/saju/toApiPayload";

import type { SlimV1ReportResult } from "@/lib/v1/slim/types";

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";

import { calculateEssenceSelfLite } from "@/lib/v2/saju/essenceLite";

import { scoreSurveyAnswers } from "@/lib/v2/survey/scorer";

import { buildNeutralV2Profile } from "@/lib/v2/survey/neutralProfile";

import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";

import {

  buildPart01IdentityEvidencePacketFromBundle,

  type Part01IdentityEvidencePacket,

} from "@/lib/v1/slim/part01IdentityEvidence";

import { logServerError } from "@/lib/security/safeLog";

import type {

  CurrentSelfProfile,

  PrimaryAxesScores,

  SurveyAnswersInput,

} from "@/lib/v2/survey/types";
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";



export type SlimIntegratedRunInput = {

  birthDate: string;

  birthTime?: string | null;

  birthTimeUnknown?: boolean;

  birthPlace?: string | null;

  surveyAnswers?: SurveyAnswersInput | null;

  currentSelfProfile?: CurrentSelfProfile | null;

  locale?: Locale | string;

  /** Optional — used only to build Part01IdentityEvidencePacket provenance. */
  reportId?: string;

};



const DEFAULT_AXIS_SCORE = 50;



function fallbackAxisScores(): PrimaryAxesScores {

  return Object.fromEntries(

    PRIMARY_AXIS_KEYS.map((k) => [k, DEFAULT_AXIS_SCORE]),

  ) as PrimaryAxesScores;

}



/**

 * Slim V1 — 나에 대한 심화 통합 리포트

 * 1) v2 설문 → Human Framework (레이더 "현재" 점수는 여기서 결정론적으로 나옴)

 * 2) Essence 분석(신살 포함)

 * 3) 출생 에너지(점성만 — 관계 맥락 제외)

 * 4) 위 세 입력으로 (a) 기존 산문 리포트, (b) Part 01~05+부록 구조화 리포트를
 *    병렬 생성한다 — 둘 다 en-US·ko-KR 모두 지원. 구조화 생성이 실패하면
 *    structured가 null로 남아 프론트에서 자동으로 기존 산문 뷰로 폴백한다.

 */

export async function runSlimIntegratedReport(

  input: SlimIntegratedRunInput,

): Promise<SlimV1ReportResult> {

  const locale = normalizeLocale(input.locale);

  const bundle = calculateSajuBundle({

    birthDate: input.birthDate,

    birthTime: input.birthTime,

    birthTimeUnknown: input.birthTimeUnknown,

  });



  const v2Profile =

    input.currentSelfProfile ??

    (input.surveyAnswers ? scoreSurveyAnswers(input.surveyAnswers) : null);



  // Batch 2 — additive only: builds Part01IdentityEvidencePacket for future
  // Identity Lens consumption. Not read by any prompt/UI yet; a failure here
  // must never break the existing report pipeline below.
  let part01IdentityEvidence: Part01IdentityEvidencePacket | null = null;
  try {
    const essenceSelf = calculateEssenceSelfLite({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthTimeUnknown: input.birthTimeUnknown,
    });
    part01IdentityEvidence = buildPart01IdentityEvidencePacketFromBundle({
      reportId: input.reportId ?? "",
      birthDate: input.birthDate,
      birthTime: input.birthTime ?? null,
      birthTimeUnknown: input.birthTimeUnknown === true,
      bundle,
      currentPrimary: v2Profile?.primary_axes ?? fallbackAxisScores(),
      currentSecondary: v2Profile?.secondary_axes ?? buildNeutralV2Profile().secondary_axes,
      innatePrimary: essenceSelf.primary_axes,
    });
  } catch (e) {
    logServerError("slim/part01_identity_evidence", e, "part01_evidence_failed");
  }



  const survey = buildSurveyAnalysisForSlimV1(v2Profile);



  const essenceAnalysisSummary = formatEssenceAnalysisForIntegrated(

    toV1SajuApiPayload(bundle),

  );



  const birthEnergy = await buildBirthEnergyContext({

    birthDate: input.birthDate,

    birthTime: input.birthTime,

    birthTimeUnknown: input.birthTimeUnknown,

    birthPlace: input.birthPlace,

    locale,

  });



  const radarCurrent = v2Profile?.primary_axes ?? fallbackAxisScores();



  const structuredPromise = runDeepEssenceStructuredLlm({

    surveyAnalysis: survey.text,

    essenceAnalysisSummary,

    astrologyInterpretation: birthEnergy.astrology,

    currentAxisScores: radarCurrent,

    locale,

    part01Evidence: part01IdentityEvidence,

  });



  const [integrated, structuredResult] = await Promise.all([

    runIntegratedPremiumLlm({

      surveyAnalysis: survey.text,

      sajuSummary: essenceAnalysisSummary,

      astrologyInterpretation: birthEnergy.astrology,

      locale,

    }),

    structuredPromise,

  ]);



  const shinsalNames = bundle.shinsals.map((s) => s.name_ko);



  return {

    source: "v1/slim-integrated",

    prompt: "lib/prompts/integratedPremiumReport.ts + lib/prompts/deepEssenceStructured.ts",

    report: integrated.report,

    llm_source: integrated.source,

    phase1_chars: integrated.phase1_chars,

    phase2_chars: integrated.phase2_chars,

    structured: structuredResult.structured,

    structured_source: structuredResult.source,

    radar_current: v2Profile?.primary_axes ?? null,

    part01_identity_evidence: part01IdentityEvidence,

    inputs_preview: {

      survey_chars: survey.text.length,

      essence_chars: essenceAnalysisSummary.length,

      birth_energy_chars: birthEnergy.astrology.length,

    },

    inputs_meta: {

      survey_source: survey.source,

      essence_analysis: {

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

      essenceAnalysisSummary,

      astrologyInterpretation: birthEnergy.astrology,

    },

  };

}
