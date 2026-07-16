/**
 * Locale-safe premium by_kind cache
 * Run: npx tsx tests/unit/premium-locale-cache.test.mjs
 */
import assert from "node:assert/strict";
import {
  getPremiumPayloadForKindLocale,
  hasPremiumCacheForKindLocale,
  mergePremiumKindLocale,
  hasPremiumCacheForKind,
} from "../../lib/relationship/premiumByKind.ts";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";

const romanticDeepReport = {
  section_1_summary: {
    relationship_name: "Pair",
    one_line_summary: "line",
    grade: "A",
  },
  section_2_nature: {
    a_nature: { description: "a" },
    b_nature: { description: "b" },
  },
  meta: { locale: "en-US", language: "en" },
};

const enPayload = {
  format: ROMANTIC_SAJU_DEEP_FORMAT,
  report: romanticDeepReport,
};

const koPayload = {
  format: ROMANTIC_SAJU_DEEP_FORMAT,
  report: {
    ...romanticDeepReport,
    section_1_summary: {
      ...romanticDeepReport.section_1_summary,
      one_line_summary: "한줄",
    },
    meta: { locale: "ko-KR", language: "ko" },
  },
};

let byKind = {};
byKind = mergePremiumKindLocale(byKind, "romantic", "en-US", enPayload);
assert.equal(hasPremiumCacheForKindLocale(byKind, "romantic", "en-US"), true);
assert.equal(hasPremiumCacheForKindLocale(byKind, "romantic", "ko-KR"), false);
ok("en hit / ko miss");

byKind = mergePremiumKindLocale(byKind, "romantic", "ko-KR", koPayload);
assert.equal(hasPremiumCacheForKindLocale(byKind, "romantic", "en-US"), true);
assert.equal(hasPremiumCacheForKindLocale(byKind, "romantic", "ko-KR"), true);
const enHit = getPremiumPayloadForKindLocale(byKind, "romantic", "en-US");
const koHit = getPremiumPayloadForKindLocale(byKind, "romantic", "ko-KR");
assert.equal(enHit.report.section_1_summary.one_line_summary, "line");
assert.equal(koHit.report.section_1_summary.one_line_summary, "한줄");
ok("both locales retained");

assert.equal(
  hasPremiumCacheForKindLocale(
    {
      romantic: {
        format: ROMANTIC_SAJU_DEEP_FORMAT,
        report: { ...romanticDeepReport, meta: {} },
      },
    },
    "romantic",
    "en-US",
  ),
  false,
);
ok("legacy flat without locale meta is miss");

assert.equal(hasPremiumCacheForKind(byKind, "romantic"), true);
ok("any-locale completion still works");

function ok(name) {
  console.log(`ok - ${name}`);
}

console.log("\nOK: premium locale cache tests passed");
