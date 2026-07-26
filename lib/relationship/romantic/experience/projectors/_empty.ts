/**
 * Unavailable module factories for omit-empty defaults.
 * Projectors replace these with available:true payloads when evidence exists.
 */
import type {
  ConflictTranslationVM,
  DailyLifeVM,
  DifferenceMapVM,
  DoDontVM,
  HiddenHeartVM,
  HorizonVM,
  NextStepVM,
  OpeningSceneVM,
  RelationshipFlowVM,
  RepairGuideVM,
  WhySpecialVM,
} from "../romanticExperienceTypes";

const EMPTY_EVIDENCE: [] = [];

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

/** M2 Hidden Dynamic */
export function emptyHiddenHeart(): HiddenHeartVM {
  return {
    id: "M2",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    me: null,
    partner: null,
    mutualGift: null,
  };
}

/** M3 What's Special */
export function emptyWhySpecial(): WhySpecialVM {
  return {
    id: "M3",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    gifts: [],
    onlyTogether: null,
    whySpecial: null,
    frameDirectionLabel: null,
  };
}

/** M4 Difference Map */
export function emptyDifferenceMap(): DifferenceMapVM {
  return {
    id: "M4",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    buckets: [],
    hasRadar: false,
    openingContrast: null,
  };
}

/** M5 Relationship Flow */
export function emptyRelationshipFlow(): RelationshipFlowVM {
  return {
    id: "M5",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    nodes: [],
    interrupt: null,
    signalChips: [],
  };
}

export function emptyConflictTranslation(): ConflictTranslationVM {
  return {
    id: "M6",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    situationTitle: null,
    rows: [],
  };
}

/** M7 Daily Life */
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

/** M8 Do / Don't */
export function emptyDoDont(): DoDontVM {
  return {
    id: "M8",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    pack: null,
  };
}

/** M9 Repair Guide */
export function emptyRepairGuide(): RepairGuideVM {
  return {
    id: "M9",
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

/** Deferred Next Step (not M1–M10 in B3). */
export function emptyNextStep(): NextStepVM {
  return {
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

export function emptyHorizon(): HorizonVM {
  return {
    id: "M10",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    waypoints: [],
  };
}
