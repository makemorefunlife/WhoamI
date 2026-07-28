/**
 * Unavailable module factories for omit-empty defaults.
 * Projectors replace these with available:true payloads when evidence exists.
 */
import type {
  ActionAdviceVM,
  AxisComparisonVM,
  ConflictTranslationVM,
  DailyLifeVM,
  DifferenceMapVM,
  DoDontVM,
  EssenceVM,
  HiddenHeartVM,
  HorizonVM,
  NextStepVM,
  OpeningSceneVM,
  PremiumOverviewVM,
  RelationshipFlowVM,
  RelationshipSnapshotVM,
  RepairGuideVM,
  WhySpecialVM,
} from "../romanticExperienceTypes";

const EMPTY_EVIDENCE: [] = [];

/** Sprint 5 — 30-second Premium Overview. No module id. */
export function emptyPremiumOverview(): PremiumOverviewVM {
  return {
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    eventScores: null,
  };
}

/** Sprint 5 — shared 11-axis comparison. No module id. */
export function emptyAxisComparison(): AxisComparisonVM {
  return {
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    axisResults: [],
    hasTension: false,
  };
}

export function emptyOpeningScene(params: {
  myName: string;
  partnerName: string;
}): OpeningSceneVM {
  return {
    id: "M1",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    myName: params.myName,
    partnerName: params.partnerName,
    signature: null,
    paradox: null,
    invitation: null,
    dayStemLine: null,
  };
}

/** M2 Relationship Snapshot */
export function emptyRelationshipSnapshot(): RelationshipSnapshotVM {
  return {
    id: "M2",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    signals: [],
  };
}

/** M3 Difference Map */
export function emptyDifferenceMap(): DifferenceMapVM {
  return {
    id: "M3",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    buckets: [],
    hasRadar: false,
    openingContrast: null,
    dynamicsNarrative: null,
  };
}

/** Sprint 2 — Essence (legacy section_2_nature). No module id. */
export function emptyEssence(): EssenceVM {
  return {
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    me: null,
    partner: null,
  };
}

/** Sprint 2 — Action Advice (legacy section_5_action). No module id. */
export function emptyActionAdvice(): ActionAdviceVM {
  return {
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    me: [],
    partner: [],
    together: null,
    togetherStarter: null,
  };
}

/** M5 Hidden Heart */
export function emptyHiddenHeart(): HiddenHeartVM {
  return {
    id: "M5",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    me: null,
    partner: null,
    mutualGift: null,
  };
}

/** M6 Special Dynamics */
export function emptyWhySpecial(): WhySpecialVM {
  return {
    id: "M6",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    gifts: [],
    onlyTogether: null,
    whySpecial: null,
    frameDirectionLabel: null,
    framesNarrative: null,
  };
}

/** M4 Relationship Flow */
export function emptyRelationshipFlow(): RelationshipFlowVM {
  return {
    id: "M4",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    nodes: [],
    interrupt: null,
    signalChips: [],
  };
}

/** Legacy compatibility: previously M6 Conflict projector output. */
export function emptyConflictTranslation(): ConflictTranslationVM {
  return {
    id: "M7",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    situationTitle: null,
    rows: [],
  };
}

/** Legacy compatibility: M7 Daily Life projector default. */
export function emptyDailyLife(): DailyLifeVM {
  return {
    id: "M7",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    domains: [],
  };
}

/** Legacy compatibility: M8 Do / Don't projector default. */
export function emptyDoDont(): DoDontVM {
  return {
    id: "M9",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    pack: null,
  };
}

/** Legacy compatibility: M9 Repair Guide projector default. */
export function emptyRepairGuide(): RepairGuideVM {
  return {
    id: "M8",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    asymmetry: null,
    interrupt: null,
    stages: [],
    doNotDemand: [],
    polishEligiblePaths: [],
  };
}

/** Legacy compatibility: deferred Next Step default. */
export function emptyNextStep(): NextStepVM {
  return {
    id: "M10",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    defaultTab: "viewer",
    viewerExperiments: [],
    partnerExperiments: [],
    together: null,
    togetherStarter: null,
  };
}

/** M11 Relationship Horizon default. */
export function emptyHorizon(): HorizonVM {
  return {
    id: "M11",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    waypoints: [],
  };
}
