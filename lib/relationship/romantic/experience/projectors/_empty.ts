/**
 * Unavailable module factories for B1 skeleton / omit-empty defaults.
 * Projectors replace these with available:true payloads in later batches.
 */
import type {
  ConflictTranslationVM,
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

export function emptyDifferenceMap(): DifferenceMapVM {
  return {
    id: "M2",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    buckets: [],
    hasRadar: false,
    openingContrast: null,
  };
}

export function emptyRelationshipFlow(): RelationshipFlowVM {
  return {
    id: "M3",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    nodes: [],
    interrupt: null,
    signalChips: [],
  };
}

export function emptyHiddenHeart(): HiddenHeartVM {
  return {
    id: "M4",
    title: "",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    me: null,
    partner: null,
    mutualGift: null,
  };
}

export function emptyWhySpecial(): WhySpecialVM {
  return {
    id: "M5",
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

export function emptyDoDont(): DoDontVM {
  return {
    id: "M7",
    available: false,
    confidence: "tentative",
    evidence: EMPTY_EVIDENCE,
    pack: null,
  };
}

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

export function emptyNextStep(): NextStepVM {
  return {
    id: "M9",
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
