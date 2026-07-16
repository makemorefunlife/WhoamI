/**
 * Premium by_kind cache rules — deep format only (not perspectives-only).
 * Run: npx tsx tests/unit/premium-by-kind-cache.test.mjs
 */
import assert from "node:assert/strict";
import { hasPremiumCacheForKind } from "../../lib/relationship/premiumByKind.ts";
import { isRelationshipPremiumComplete } from "../../lib/relationship/isRelationshipPremiumComplete.ts";
import { ROMANTIC_SAJU_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/romanticSajuDeep/index.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/index.ts";
import { FRIEND_SOCIAL_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/friendSocial/index.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}

const romanticDeepReport = {
  section_1_summary: {
    relationship_name: "연인",
    one_line_summary: "한줄",
    grade: "A",
  },
  section_2_nature: {
    a_nature: { description: "a" },
    b_nature: { description: "b" },
  },
};

assert.equal(
  hasPremiumCacheForKind(
    {
      romantic: {
        perspectives: {
          "11111111-1111-1111-1111-111111111111": { headline: "레거시" },
        },
      },
    },
    "romantic",
  ),
  false,
);
ok("perspectives-only romantic is not cache hit");

assert.equal(
  hasPremiumCacheForKind(
    {
      romantic: {
        format: ROMANTIC_SAJU_DEEP_FORMAT,
        report: romanticDeepReport,
      },
    },
    "romantic",
  ),
  true,
);
ok("valid romantic deep is cache hit");

assert.equal(
  hasPremiumCacheForKind(
    {
      work: {
        perspectives: {
          "11111111-1111-1111-1111-111111111111": { headline: "레거시" },
        },
      },
    },
    "work",
  ),
  false,
);
ok("perspectives-only work is not cache hit");

assert.equal(
  hasPremiumCacheForKind(
    {
      work: {
        format: WORK_COLLEAGUE_DEEP_FORMAT,
        report: {
          headline: "동료",
          snapshot_panel: { relationshipGauges: [1] },
        },
      },
    },
    "work",
  ),
  true,
);
ok("valid work deep is cache hit");

assert.equal(
  hasPremiumCacheForKind(
    {
      friendship: {
        format: FRIEND_SOCIAL_DEEP_FORMAT,
        report: {
          headline: "친구",
          friend: { section_social_dna_a: { social_title: "소셜" } },
        },
      },
    },
    "friendship",
  ),
  true,
);
ok("valid friendship deep is cache hit");

assert.equal(
  isRelationshipPremiumComplete(
    "premium",
    {
      romantic: {
        perspectives: {
          "11111111-1111-1111-1111-111111111111": { headline: "레거시" },
        },
      },
    },
    "romantic",
  ),
  false,
);
ok("hub complete rejects perspectives-only");

assert.equal(
  isRelationshipPremiumComplete(
    "premium",
    {
      romantic: {
        format: ROMANTIC_SAJU_DEEP_FORMAT,
        report: romanticDeepReport,
      },
    },
    "romantic",
  ),
  true,
);
ok("hub complete accepts deep romantic");

assert.equal(
  isRelationshipPremiumComplete(
    "basic",
    {
      romantic: {
        format: ROMANTIC_SAJU_DEEP_FORMAT,
        report: romanticDeepReport,
      },
    },
    "romantic",
  ),
  false,
);
ok("hub complete requires analysis_type premium");

// Static check: client no longer force-regenerates on perspectives (grep proxy)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const detailHook = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../app/relationship/[id]/useRelationshipDetail.ts",
  ),
  "utf8",
);
assert.equal(
  detailHook.includes("forceRegenerate: true }") &&
    detailHook.includes("prem?.perspectives"),
  false,
);
assert.equal(detailHook.includes("!forceRegenerate && prem?.perspectives"), false);
ok("detail hook has no perspectives→forceRegenerate recurse");

console.log(`\n${passed} passed`);
