import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { buildCohabitationKillerRuleCandidates } from "./cohabitationKillerRules";
import {
  extractCohabitationKillerSignals,
  type CohabitationKillerSignals,
} from "./cohabitationKillerSignals";
import type {
  CohabitationKillerQuestion,
  CohabitationKillerQuestionPack,
} from "./cohabitationKillerTypes";
import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { HouseholdPartnershipReport } from "./homeReportTemplate";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./marriageCopy";

const MAX_KILLER_QUESTIONS = 5;

function dedupeByTopic(
  questions: CohabitationKillerQuestion[],
): CohabitationKillerQuestion[] {
  const seen = new Set<string>();
  const out: CohabitationKillerQuestion[] = [];
  for (const item of questions) {
    if (seen.has(item.topic)) continue;
    seen.add(item.topic);
    out.push(item);
  }
  return out;
}

function resolveIntroLine(signals: CohabitationKillerSignals, locale: Locale): string {
  const hasPsych =
    signals.psychPracticality != null ||
    signals.psychSelfControl != null ||
    signals.psychEmpathy != null;

  if (hasPsych) {
    return pick(
      locale,
      "These questions were pulled by reading your Manseryeok (saju) chart together with your 11-axis survey. If you find yourself thinking 'wait, is it just us?', open that section.",
      "아래 질문은 만세력(사주)과 11축 설문을 함께 읽어 뽑았어요. '우리만 그런 거 아니야?'가 나오면 해당 섹션을 펼쳐 보세요.",
    );
  }
  return pick(
    locale,
    "These questions were pulled using Manseryeok (saju) rules. Complete the survey and the questions get sharper, cross-verified against your psychological axes too.",
    "아래 질문은 만세력(사주) 규칙으로 뽑았어요. 설문을 완료하면 심리 축과 교차 검증된 질문이 더 정밀해집니다.",
  );
}

/**
 * 1안 SSOT — 사주 household killer + PersonCore psych 교차 검증 킬러 질문 팩.
 */
export function buildCohabitationKillerQuestions(params: {
  ctx: MarriageRuleContext;
  household: HouseholdPartnershipReport;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): CohabitationKillerQuestionPack {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const signals = extractCohabitationKillerSignals({
    ctx: params.ctx,
    bedroomMatrix: params.household.section_bedroom.matrix,
    psychA: params.psychA,
    psychB: params.psychB,
  });

  const questions = dedupeByTopic(
    buildCohabitationKillerRuleCandidates(signals, locale),
  )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_KILLER_QUESTIONS);

  return {
    intro_line: resolveIntroLine(signals, locale),
    questions,
  };
}
