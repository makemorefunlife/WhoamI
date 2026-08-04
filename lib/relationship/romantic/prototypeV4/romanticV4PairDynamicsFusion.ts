/**
 * Romantic V4 — pair-dynamics Gold Logic (balance of power, recovery-speed
 * gap, expression-speed direction, reassurance signals, residual, and
 * unconscious role play), reconnected to real A/B inputs.
 *
 * Reuses the exact pure resolvers V1 already uses — collectRomanticDynamicsTypedSnapshot
 * (romanticContextInput.ts) and the six *Canonical.ts wrap/inject modules
 * (romanticBalanceOfPowerCanonical.ts, romanticRecoverySpeedCanonical.ts,
 * romanticExpressionSpeedCanonical.ts, romanticReassuranceCanonical.ts,
 * romanticResidualCanonical.ts, romanticRolePlayCanonical.ts) — no new
 * calculation logic. Does not call prepareRomanticSajuDeepRun and does not
 * read romanticExperienceCompleteFixture.
 *
 * Safety property (verified, not re-implemented): every one of these
 * resolvers already degrades to its neutral band ("balanced" / "peer") when
 * a CurrentSelfProfile is null, and preserves the real side's own score when
 * only one profile is present — see romanticPairDynamics.ts's axisScore()
 * null-propagation. So "synthetic-neutral survey values cannot activate
 * strong behavioral claims" holds by passing the real profileA/profileB
 * straight through (null when missing) — no synthetic-50 fill needed here,
 * unlike romanticV4SurveyEvidence.ts/romanticV4ComparisonFusion.ts (whose
 * underlying resolvers have no such built-in null-safety).
 */
import type { CurrentSelfProfile } from "@/lib/v2/survey/types";
import type { RomanticSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { ChartContext, SajuPillars } from "@/lib/saju/chartContext";
import { analyzePairSaju } from "@/lib/saju/pairChartAnalysis";
import {
  collectRomanticDynamicsTypedSnapshot,
  type RomanticDynamicsTypedSnapshot,
} from "@/lib/relationship/romantic/romanticContextInput";
import { resolveExpressionSpeedDirection } from "@/lib/relationship/romanticRules/relationshipDynamics";
import {
  balanceOfPowerValueFromDynamicsSnapshot,
  buildRomanticBalanceOfPowerCanonical,
  type RomanticBalanceOfPowerValue,
} from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import {
  recoverySpeedValueFromDynamicsSnapshot,
  buildRomanticRecoverySpeedCanonical,
  type RomanticRecoverySpeedValue,
} from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import {
  expressionSpeedValueFromFinalized,
  buildRomanticExpressionSpeedCanonical,
  type RomanticExpressionSpeedValue,
} from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import {
  reassuranceValueFromDynamicsSnapshot,
  buildRomanticReassuranceCanonical,
  type RomanticReassuranceValue,
} from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import {
  residualValueFromDynamicsSnapshot,
  buildRomanticResidualCanonical,
  type RomanticResidualValue,
} from "@/lib/relationship/romantic/romanticResidualCanonical";
import {
  rolePlayValueFromDynamicsSnapshot,
  buildRomanticRolePlayCanonical,
  type RomanticRolePlayValue,
} from "@/lib/relationship/romantic/romanticRolePlayCanonical";
import {
  computeSurveyPairEvidence,
  type SurveyDisclosureCode,
  type SurveyPairEvidenceStatus,
} from "./romanticV4SurveyEvidence";

export type RomanticV4PairDynamicsProjections = {
  balance_of_power: RomanticBalanceOfPowerValue;
  recovery_speed: RomanticRecoverySpeedValue;
  expression_speed: RomanticExpressionSpeedValue;
  reassurance_signal: RomanticReassuranceValue;
  residual: RomanticResidualValue;
  unconscious_role_play: RomanticRolePlayValue;
};

export type RomanticV4PairDynamicsResult = {
  projections: RomanticV4PairDynamicsProjections;
  /** Survey-dependent items only (balance/recovery/expression_speed/reassurance need_/role_play primary_frame) — residual and role_play's saju_frame are Saju-only and unaffected. */
  evidenceStatus: SurveyPairEvidenceStatus;
  disclosureCode: SurveyDisclosureCode;
  dayStemInteraction: string;
  snapshot: RomanticDynamicsTypedSnapshot;
};

export type RomanticV4PairDynamicsInput = {
  profileA: CurrentSelfProfile | null;
  profileB: CurrentSelfProfile | null;
  romanticSignalsA: RomanticSajuSignals;
  romanticSignalsB: RomanticSajuSignals;
  chartA: ChartContext;
  chartB: ChartContext;
  sajuA: SajuPillars;
  sajuB: SajuPillars;
};

export function buildRomanticV4PairDynamicsProjections(
  params: RomanticV4PairDynamicsInput,
): RomanticV4PairDynamicsResult {
  const { evidenceStatus, disclosureCode } = computeSurveyPairEvidence(
    params.profileA,
    params.profileB,
  );

  const pairAnalysis = analyzePairSaju(params.sajuA, params.sajuB, {
    chartA: params.chartA,
    chartB: params.chartB,
  });

  const snapshot = collectRomanticDynamicsTypedSnapshot({
    profileA: params.profileA,
    profileB: params.profileB,
    romanticA: params.romanticSignalsA,
    romanticB: params.romanticSignalsB,
    chartA: params.chartA,
    chartB: params.chartB,
    dayStemInteraction: pairAnalysis.dayStemInteraction,
    dayBranchCrossHits: pairAnalysis.dayBranchCrossHits,
  });

  const expressionDirection = resolveExpressionSpeedDirection(
    params.profileA,
    params.profileB,
  );

  const projections: RomanticV4PairDynamicsProjections = {
    balance_of_power: buildRomanticBalanceOfPowerCanonical(
      balanceOfPowerValueFromDynamicsSnapshot(snapshot),
    )!.value,
    recovery_speed: buildRomanticRecoverySpeedCanonical(
      recoverySpeedValueFromDynamicsSnapshot(snapshot),
    )!.value,
    expression_speed: buildRomanticExpressionSpeedCanonical(
      expressionSpeedValueFromFinalized({ direction: expressionDirection }),
    )!.value,
    reassurance_signal: buildRomanticReassuranceCanonical(
      reassuranceValueFromDynamicsSnapshot(snapshot),
    )!.value,
    residual: buildRomanticResidualCanonical(
      residualValueFromDynamicsSnapshot(snapshot),
    )!.value,
    unconscious_role_play: buildRomanticRolePlayCanonical(
      rolePlayValueFromDynamicsSnapshot(snapshot),
    )!.value,
  };

  return {
    projections,
    evidenceStatus,
    disclosureCode,
    dayStemInteraction: pairAnalysis.dayStemInteraction,
    snapshot,
  };
}
