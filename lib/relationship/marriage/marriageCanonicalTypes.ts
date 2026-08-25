import type { Locale } from "@/lib/i18n/locale";

/**
 * Marriage V2 Canonical SSOT & Household Operating System Types
 */

export type RoleActor = "a" | "b" | "shared" | "none";

/** 4.1 Household PM / Mental Load Meaning */
export type HouseholdPmType =
  | "HOUSEHOLD_PM"
  | "SHARED_PM"
  | "EXECUTOR_HEAVY"
  | "MANAGEMENT_GAP"
  | "OVERLOAD_RISK";

export type HouseholdPmResult = {
  pmType: HouseholdPmType;
  primaryManager: RoleActor;
  finder: RoleActor;
  planner: RoleActor;
  tracker: RoleActor;
  mentalLoadGiver: RoleActor;
  mentalLoadReceiver: RoleActor;
  narrative: string;
};

/** 4.2 Planner vs Executor Meaning */
export type OperatingStyleRole = "PLANNER" | "EXECUTOR" | "PLANNER_EXECUTOR" | "RESPONDER";

export type PlannerExecutorResult = {
  roleA: OperatingStyleRole;
  roleB: OperatingStyleRole;
  shiftNote: string; // Dynamic role shift note when A & B interact
  alignmentType: "complementary" | "dual_planner_tension" | "dual_executor_gap" | "flexible";
};

/** 4.3 Decision Power Map Domain */
export type DecisionDomain = "money" | "home" | "career" | "family" | "daily_life" | "parenting" | "large_purchase";

export type DomainPowerStage = {
  domain: DecisionDomain;
  domainLabel: string;
  proposer: RoleActor;
  reviewer: RoleActor;
  decider: RoleActor;
  executor: RoleActor;
  meaning: string;
};

export type DecisionPowerMapResult = {
  domains: DomainPowerStage[];
  overallLeader: RoleActor;
  balancingNote: string;
};

/** 4.4 Crisis Role Meaning */
export type CrisisRoleType =
  | "PROBLEM_SOLVER"
  | "EMOTIONAL_ANCHOR"
  | "STABILIZER"
  | "COORDINATOR"
  | "AVOIDANT_RISK";

export type CrisisRoleResult = {
  roleA: CrisisRoleType;
  roleB: CrisisRoleType;
  practicalLead: RoleActor;
  emotionalAnchor: RoleActor;
  synergyType: "perfect_complement" | "dual_practical" | "dual_emotional" | "avoidant_warning";
  narrative: string;
};

/** 4.5 Career x Home Balance Meaning */
export type CareerHomeResult = {
  careerPriorityA: "high" | "moderate" | "home_focused";
  careerPriorityB: "high" | "moderate" | "home_focused";
  supportCapacityA: "high" | "moderate" | "constrained";
  supportCapacityB: "high" | "moderate" | "constrained";
  loadTransferRisk: "high" | "moderate" | "low";
  narrative: string;
};

/** 4.6 Long-Term Compounding Meaning */
export type CompoundingItem = {
  title: string;
  body: string;
  evidenceIds: string[];
};

export type LongTermCompoundingResult = {
  assets: CompoundingItem[];
  liabilities: CompoundingItem[];
  compoundingSummary: string;
};

/** 4.7 Life Partnership Verdict */
export type LifePartnershipVerdictResult = {
  lifeSyncPct: number;
  operationSyncPct: number;
  emotionalSyncPct: number;
  longTermSynergyPct: number;
  oneLineVerdict: string;
  narrative: string;
};

/** Discrepancy Evidence Trace (CE vs 11-Axis vs Pair CE) */
export type DiscrepancyTrace = {
  domain: string;
  innateTendency: string; // SSOT / Saju / Personal CE
  currentBehavior: string; // 11-Axis Psych
  pairDynamicShift: string; // Pair CE
  summaryDiscrepancy: string;
};

/** Synthesis Result Item (A + B -> C) */
export type SynthesisCandidate = {
  synthesisKey: string;
  title: string;
  body: string;
  inputSignals: string[];
};

/** Candidate Contract Item */
export type CandidateContractItem = {
  id: string;
  kind: "FACT_CLAIM" | "PAIR_MEANING" | "INSIGHT_CANDIDATE" | "ACTION_CANDIDATE" | "SYNTHESIS_CANDIDATE";
  title: string;
  body: string;
  evidenceIds: string[];
};

import type { Marriage11AxisBundle } from "./marriage11AxisInsights";
import type { MarriageConflict4StageBundle } from "./marriageConflict4Stage";
import type { MarriageLoveDeliveryBundle } from "./marriageLoveDeliveryMatch";
import type { MarriageExpectationsAndNeedsBundle } from "./marriageExpectationsAndNeeds";
import type { MarriageEmergencySosBundle } from "./marriageEmergencySosCombined";
import type { MarriageInLawBoundaryBundle } from "./marriageInLawBoundary";
import type { MarriageLifeStageBundle } from "./marriageLifeStageTransition";
import type { MarriageBurnoutBundle } from "./marriageCoupleBurnout";
import type { MarriageCareerHomeBundle } from "./marriageCareerHomeTransition";
import type { MarriageEconomicPartnershipBundle } from "./marriageEconomicPartnership";
import type { MarriageChapter01Bundle } from "./marriageChapter01Intelligence";
import type { MarriageChapter03Intelligence } from "./marriageChapter03Intelligence";
import type { MarriageChapter04Intelligence } from "./marriageChapter04Intelligence";

/** Comprehensive Marriage Canonical Bundle */
export type MarriageCanonicalBundle = {
  chapter01Intelligence: MarriageChapter01Bundle;
  chapter03Intelligence: MarriageChapter03Intelligence;
  chapter04Intelligence?: MarriageChapter04Intelligence;
  chapter05Intelligence?: import("./marriageChapter05Intelligence").MarriageChapter05Intelligence;
  householdPm: HouseholdPmResult;
  plannerExecutor: PlannerExecutorResult;
  decisionPowerMap: DecisionPowerMapResult;
  crisisRole: CrisisRoleResult;
  careerHome: CareerHomeResult;
  longTermCompounding: LongTermCompoundingResult;
  lifePartnershipVerdict: LifePartnershipVerdictResult;
  discrepancies: DiscrepancyTrace[];
  synthesisCandidates: SynthesisCandidate[];
  candidateContract: CandidateContractItem[];
  // Phase 4 Ported Capabilities
  marriage11Axis: Marriage11AxisBundle;
  conflict4Stage: MarriageConflict4StageBundle;
  loveDeliveryMatch: MarriageLoveDeliveryBundle;
  expectationsAndNeeds: MarriageExpectationsAndNeedsBundle;
  emergencySosCombined: MarriageEmergencySosBundle;
  // Phase 5 Marriage-Specific Gaps
  inLawBoundary: MarriageInLawBoundaryBundle;
  lifeStageTransition: MarriageLifeStageBundle;
  coupleBurnout: MarriageBurnoutBundle;
  careerHomeTransition: MarriageCareerHomeBundle;
  // Phase 5.5 Economic Partnership Expansion
  economicPartnership: MarriageEconomicPartnershipBundle;
};
