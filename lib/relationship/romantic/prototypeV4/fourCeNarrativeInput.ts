import type {
  DomainPairLensOutput,
  PairContextEngineOutput,
} from "../../../personCore/pairContextEngine/types";
import type { PersonalContextEngineOutput } from "../../../personCore/personalContextEngine/types";
import type { RomanticContextInput } from "../romanticContextInput";
import type { RomanticSajuDeepReport } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import type { PersonalRelationshipCe } from "./personalRelationshipCe";

type Report = RomanticSajuDeepReport["report"];

type MaybeUnavailable<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; reason: string };

export type FourCeNarrativeSiblingInput = {
  individualCeA: {
    source: "runPersonalContextEngine(individual_saju_json(A))";
    output: MaybeUnavailable<PersonalContextEngineOutput>;
    relationshipCe?: PersonalRelationshipCe | null;
  };
  individualCeB: {
    source: "runPersonalContextEngine(individual_saju_json(B))";
    output: MaybeUnavailable<PersonalContextEngineOutput>;
    relationshipCe?: PersonalRelationshipCe | null;
  };
  pairCeCommon: {
    source: "runPairContextEngine+applyRomanticPairLens";
    output: MaybeUnavailable<{
      pairCe: PairContextEngineOutput;
      romanticPairLens: DomainPairLensOutput;
    }>;
  };
  romanticCeSpecific: {
    // Consolidation Batch C: romantic_context_input was V1-routed and has been
    // removed from the V4 pipeline — always null now (see fourCeNarrativeInput.ts
    // for the full explanation). Availability is judged on canonical_projections
    // alone (real cross-chart + pair_ce_bonding computation) instead.
    source: "canonical_projections";
    output: MaybeUnavailable<{
      romanticContextInput: RomanticContextInput | null;
      canonicalProjections: Report["canonical_projections"];
    }>;
  };
};

export type RomanticNarrativeInputContract = {
  locale: "ko-KR" | "en-US";
  names: { a: string; b: string };
  siblingInputs: FourCeNarrativeSiblingInput;
  evidenceIndex: Array<{ id: string; path: string; summary: string }>;
};

export function buildRomanticNarrativeInputContract(params: {
  report: Report;
  locale: "ko-KR" | "en-US";
  nameA: string;
  nameB: string;
  personalCeA: PersonalContextEngineOutput | null;
  personalCeB: PersonalContextEngineOutput | null;
  personalRelationshipCeA?: PersonalRelationshipCe | null;
  personalRelationshipCeB?: PersonalRelationshipCe | null;
  pairCe: PairContextEngineOutput | null;
  romanticPairLens: DomainPairLensOutput | null;
}): RomanticNarrativeInputContract {
  const romanticContextInput = params.report.romantic_context_input ?? null;
  const canonicalProjections = params.report.canonical_projections ?? null;
  const siblingInputs: FourCeNarrativeSiblingInput = {
    individualCeA: {
      source: "runPersonalContextEngine(individual_saju_json(A))",
      output: params.personalCeA
        ? { status: "available", value: params.personalCeA }
        : {
            status: "unavailable",
            reason: "missing personal_ce_v1 output for A",
          },
      relationshipCe: params.personalRelationshipCeA ?? null,
    },
    individualCeB: {
      source: "runPersonalContextEngine(individual_saju_json(B))",
      output: params.personalCeB
        ? { status: "available", value: params.personalCeB }
        : {
            status: "unavailable",
            reason: "missing personal_ce_v1 output for B",
          },
      relationshipCe: params.personalRelationshipCeB ?? null,
    },
    pairCeCommon: {
      source: "runPairContextEngine+applyRomanticPairLens",
      output:
        params.pairCe && params.romanticPairLens
          ? {
              status: "available",
              value: {
                pairCe: params.pairCe,
                romanticPairLens: params.romanticPairLens,
              },
            }
          : {
              status: "unavailable",
              reason: "pair CE output unavailable",
            },
    },
    romanticCeSpecific: {
      // Consolidation Batch C: romantic_context_input was V1-routed
      // (prepareRomanticSajuDeepRun -> buildRomanticRulesBundle) and has been
      // removed from the V4 pipeline entirely — it is always null now, by
      // design, not a missing-data defect. Availability is judged on
      // canonical_projections alone (real cross-chart + pair_ce_bonding
      // computation), which is what buildActualFourCeContract.ts actually
      // populates today.
      source: "canonical_projections",
      output: canonicalProjections
        ? {
            status: "available",
            value: {
              romanticContextInput,
              canonicalProjections,
            },
          }
        : {
            status: "unavailable",
            reason: "missing canonical_projections",
          },
    },
  };

  const evidenceIndex: RomanticNarrativeInputContract["evidenceIndex"] = [
    {
      id: "ce.individual.a",
      path: "personal_ce_v1(A) from individual_saju_json(A)",
      summary: "A individual CE structured interpretation packets",
    },
    {
      id: "ce.individual.b",
      path: "personal_ce_v1(B) from individual_saju_json(B)",
      summary: "B individual CE structured interpretation packets",
    },
    {
      id: "ce.pair.common",
      path: "runPairContextEngine output (shared) + romantic lens",
      summary: "Shared Pair CE common relationship interpretation",
    },
    {
      id: "ce.romantic.specific",
      path: "romantic_context_input + canonical_projections",
      summary: "Romantic CE romantic-specific interpretation",
    },
  ];

  return {
    locale: params.locale,
    names: { a: params.nameA, b: params.nameB },
    siblingInputs,
    evidenceIndex,
  };
}

export function explainFourCeInfluence(input: RomanticNarrativeInputContract): Array<{
  evidenceId: string;
  impact: string;
}> {
  const hasA = input.siblingInputs.individualCeA.output.status === "available";
  const hasB = input.siblingInputs.individualCeB.output.status === "available";
  const hasPair = input.siblingInputs.pairCeCommon.output.status === "available";
  const hasRomantic =
    input.siblingInputs.romanticCeSpecific.output.status === "available";
  return [
    {
      evidenceId: "ce.individual.a",
      impact: hasA
        ? "A의 일상 애정표현/요청 톤 문장 선택에 반영"
        : "A individual CE 부재로 A 고유 톤 축약",
    },
    {
      evidenceId: "ce.individual.b",
      impact: hasB
        ? "B의 애정표현/정리 방식 문장 선택에 반영"
        : "B individual CE 부재로 B 고유 톤 축약",
    },
    {
      evidenceId: "ce.pair.common",
      impact: hasPair
        ? "Chapter 3의 pair-level capability 메커니즘 설명에 반영"
        : "pair CE 부재로 상호작용 메커니즘 약화",
    },
    {
      evidenceId: "ce.romantic.specific",
      impact: hasRomantic
        ? "Flow/Conflict/Repair의 구조적 해석(속도·회복·안심) 근거에 반영"
        : "romantic CE 부재로 구조 해석 불가",
    },
  ];
}
