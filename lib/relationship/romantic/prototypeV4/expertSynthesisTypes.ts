/**
 * Expert Synthesis Input & Output Contracts for Romantic V4
 *
 * Implements a strictly typed, evidence-bound synthesis layer between Story Planner and Narrative Composer.
 */

import type { ProvenanceRef } from "./canonicalStoryPlanTypes";

export type InterpretationType =
  | "grounded"
  | "expert_synthesis"
  | "conditional_hypothesis";

export type ExpertSynthesisConfidence = "high" | "medium" | "low";

export type SynthesisDirection = "a_to_b" | "b_to_a" | "mutual";

export type SynthesisClaimInput = {
  claimId: string;
  claimBoundary: string;
  statement: string;
  evidenceIds: string[];
  confidence: "high" | "medium" | "low" | "deterministic" | "tentative";
};

export type SynthesisEvidenceInput = {
  evidenceId: string;
  signalType: string;
  exactIdentity: string;
  owner: "person_a" | "person_b" | "pair";
  role: "primary" | "supporting" | "contextual";
  description: string;
};

export type SynthesisCanonicalMeaningInput = {
  core: string[];
  relationalPotential: string[];
  cautions: string[];
  forbiddenExtensions: string[];
};

export type SynthesisRomanticLensInput = {
  chapterRelevance: string;
  romanticMeaning: string;
  allowedScenes: string[];
  allowedInference: string[];
  forbiddenInference: string[];
};

export type ExpertSynthesisInputContract = {
  chapterId: string;
  chapterQuestion: string;
  direction: SynthesisDirection;
  subjectNames: { a: string; b: string };
  selectedClaims: SynthesisClaimInput[];
  exactEvidenceIds: string[];
  canonicalMeaning: SynthesisCanonicalMeaningInput;
  romanticLensMeaning: SynthesisRomanticLensInput;
  dayMasterEvidence?: {
    person: "a" | "b";
    stem: string;
    element: string;
    nature: string;
  };
  dayBranchEvidence?: {
    person: "a" | "b";
    branch: string;
    tenGod: string;
  };
  exactTenGods: string[];
  spousePalaceEvidence?: {
    person: "a" | "b";
    tenGod: string;
    preferenceTrait: string;
    repairNeed: string;
    recognitionNeed: string;
  };
  fiveElementsInteraction?: {
    flow: string;
    nature: string;
  };
  pairInteractionEvidence?: {
    stemCombine?: string | null;
    sixCombine?: string | null;
    wonjinGuimun?: string | null;
    temperatureDynamic?: string;
  };
  supportingEvidence: SynthesisEvidenceInput[];
  contradictingEvidence: SynthesisEvidenceInput[];
  confidence: ExpertSynthesisConfidence;
  allowedInference: string[];
  forbiddenInference: string[];
  alreadyUsedClaimsFromAdjacentChapters: string[];
  narrativeBudget: {
    maxSentences: number;
    maxCharacters: number;
  };
};

export type ExpertSynthesisResult = {
  synthesisId: string;
  chapterId: string;
  direction: SynthesisDirection;

  primaryInterpretation: string;
  expertSynthesis: string;
  interactionMechanism: string;
  conditionalNuance?: string;
  alternativeReading?: string;

  usedClaimIds: string[];
  usedEvidenceIds: string[];
  contradictingEvidenceIds: string[];

  interpretationType: InterpretationType;

  confidence: ExpertSynthesisConfidence;
  missingEvidence: string[];
  forbiddenClaimsAvoided: string[];
};

export type ExpertSynthesisValidationIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
  field?: string;
};

export type ExpertSynthesisValidationResult = {
  ok: boolean;
  issues: ExpertSynthesisValidationIssue[];
  fallbackRequired: boolean;
};
