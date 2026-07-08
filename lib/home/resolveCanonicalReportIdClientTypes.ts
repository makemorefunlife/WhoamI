export type CanonicalReportIdSource = "resume" | "hint-fallback" | "none";

export type ResolveCanonicalReportIdResult = {
  canonicalReportId: string;
  urlHint: string;
  source: CanonicalReportIdSource;
  invalidHint: boolean;
  surveyCompleted: boolean;
};
