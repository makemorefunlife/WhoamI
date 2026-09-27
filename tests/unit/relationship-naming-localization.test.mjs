/**
 * Relationship report naming/localization regression coverage.
 *
 * Covers 3 live bugs found in the premium Relationship report:
 *  A. Badge/title rendering the generic fallback "Partner" instead of the
 *     partner's real saved/Clerk display name.
 *  B. Generated English prose containing the literal Korean pronoun "나"
 *     instead of the viewer's real name.
 *  C. Romantic Chapter 4 ("Side by side" comparison table) rendering Korean
 *     question copy even in an English-locale report.
 *
 * Root cause for A and B (shared): app/api/relationship/analyze/premium/
 * route.ts computed labelA/labelB via resolveViewerDisplayName for BOTH
 * sides, but only ever supplied a live Clerk profile (clerkFirstName/
 * clerkFullName) for whichever side matched the current viewer — the other
 * (partner) side always got undefined for both Clerk fields, so a partner
 * with no manually-set reports.name had nothing to resolve except the
 * hardcoded fallback literals "나" / "상대", which then got baked
 * permanently into report.names and generated prose regardless of the
 * report's own locale. Fixed by (1) resolving the non-viewer side via
 * resolvePartnerDisplayName + a batched resolveClerkDisplayNamesByUserId
 * lookup, exactly mirroring the already-correct pattern in
 * app/api/relationship/detail/route.ts, and (2) making the ultimate
 * fallback locale-aware (messages.report.meFallbackLabel /
 * partnerFallbackLabel — the same canonical fallback already used by
 * FriendReportView / MarriageReportView / WorkColleagueReportView /
 * RelationshipBasicCards / PsychMatchRadarChart) instead of hardcoded
 * Korean literals.
 *
 * Root cause for C: lib/relationship/romantic/prototypeV4/
 * buildRomanticV4PrototypePayload.ts's COMPARE_QUESTION dictionary had only
 * Korean strings and no locale branching at all, unlike its sibling
 * formatRomanticCompareLeanLabel/localizeComparisonRowProse which do branch
 * on locale — used identically by both the real-fusion path
 * (comparisonRowsFromFusion) and the dev-fixture path (buildComparisonTable).
 * Fixed by splitting into COMPARE_QUESTION_KO/COMPARE_QUESTION_EN and a
 * compareQuestionFor(rowKey, locale) accessor, wired into both call sites.
 *
 * Run: npx tsx tests/unit/relationship-naming-localization.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

const { resolveViewerDisplayName } = await import("../../lib/relationship/viewerFirstDisplay.ts");
const { resolvePartnerDisplayName, isGenericPartnerName } = await import(
  "../../lib/relationship/resolvePartnerDisplayName.ts"
);
const { compareQuestionFor } = await import(
  "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts"
);
const { getMessages } = await import("../../lib/i18n/messages/index.ts");

const enMessages = getMessages("en-US");
const koMessages = getMessages("ko-KR");

const premiumRouteSrc = fs.readFileSync(
  "app/api/relationship/analyze/premium/route.ts",
  "utf8",
);
const payloadSrc = fs.readFileSync(
  "lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts",
  "utf8",
);

// ---------------------------------------------------------------------------
section("A — viewer's own real display name always wins over generic fallback");
// ---------------------------------------------------------------------------
{
  assert.equal(
    resolveViewerDisplayName({
      reportName: null,
      clerkFirstName: "Sera",
      clerkFullName: "Sera Kim",
      fallback: enMessages.report.meFallbackLabel,
    }),
    "Sera",
    "a real Clerk first name must win over the generic fallback",
  );
  ok("resolveViewerDisplayName prefers a real Clerk name over the fallback");

  assert.equal(
    resolveViewerDisplayName({
      reportName: null,
      clerkFirstName: undefined,
      clerkFullName: undefined,
      fallback: enMessages.report.meFallbackLabel,
    }),
    "Me",
    "when genuinely unresolvable, the EN fallback must be the locale-correct 'Me', never the Korean literal",
  );
  ok("resolveViewerDisplayName falls back to the EN canonical label ('Me'), not a Korean literal, in en-US");
}

// ---------------------------------------------------------------------------
section("B — partner's real display name (Clerk-resolved) always wins over generic fallback");
// ---------------------------------------------------------------------------
{
  assert.equal(
    resolvePartnerDisplayName(null, "Minji", undefined, enMessages.report.partnerFallbackLabel),
    "Minji",
    "a real Clerk publicMetadata.displayName for the partner must win",
  );
  ok("resolvePartnerDisplayName prefers the partner's real Clerk name over the fallback");

  assert.equal(
    resolvePartnerDisplayName(null, undefined, undefined, enMessages.report.partnerFallbackLabel),
    "Partner",
    "when genuinely unresolvable, the EN fallback must be the locale-correct 'Partner', never '상대'",
  );
  ok("resolvePartnerDisplayName falls back to the EN canonical label ('Partner'), not '상대', in en-US");

  assert.equal(
    resolvePartnerDisplayName("상대", "Minji", undefined, enMessages.report.partnerFallbackLabel),
    "Minji",
    "a stale/generic reports.name value must never shadow a real Clerk name",
  );
  ok("a generic reports.name value never blocks the real Clerk-resolved partner name");
}

// ---------------------------------------------------------------------------
section("C — premium generation route no longer bakes hardcoded Korean fallback literals");
// ---------------------------------------------------------------------------
{
  assert.ok(
    !/fallback:\s*"나"/.test(premiumRouteSrc) && !/fallback:\s*"상대"/.test(premiumRouteSrc),
    "the premium route must not hardcode '나'/'상대' as a fallback literal any more",
  );
  ok("no hardcoded '나'/'상대' fallback literals remain in the premium generation route");

  assert.ok(
    premiumRouteSrc.includes("messages.report.meFallbackLabel") &&
      premiumRouteSrc.includes("messages.report.partnerFallbackLabel"),
    "the premium route must use the canonical locale-aware fallback labels",
  );
  ok("premium route uses messages.report.meFallbackLabel / partnerFallbackLabel");
}

// ---------------------------------------------------------------------------
section("D — premium route resolves the NON-viewer side via Clerk too (not just the viewer's own session)");
// ---------------------------------------------------------------------------
{
  assert.ok(
    premiumRouteSrc.includes(
      'import { resolveClerkDisplayNamesByUserId } from "@/lib/relationship/resolveClerkDisplayNames";',
    ),
    "resolveClerkDisplayNamesByUserId must be imported",
  );
  assert.ok(
    premiumRouteSrc.includes(
      'import { resolvePartnerDisplayName } from "@/lib/relationship/resolvePartnerDisplayName";',
    ),
    "resolvePartnerDisplayName must be imported",
  );
  assert.ok(
    /await resolveClerkDisplayNamesByUserId\(\[reportClerkUserId\(partnerReport\)\]\)/.test(premiumRouteSrc),
    "the non-viewer (partner) side's clerk_user_id must be batch-resolved",
  );
  ok("premium route imports and calls the canonical Clerk-lookup + partner-resolution helpers");

  assert.ok(
    premiumRouteSrc.includes('fetchReportWithBirthCoords(supabase, rr.report_id_a, "clerk_user_id, report_type")') &&
      premiumRouteSrc.includes('fetchReportWithBirthCoords(supabase, rr.report_id_b, "clerk_user_id, report_type")'),
    "clerk_user_id/report_type must be fetched for both sides so the partner lookup has data to work with",
  );
  ok("both report fetches now select clerk_user_id + report_type");
}

// ---------------------------------------------------------------------------
section("E — all five relationship kinds share the same labelA/labelB participant-name resolution");
// ---------------------------------------------------------------------------
{
  const nicknameMatches = [...premiumRouteSrc.matchAll(/nicknameA:\s*labelA,\s*\n\s*nicknameB:\s*labelB,/g)];
  assert.equal(
    nicknameMatches.length,
    5,
    `expected all 5 kind dispatches (romantic/work/cohabitation/family/friendship) to feed nicknameA/nicknameB from the SAME shared labelA/labelB, found ${nicknameMatches.length}`,
  );
  ok("all 5 relationship kinds consume the identical, once-computed labelA/labelB (single canonical resolution)");

  // labelA/labelB themselves must each be computed exactly once (not duplicated per-kind).
  assert.equal(
    (premiumRouteSrc.match(/const labelA =/g) ?? []).length,
    1,
    "labelA must be computed exactly once, shared across all kinds",
  );
  assert.equal(
    (premiumRouteSrc.match(/const labelB =/g) ?? []).length,
    1,
    "labelB must be computed exactly once, shared across all kinds",
  );
  ok("labelA/labelB are computed exactly once, before any kind-dispatch branch");
}

// ---------------------------------------------------------------------------
section("F — EN Chapter 4 ('Side by side') comparison questions are in English, never Korean");
// ---------------------------------------------------------------------------
{
  const rowKeys = ["conflict", "affection", "stress", "expression", "decision", "communication"];
  for (const key of rowKeys) {
    const enQuestion = compareQuestionFor(key, "en-US");
    assert.ok(
      !HANGUL_RE.test(enQuestion),
      `EN comparison question for "${key}" must not contain Hangul, got: ${enQuestion}`,
    );
    assert.ok(enQuestion.trim().length > 0, `EN comparison question for "${key}" must be non-empty`);
  }
  ok("compareQuestionFor(key, 'en-US') returns pure-English copy for every comparison row");

  assert.ok(
    !/relationshipQuestion:\s*COMPARE_QUESTION\[rowKey\]/.test(payloadSrc),
    "the old locale-blind COMPARE_QUESTION[rowKey] lookup must be gone from both call sites",
  );
  const wiredCallSites = [...payloadSrc.matchAll(/relationshipQuestion:\s*compareQuestionFor\(rowKey,\s*params\.locale\)/g)];
  assert.equal(
    wiredCallSites.length,
    2,
    "both the dev-fixture path (buildComparisonTable) and the real-fusion path (comparisonRowsFromFusion) must use the locale-aware accessor",
  );
  ok("both comparison-table builders (dev_fixture and real-fusion) resolve the question text via locale");
}

// ---------------------------------------------------------------------------
section("G — KR behavior is unchanged (regression guard)");
// ---------------------------------------------------------------------------
{
  const koExpected = {
    conflict: "서로 부딪힐 때 우리는 무엇을 먼저 하나요?",
    affection: "사랑을 확인받고 전하는 방식은 어떻게 다른가요?",
    stress: "압박을 받을 때 어떤 패턴이 나오나요?",
    expression: "감정을 전달하는 속도와 밀도는 어떤가요?",
    decision: "중요한 결정을 내릴 때 어떤 기준을 쓰나요?",
    communication: "말을 고르고 해석하는 방식은 어떻게 다른가요?",
  };
  for (const [key, expected] of Object.entries(koExpected)) {
    assert.equal(
      compareQuestionFor(key, "ko-KR"),
      expected,
      `KR comparison question for "${key}" must be byte-for-byte unchanged from the original copy`,
    );
  }
  ok("compareQuestionFor(key, 'ko-KR') is unchanged from the original Korean copy for every row");

  assert.equal(koMessages.report.meFallbackLabel, "나", "KR viewer fallback must remain '나'");
  assert.equal(koMessages.report.partnerFallbackLabel, "상대", "KR partner fallback must remain '상대'");
  ok("KR canonical fallback labels ('나' / '상대') are unchanged");

  assert.equal(
    resolveViewerDisplayName({ reportName: null, clerkFirstName: undefined, clerkFullName: undefined, fallback: koMessages.report.meFallbackLabel }),
    "나",
    "KR viewer resolution must still fall back to '나' when genuinely unresolvable",
  );
  assert.equal(
    resolvePartnerDisplayName(null, undefined, undefined, koMessages.report.partnerFallbackLabel),
    "상대",
    "KR partner resolution must still fall back to '상대' when genuinely unresolvable",
  );
  ok("KR fallback resolution behavior is unchanged end-to-end");
}

console.log("\nAll relationship-naming-localization assertions passed.\n");
