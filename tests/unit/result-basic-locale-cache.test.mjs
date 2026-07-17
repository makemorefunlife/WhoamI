/**
 * result_basic (free relationship analysis) locale metadata
 * Policy: a report's language is fixed at generation time. Existing
 * result_basic is always served as-is regardless of the viewer's current
 * site locale — no auto-regeneration or overwrite on locale mismatch.
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

section("app/api/relationship/analyze/basic/route.ts — existing result_basic is reused regardless of locale");
const src = fs.readFileSync(
  "app/api/relationship/analyze/basic/route.ts",
  "utf8",
);
assert.doesNotMatch(
  src,
  /resultBasicLocaleMatches/,
  "route must not gate result_basic reuse on locale match",
);
assert.doesNotMatch(
  src,
  /localeMatches/,
  "no locale-mismatch gating variable should remain in the route",
);
assert.match(
  src,
  /if \(basicComplete && integratesForLlm\) \{/,
  "a complete result_basic must be reused unconditionally (no locale check)",
);
assert.match(
  src,
  /if \(\s*\n\s*rr\.result_basic &&\s*\n\s*\(rr\.result_basic as \{ perspectives\?: unknown \}\)\.perspectives\s*\n\s*\)/,
  "legacy-perspectives patch path must also reuse unconditionally (no locale check)",
);
assert.match(
  src,
  /const payload = \{ \.\.\.normalized, locale \}/,
  "freshly generated result_basic must still be tagged with the generation locale",
);
ok("route reuses any existing result_basic regardless of locale, and still stamps fresh generations with locale metadata");

section("app/api/relationship/detail/route.ts — still exposes stored basic locale (metadata)");
const detailSrc = fs.readFileSync(
  "app/api/relationship/detail/route.ts",
  "utf8",
);
assert.match(detailSrc, /getResultBasicLocale/);
assert.match(
  detailSrc,
  /basic_locale:\s*getResultBasicLocale\(rr\.result_basic\)/,
  "detail response keeps exposing the locale the stored result_basic was generated in",
);
ok("detail route still exposes basic_locale as metadata");

section("useRelationshipDetail.ts — no locale-driven auto-regeneration");
const hookSrc = fs.readFileSync(
  "app/relationship/[id]/useRelationshipDetail.ts",
  "utf8",
);
assert.doesNotMatch(
  hookSrc,
  /shouldRegenerateBasic/,
  "hook must not import or call shouldRegenerateBasic",
);
assert.doesNotMatch(
  hookSrc,
  /basicLocale/,
  "hook must not track a separate basicLocale state used to gate display or regeneration",
);
assert.match(
  hookSrc,
  /const hasBasicContent = Boolean\(basic && Object\.keys\(basic\)\.length > 0\);\s*\n\s*if \(hasBasicContent \|\| basicAttempted\.current\) return;/,
  "auto-trigger effect must only fire when there is no basic content yet, regardless of locale",
);
assert.match(
  hookSrc,
  /const displayBasic =\s*\n\s*snapshotView\?\.basic !== undefined \? snapshotView\.basic : basic;/,
  "displayBasic must always show the existing result_basic as final, never hide it for a locale mismatch",
);
assert.match(
  hookSrc,
  /retryAnalysis = useCallback\(\(\) => \{\s*\n\s*basicAttempted\.current = false;/,
  "manual retry must still reset the attempted guard so it can try again",
);
ok("hook reuses existing result_basic regardless of locale and never auto-regenerates on locale mismatch");

console.log("\nOK: result_basic locale metadata tests passed");
