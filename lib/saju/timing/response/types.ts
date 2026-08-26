import type { SecondaryAxisKey, PrimaryAxisKey } from "@/lib/v2/survey/types";
import type { CEConfidence } from "../types";

export type PsychScoresInput = {
  primary?: Partial<Record<PrimaryAxisKey, number>>;
  secondary?: Partial<Record<SecondaryAxisKey, number>>;
};

export type IndividualResponseStyle<T extends string = string> = {
  style: T;
  label: string;
  summary: string;
  contributingPsychAxes: string[];
  contributingTimingSignals: string[];
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

  frictionPoints: string[];
  supportPoints: string[];

  factConfidence: CEConfidence;
  interpretationConfidence: CEConfidence;
  evidenceRefs: string[];
};
