import type { SecondaryAxisKey, PrimaryAxisKey } from "@/lib/v2/survey/types";
import type { CEConfidence } from "../types";

export type PsychScoresInput = {
  primary?: Partial<Record<PrimaryAxisKey, number>>;
  secondary?: Partial<Record<SecondaryAxisKey, number>>;
};

/**
 * How the Ten God family behind this response relates to the person's
 * NATAL composition — computed only when natal Ten God counts are supplied.
 * REINFORCEMENT: this family is already meaningfully present natally.
 * NEWLY_ACTIVATED: this family is essentially absent from the natal chart —
 *   the current Daewoon/Seun period is the reason it's showing up at all.
 * STRUCTURAL_TENSION: newly activated AND classically opposes a family that
 *   IS natally present (e.g. a newly-active 식상/output signal against a
 *   natally-present 관성/officer — 상관견관).
 * UNKNOWN: natal composition wasn't supplied, so no comparison was made.
 */
export type StructuralActivationKind = "REINFORCEMENT" | "NEWLY_ACTIVATED" | "STRUCTURAL_TENSION" | "UNKNOWN";

export type IndividualResponseStyle<T extends string = string> = {
  style: T;
  label: string;
  summary: string;
  contributingPsychAxes: string[];
  contributingTimingSignals: string[];
  /** Set when this response's triggering signal was checked against natal composition. */
  structuralActivation?: StructuralActivationKind;
};

export type IndividualTimingResponseProfile = {
  changeResponse?: IndividualResponseStyle;
  pressureResponse?: IndividualResponseStyle;
  actionResponse?: IndividualResponseStyle;
  relationshipResponse?: IndividualResponseStyle;
  recoveryResponse?: IndividualResponseStyle;
};

export type IndividualTimingResponse = {
  personId?: string;
  year: number;
  birthDate: string;

  timingContext: {
    backgroundThemes: string[];
    annualActivations: string[];
    structuralSignals: string[];
  };

  responseProfile: IndividualTimingResponseProfile;

  /**
   * Structural classification per signal category, set whenever that
   * category's signal fires — independent of whether a specific psych-axis
   * branch also matched (a signal can fire and get a real structural
   * reading even when no responseProfile.*Response object was produced,
   * e.g. because this person's psych axes didn't clear any of that
   * category's thresholds). Consumers that need "was the natal composition
   * considered for this year" should read this, not responseProfile.
   */
  structuralActivations: {
    pressure?: StructuralActivationKind;
    action?: StructuralActivationKind;
  };

  frictionPoints: string[];
  supportPoints: string[];

  factConfidence: CEConfidence;
  interpretationConfidence: CEConfidence;
  evidenceRefs: string[];
};
