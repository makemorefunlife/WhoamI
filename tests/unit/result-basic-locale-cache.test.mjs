/**
 * result_basic (free relationship analysis) locale metadata
 * Policy (updated 2026-10-20, decision 5): a result's language is fixed at
 * generation time and the stored original is never overwritten. A screen in
 * the OTHER language does not show it and never regenerates automatically;
 * the person can create one in that language (stored separately). The
 * detailed per-language rules are in relationship-basic-by-locale.test.ts.
 * Run: npx tsx tests/unit/result-basic-locale-cache.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getResultBasicLocale,
  resultBasicLocaleMatches,
} from "../../lib/relationship/resultBasicLocale.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

section("getResultBasicLocale");
assert.equal(getResultBasicLocale({ perspectives: {}, locale: "en-US" }), "en-US");
assert.equal(getResultBasicLocale({ perspectives: {}, locale: "ko-KR" }), "ko-KR");
assert.equal(
  getResultBasicLocale({ perspectives: {} }),
  null,
  "legacy row without a locale field is unknown, not en-US",
);
assert.equal(getResultBasicLocale(null), null);
assert.equal(getResultBasicLocale(undefined), null);
ok("locale extraction handles tagged, legacy, and empty rows");

section("resultBasicLocaleMatches — pure comparison (metadata only, not a reuse gate)");
const enResult = { perspectives: { a: {}, b: {} }, locale: "en-US" };
const koResult = { perspectives: { a: {}, b: {} }, locale: "ko-KR" };
const legacyResult = { perspectives: { a: {}, b: {} } }; // predates locale tagging

assert.equal(resultBasicLocaleMatches(enResult, "en-US"), true);
assert.equal(resultBasicLocaleMatches(enResult, "ko-KR"), false);
assert.equal(resultBasicLocaleMatches(koResult, "ko-KR"), true);
assert.equal(resultBasicLocaleMatches(koResult, "en-US"), false);
assert.equal(resultBasicLocaleMatches(legacyResult, "en-US"), false);
assert.equal(resultBasicLocaleMatches(legacyResult, "ko-KR"), false);
ok("resultBasicLocaleMatches remains a correct pure comparison helper");

section("routes and screen -- original kept, other language only on request");
const src = fs.readFileSync("app/api/relationship/analyze/basic/route.ts", "utf8");
assert.match(src, /const payload = \{ \.\.\.toned, locale \}/, "fresh results are tagged with the generation locale");
assert.doesNotMatch(src, /patchedWithLocale|migratedWithLocale/, "no locale re-stamping of an existing result");
const detailSrc = fs.readFileSync("app/api/relationship/detail/route.ts", "utf8");
assert.match(detailSrc, /basic_locale:\s*getResultBasicLocale\(basic\)/, "detail exposes the shown result's locale");
const hookSrc = fs.readFileSync("app/relationship/[id]/useRelationshipDetail.ts", "utf8");
assert.doesNotMatch(hookSrc, /shouldRegenerateBasic/);
assert.match(
  hookSrc,
  /retryAnalysis = useCallback\(\(\) => \{\s*\n\s*if \(basicInFlight\.current\) return;\s*\n\s*basicAttempted\.current = false;/,
  "manual retry still resets the attempted guard",
);
ok("existing result kept; other language only from the button (see relationship-basic-by-locale.test.ts)");

console.log("\nOK: result_basic locale metadata tests passed");
