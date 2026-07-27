/**
 * M2 Relationship Snapshot projector.
 * Deterministic canonical projections only; no grade/formula/LLM text.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  formatRomanticBalanceCanonicalLabel,
  readRomanticBalanceCanonicalProjection,
} from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import {
  formatRomanticRecoveryCanonicalLabel,
  readRomanticRecoveryCanonicalProjection,
} from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import {
  formatRomanticReassuranceCanonicalLabel,
  readRomanticReassuranceCanonicalProjection,
} from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import type {
  ConfidenceLevel,
  EvidenceRef,
  RelationshipSnapshotSignalVM,
  RelationshipSnapshotVM,
} from "../romanticExperienceTypes";
import { emptyRelationshipSnapshot } from "./_empty";

export type ProjectRelationshipSnapshotInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  locale?: string;
};

export function projectRelationshipSnapshot(
  input: ProjectRelationshipSnapshotInput,
): RelationshipSnapshotVM {
  const base = emptyRelationshipSnapshot();
  const signals: RelationshipSnapshotSignalVM[] = [];
  const evidence: EvidenceRef[] = [];

  const balance = readRomanticBalanceCanonicalProjection(input.report);
  if (balance) {
    signals.push({
      kind: "defining_dynamic",
      label: "Defining Dynamic",
      summary: formatRomanticBalanceCanonicalLabel(balance, {
        nameA: input.nameA,
        nameB: input.nameB,
        locale: input.locale,
      }),
      sourcePath: "canonical_projections.balance_of_power",
    });
    evidence.push({
      path: "canonical_projections.balance_of_power",
      summary: "typed leadership/receiver balance",
    });
  }

  const reassurance = readRomanticReassuranceCanonicalProjection(input.report);
  if (reassurance) {
    signals.push({
      kind: "stabilizing_resource",
      label: "Stabilizing Resource",
      summary: formatRomanticReassuranceCanonicalLabel(reassurance, {
        nameA: input.nameA,
        nameB: input.nameB,
        locale: input.locale,
      }),
      sourcePath: "canonical_projections.reassurance_signal",
    });
    evidence.push({
      path: "canonical_projections.reassurance_signal",
      summary: "typed reassurance give/need fit",
    });
  }

  const recovery = readRomanticRecoveryCanonicalProjection(input.report);
  if (recovery) {
    signals.push({
      kind: "meaningful_tension",
      label: "Meaningful Tension",
      summary: formatRomanticRecoveryCanonicalLabel(recovery, {
        nameA: input.nameA,
        nameB: input.nameB,
        locale: input.locale,
      }),
      sourcePath: "canonical_projections.recovery_speed",
    });
    evidence.push({
      path: "canonical_projections.recovery_speed",
      summary: "typed recovery pace gap",
    });
  }

  if (signals.length === 0) return base;

  let confidence: ConfidenceLevel = "low";
  if (signals.length >= 3) confidence = "high";
  else if (signals.length >= 2) confidence = "medium";

  return {
    ...base,
    title: "Relationship Snapshot",
    available: true,
    confidence,
    evidence,
    signals,
  };
}
