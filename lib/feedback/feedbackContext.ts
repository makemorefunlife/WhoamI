/**
 * Post-report feedback context.
 *
 * The same ReportFeedbackSection is rendered under every report (free lite,
 * personal deep, relationship basic/deep). All submissions land in ONE
 * Google Sheet, so each submission carries which report it came from.
 *
 * Values are taken from identifiers that already exist in the codebase —
 * nothing here invents a parallel taxonomy:
 *   - report_type (free)          → LiteReport.report_type ("current_self_lite" / "essence_self_lite")
 *   - report_type (personal)      → SlimV1ReportResult.source ("v1/slim-integrated")
 *   - report_type (rel. basic)    → basic analysis log result_format ("relationship_4axis_v1")
 *   - report_type (rel. deep)     → per-kind *_DEEP_FORMAT constants (same set analysisLog.ts uses)
 *   - relationship_type           → RelationshipKind mapped to its product name
 *                                   (cohabitation → marriage, friendship → friend;
 *                                   see MARRIAGE_PRODUCT_KIND in relationshipKind.ts)
 *
 * Shared by the client component and /api/feedback so the column set and
 * sanitising rules live in one place.
 */
import { COHABITATION_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/cohabitation/outputSchema";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/workColleague/outputSchema";
import { FAMILY_PARENT_CHILD_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/familyParentChild/outputSchema";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "@/lib/prompts/relationshipPremium/friendSocial/outputSchema";
import type { RelationshipKind } from "@/lib/relationship/relationshipKind";

export const FEEDBACK_ANALYSIS_CATEGORIES = ["free", "personal", "relationship"] as const;
export type FeedbackAnalysisCategory = (typeof FEEDBACK_ANALYSIS_CATEGORIES)[number];

/** Product-facing relationship names written to the Sheet. */
export const FEEDBACK_RELATIONSHIP_TYPES = [
  "romantic",
  "marriage",
  "friend",
  "work",
  "family",
] as const;
export type FeedbackRelationshipType = (typeof FEEDBACK_RELATIONSHIP_TYPES)[number];

const RELATIONSHIP_TYPE_BY_KIND: Record<RelationshipKind, FeedbackRelationshipType> = {
  romantic: "romantic",
  cohabitation: "marriage", // MARRIAGE_PRODUCT_KIND
  friendship: "friend",
  work: "work",
  family: "family",
};

/**
 * Mirrors ROMANTIC_SAJU_DEEP_FORMAT. Not imported because
 * romanticSajuDeep/index.ts pulls the whole prompt engine into the client
 * bundle; tests/unit/feedback-context.test.mjs asserts the two stay equal.
 */
export const ROMANTIC_LEGACY_REPORT_TYPE = "romantic_saju_deep_v2";

const DEEP_FORMAT_BY_KIND: Record<RelationshipKind, string> = {
  romantic: ROMANTIC_LEGACY_REPORT_TYPE,
  cohabitation: COHABITATION_DEEP_FORMAT,
  friendship: FRIEND_SOCIAL_DEEP_FORMAT,
  work: WORK_COLLEAGUE_DEEP_FORMAT,
  family: FAMILY_PARENT_CHILD_DEEP_FORMAT,
};

/** Result format of the free relationship 4-axis analysis (see analyze/basic route). */
export const RELATIONSHIP_BASIC_FORMAT = "relationship_4axis_v1";
/**
 * Romantic V4 canonical report. Persisted schemaVersion is
 * "romantic_canonical_report_v1" / "..._v2_gap_batch"; the prefix identifies
 * the V4 surface regardless of sub-version.
 */
export const ROMANTIC_V4_REPORT_TYPE = "romantic_canonical_report";

export type FeedbackReportContext = {
  analysis_category: FeedbackAnalysisCategory;
  relationship_type: FeedbackRelationshipType | null;
  report_type: string;
  report_id: string | null;
};

// ---- builders (used by report pages) --------------------------------------

export function freeFeedbackContext(params: {
  reportType: string;
  reportId?: string | null;
}): FeedbackReportContext {
  return {
    analysis_category: "free",
    relationship_type: null,
    report_type: params.reportType,
    report_id: params.reportId || null,
  };
}

export function personalFeedbackContext(params: {
  reportType: string;
  reportId?: string | null;
}): FeedbackReportContext {
  return {
    analysis_category: "personal",
    relationship_type: null,
    report_type: params.reportType,
    report_id: params.reportId || null,
  };
}

export function relationshipBasicFeedbackContext(params: {
  relationshipReportId?: string | null;
}): FeedbackReportContext {
  return {
    analysis_category: "relationship",
    relationship_type: null,
    report_type: RELATIONSHIP_BASIC_FORMAT,
    report_id: params.relationshipReportId || null,
  };
}

export function relationshipDeepFeedbackContext(params: {
  kind: RelationshipKind;
  relationshipReportId?: string | null;
  romanticV4?: boolean;
}): FeedbackReportContext {
  const reportType =
    params.kind === "romantic" && params.romanticV4
      ? ROMANTIC_V4_REPORT_TYPE
      : DEEP_FORMAT_BY_KIND[params.kind];
  return {
    analysis_category: "relationship",
    relationship_type: RELATIONSHIP_TYPE_BY_KIND[params.kind],
    report_type: reportType,
    report_id: params.relationshipReportId || null,
  };
}

// ---- server-side sanitising -----------------------------------------------

function cleanId(v: unknown, max = 120): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  // IDs / identifiers only — letters, digits and a few separators.
  return /^[A-Za-z0-9_\-./:]+$/.test(s) ? s.slice(0, max) : "";
}

function pick<T extends string>(v: unknown, allowed: readonly T[]): T | "" {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : "";
}

/** Sheet column order for the context fields (blank string = not applicable / legacy). */
export type FeedbackSheetContextColumns = {
  analysis_category: FeedbackAnalysisCategory | "";
  relationship_type: FeedbackRelationshipType | "";
  report_type: string;
  report_id: string;
  locale: string;
};

/**
 * Normalises untrusted request-body context. Missing fields become "" so old
 * clients (cached bundles without context) still submit successfully.
 */
export function sanitizeFeedbackContext(body: Record<string, unknown>): FeedbackSheetContextColumns {
  return {
    analysis_category: pick(body.analysis_category, FEEDBACK_ANALYSIS_CATEGORIES),
    relationship_type: pick(body.relationship_type, FEEDBACK_RELATIONSHIP_TYPES),
    report_type: cleanId(body.report_type, 80),
    report_id: cleanId(body.report_id ?? body.analysis_id),
    locale: pick(body.locale, ["ko-KR", "en-US"] as const),
  };
}

/**
 * Full row sent to the Google Sheet webhook. Existing keys are unchanged;
 * context keys are appended so a header-mapped Apps Script picks them up and
 * an older script simply ignores them.
 */
export function buildFeedbackSheetPayload(body: Record<string, unknown>) {
  const { email, rating, feedback, founder_applied, marketing_agreed, created_at } = body;
  return {
    email: email ? String(email).trim() : "",
    rating: rating ? String(rating).trim() : "good",
    feedback: feedback ? String(feedback).trim() : "",
    founder_applied: Boolean(founder_applied),
    marketing_agreed: marketing_agreed !== undefined ? Boolean(marketing_agreed) : true,
    created_at: (typeof created_at === "string" && created_at) || new Date().toISOString(),
    ...sanitizeFeedbackContext(body),
  };
}
