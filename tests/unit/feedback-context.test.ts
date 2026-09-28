/**
 * Feedback context → Google Sheet row.
 * Run: npx tsx tests/unit/feedback-context.test.ts
 *
 * Covers free / personal / romantic / marriage / friend (+ relationship basic,
 * legacy client with no context, and hostile input), and asserts every
 * report_type matches the canonical identifier already used in the codebase.
 */
import assert from "node:assert/strict";
import {
  buildFeedbackSheetPayload,
  freeFeedbackContext,
  personalFeedbackContext,
  relationshipBasicFeedbackContext,
  relationshipDeepFeedbackContext,
  ROMANTIC_LEGACY_REPORT_TYPE,
  type FeedbackReportContext,
} from "../../lib/feedback/feedbackContext";
import { COHABITATION_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/cohabitation/outputSchema";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/friendSocial/outputSchema";
import { MARRIAGE_PRODUCT_KIND } from "../../lib/relationship/relationshipKind";
import { readFileSync } from "node:fs";

const FIXED_TS = "2026-09-28T05:12:00.000Z";

/** Mirrors the client body in ReportFeedbackSection.handleSubmit. */
function clientBody(ctx: FeedbackReportContext | undefined, { rating, feedback, locale }: { rating: string; feedback: string; locale: string }) {
  return {
    email: "tester@example.com",
    rating,
    feedback,
    founder_applied: false,
    marketing_agreed: true,
    created_at: FIXED_TS,
    analysis_category: ctx?.analysis_category ?? "",
    relationship_type: ctx?.relationship_type ?? "",
    report_type: ctx?.report_type ?? "",
    report_id: ctx?.report_id ?? "",
    locale,
  };
}

// Canonical identifier guards (no invented duplicates).
const romanticSrc = readFileSync("lib/prompts/relationshipPremium/romanticSajuDeep/index.ts", "utf8");
assert.match(romanticSrc, new RegExp(`ROMANTIC_SAJU_DEEP_FORMAT = "${ROMANTIC_LEGACY_REPORT_TYPE}"`));
assert.equal(MARRIAGE_PRODUCT_KIND, "cohabitation");

const cases = {
  free: freeFeedbackContext({ reportType: "current_self_lite", reportId: "rep_free_123" }),
  personal: personalFeedbackContext({ reportType: "v1/slim-integrated", reportId: "rep_self_456" }),
  romantic: relationshipDeepFeedbackContext({ kind: "romantic", relationshipReportId: "rel_789", romanticV4: true }),
  romantic_legacy: relationshipDeepFeedbackContext({ kind: "romantic", relationshipReportId: "rel_789" }),
  marriage: relationshipDeepFeedbackContext({ kind: MARRIAGE_PRODUCT_KIND, relationshipReportId: "rel_321" }),
  friend: relationshipDeepFeedbackContext({ kind: "friendship", relationshipReportId: "rel_654" }),
  relationship_basic: relationshipBasicFeedbackContext({ relationshipReportId: "rel_654" }),
};

const inputs: Record<string, { rating: string; feedback: string; locale: string }> = {
  free: { rating: "great", feedback: "요즘의 패턴이 딱 맞아요", locale: "ko-KR" },
  personal: { rating: "good", feedback: "Part 03 was insightful", locale: "en-US" },
  romantic: { rating: "great", feedback: "", locale: "ko-KR" },
  romantic_legacy: { rating: "good", feedback: "", locale: "ko-KR" },
  marriage: { rating: "needs_improvement", feedback: "가사 분담 파트가 어색해요", locale: "ko-KR" },
  friend: { rating: "good", feedback: "Fun read", locale: "en-US" },
  relationship_basic: { rating: "good", feedback: "", locale: "ko-KR" },
};

const rows: Record<string, ReturnType<typeof buildFeedbackSheetPayload>> = {};
for (const [name, ctx] of Object.entries(cases)) {
  rows[name] = buildFeedbackSheetPayload(clientBody(ctx, inputs[name]));
}

assert.deepEqual(
  [rows.free.analysis_category, rows.free.relationship_type, rows.free.report_type, rows.free.report_id],
  ["free", "", "current_self_lite", "rep_free_123"],
);
assert.deepEqual(
  [rows.personal.analysis_category, rows.personal.relationship_type, rows.personal.report_type],
  ["personal", "", "v1/slim-integrated"],
);
assert.equal(rows.romantic.relationship_type, "romantic");
assert.equal(rows.romantic.report_type, "romantic_canonical_report");
assert.equal(rows.romantic_legacy.report_type, "romantic_saju_deep_v2");
assert.equal(rows.marriage.relationship_type, "marriage");
assert.equal(rows.marriage.report_type, COHABITATION_DEEP_FORMAT);
assert.equal(rows.friend.relationship_type, "friend");
assert.equal(rows.friend.report_type, FRIEND_SOCIAL_DEEP_FORMAT);
assert.equal(rows.relationship_basic.relationship_type, "");
assert.equal(rows.relationship_basic.report_type, "relationship_4axis_v1");
for (const r of Object.values(rows)) {
  assert.equal(r.created_at, FIXED_TS);
  assert.ok(["ko-KR", "en-US"].includes(r.locale));
}

// Old cached client: original 6 fields only → still accepted, context blank.
const legacy = buildFeedbackSheetPayload({
  email: "old@example.com",
  rating: "good",
  feedback: "old client",
  founder_applied: true,
  marketing_agreed: false,
  created_at: FIXED_TS,
});
assert.equal(legacy.rating, "good");
assert.equal(legacy.founder_applied, true);
assert.equal(legacy.marketing_agreed, false);
assert.deepEqual(
  [legacy.analysis_category, legacy.relationship_type, legacy.report_type, legacy.report_id, legacy.locale],
  ["", "", "", "", ""],
);

// Hostile / unknown values are dropped, not written to the Sheet.
const hostile = buildFeedbackSheetPayload({
  rating: "great",
  analysis_category: "admin",
  relationship_type: "=HYPERLINK(\"x\")",
  report_type: "<script>",
  report_id: "abc def",
  locale: "fr-FR",
});
assert.deepEqual(
  [hostile.analysis_category, hostile.relationship_type, hostile.report_type, hostile.report_id, hostile.locale],
  ["", "", "", "", ""],
);

// analysis_id accepted as an alias of report_id.
assert.equal(buildFeedbackSheetPayload({ analysis_id: "an_1" }).report_id, "an_1");

const COLS: (keyof (typeof rows)[string])[] = ["created_at", "analysis_category", "relationship_type", "report_type", "report_id", "locale", "rating", "feedback"];
console.log(COLS.join(" | "));
for (const name of ["free", "personal", "romantic", "marriage", "friend", "relationship_basic"]) {
  console.log(COLS.map((c) => String(rows[name][c] ?? "")).join(" | "));
}
console.log("\nfeedback-context: all assertions passed");
