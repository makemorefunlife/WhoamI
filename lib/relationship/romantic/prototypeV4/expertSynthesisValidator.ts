/**
 * Expert Synthesis Validator
 *
 * Verifies that LLM Expert Synthesis outputs are strictly bound by the input contract,
 * contain zero hallucinated Saju facts, cite only provided evidence IDs, contain zero
 * technical Saju jargon in visible prose, and adhere to strict interpretation level rules.
 */

import type {
  ExpertSynthesisInputContract,
  ExpertSynthesisResult,
  ExpertSynthesisValidationIssue,
  ExpertSynthesisValidationResult,
} from "./expertSynthesisTypes";

const TECHNICAL_SAJU_JARGON =
  /(편인|정인|비견|겁재|식신|상관|편재|정재|편관|정관|용신|희신|기신|구신|한신|도화살|역마살|화개살|원진살|귀문관살|천간|일간|일지|월지|년지|시지|십이지지|천간지지|조후)/;

const FORBIDDEN_FATE_OR_DIAGNOSTIC =
  /(반드시\s*(이별|결혼|이혼|파국|성공|실패)|운명적(인|으로)?\s*(헤어|결합|운명)|외도|바람|불륜|임신|출산|로또|파산|사기|성격\s*장애|애착\s*유형|가스라이팅|트라우마)/;

const CONDITIONAL_MARKERS =
  /(가능성|수\s*있|살펴볼|보일\s*수|추정|관찰|여지|있을\s*것|해석될\s*수|경향이\s*있|조심스럽게|볼\s*여지)/;

export function validateExpertSynthesis(
  synthesis: ExpertSynthesisResult | null | undefined,
  input: ExpertSynthesisInputContract,
): ExpertSynthesisValidationResult {
  const issues: ExpertSynthesisValidationIssue[] = [];

  if (!synthesis) {
    return {
      ok: false,
      issues: [
        {
          code: "empty_synthesis",
          severity: "error",
          message: "Expert synthesis output is null or empty.",
        },
      ],
      fallbackRequired: true,
    };
  }

  // 1. Direction and Chapter Match
  if (synthesis.chapterId !== input.chapterId) {
    issues.push({
      code: "chapter_mismatch",
      severity: "error",
      message: `Synthesis chapterId '${synthesis.chapterId}' does not match input '${input.chapterId}'.`,
      field: "chapterId",
    });
  }

  if (synthesis.direction !== input.direction) {
    issues.push({
      code: "direction_mismatch",
      severity: "error",
      message: `Synthesis direction '${synthesis.direction}' does not match input '${input.direction}'.`,
      field: "direction",
    });
  }

  // 2. Evidence ID Integrity
  if (!synthesis.usedEvidenceIds || synthesis.usedEvidenceIds.length === 0) {
    issues.push({
      code: "missing_evidence_ids",
      severity: "error",
      message: "Expert synthesis must cite at least one valid evidence ID.",
      field: "usedEvidenceIds",
    });
  } else {
    const validEvidenceSet = new Set<string>([
      ...input.exactEvidenceIds,
      ...input.supportingEvidence.map((e) => e.evidenceId),
    ]);

    for (const citedId of synthesis.usedEvidenceIds) {
      if (!validEvidenceSet.has(citedId)) {
        issues.push({
          code: "unlisted_evidence_cited",
          severity: "error",
          message: `Cited evidenceId '${citedId}' was not present in the permitted input contract.`,
          field: "usedEvidenceIds",
        });
      }
    }
  }

  // 3. Claim ID Integrity
  if (synthesis.usedClaimIds && synthesis.usedClaimIds.length > 0) {
    const validClaimSet = new Set<string>(
      input.selectedClaims.map((c) => c.claimId),
    );
    for (const claimId of synthesis.usedClaimIds) {
      if (!validClaimSet.has(claimId)) {
        issues.push({
          code: "unlisted_claim_cited",
          severity: "error",
          message: `Cited claimId '${claimId}' was not present in the input claims.`,
          field: "usedClaimIds",
        });
      }
    }
  }

  // 4. Interpretation Level Requirements
  if (synthesis.interpretationType === "expert_synthesis") {
    if (!synthesis.usedEvidenceIds || synthesis.usedEvidenceIds.length < 2) {
      issues.push({
        code: "insufficient_synthesis_evidence",
        severity: "error",
        message:
          "Interpretation level 'expert_synthesis' requires citing at least two independent evidence IDs.",
        field: "usedEvidenceIds",
      });
    }
  }

  const allProse = [
    synthesis.primaryInterpretation,
    synthesis.expertSynthesis,
    synthesis.interactionMechanism,
    synthesis.conditionalNuance ?? "",
    synthesis.alternativeReading ?? "",
  ].join(" ");

  if (synthesis.interpretationType === "conditional_hypothesis") {
    if (!CONDITIONAL_MARKERS.test(allProse)) {
      issues.push({
        code: "missing_conditional_phrasing",
        severity: "error",
        message:
          "Interpretation level 'conditional_hypothesis' must contain conditional phrasing indicating nuance or uncertainty.",
        field: "expertSynthesis",
      });
    }
  }

  if (input.confidence === "low") {
    if (synthesis.interpretationType === "grounded") {
      issues.push({
        code: "low_confidence_overclaim",
        severity: "error",
        message:
          "Low-confidence input cannot produce a 'grounded' definitive synthesis.",
        field: "interpretationType",
      });
    }
  }

  // 5. Technical Saju Jargon Scan in Visible Prose
  const jargonMatch = allProse.match(TECHNICAL_SAJU_JARGON);
  if (jargonMatch) {
    issues.push({
      code: "technical_saju_leakage",
      severity: "error",
      message: `Technical Saju jargon '${jargonMatch[0]}' leaked into visible prose.`,
      field: "expertSynthesis",
    });
  }

  // 6. Forbidden Fate, Diagnosis, and Clinical Terms Scan
  const forbiddenMatch = allProse.match(FORBIDDEN_FATE_OR_DIAGNOSTIC);
  if (forbiddenMatch) {
    issues.push({
      code: "forbidden_fate_or_diagnostic_claims",
      severity: "error",
      message: `Prose contains forbidden deterministic fate or diagnostic phrase: '${forbiddenMatch[0]}'.`,
      field: "expertSynthesis",
    });
  }

  // 7. Forbidden Inferences from Input Contract
  for (const forbidden of input.forbiddenInference) {
    if (forbidden && allProse.includes(forbidden)) {
      issues.push({
        code: "forbidden_inference_violated",
        severity: "error",
        message: `Synthesis violated forbidden inference rule: '${forbidden}'.`,
        field: "expertSynthesis",
      });
    }
  }
  for (const forbiddenExt of input.canonicalMeaning.forbiddenExtensions) {
    if (forbiddenExt && allProse.includes(forbiddenExt)) {
      issues.push({
        code: "forbidden_extension_violated",
        severity: "error",
        message: `Synthesis violated canonical forbidden extension: '${forbiddenExt}'.`,
        field: "expertSynthesis",
      });
    }
  }

  // 8. Text Completeness
  if (!synthesis.primaryInterpretation?.trim() || !synthesis.expertSynthesis?.trim()) {
    issues.push({
      code: "empty_interpretation_text",
      severity: "error",
      message: "Primary interpretation or expert synthesis text is empty.",
      field: "primaryInterpretation",
    });
  }

  const hasError = issues.some((i) => i.severity === "error");

  return {
    ok: !hasError,
    issues,
    fallbackRequired: hasError,
  };
}
