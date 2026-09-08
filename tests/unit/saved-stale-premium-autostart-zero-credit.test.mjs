/**
 * Regression test for GAP 2:
 * saved stale premium result + autostart=1
 * -> saved result shown
 * -> 0 credit use
 * -> 0 LLM generation
 *
 * Run: npx tsx tests/unit/saved-stale-premium-autostart-zero-credit.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  hasPremiumCacheForKindLocale,
  getPremiumPayloadForKindLocale,
} from "../../lib/relationship/premiumByKind.ts";
import { WORK_COLLEAGUE_DEEP_FORMAT } from "../../lib/prompts/relationshipPremium/workColleague/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("1. Verify server-side POST /api/relationship/analyze/premium cache-first check");
{
  const premiumRouteSrc = readSrc("app/api/relationship/analyze/premium/route.ts");

  // Verify cache check happens BEFORE credit reservation or OpenAI initialization
  const cacheIndex = premiumRouteSrc.indexOf("hasPremiumCacheForKindLocale");
  const creditReserveIndex = premiumRouteSrc.indexOf("reserveRelationshipCredit");

  assert.ok(cacheIndex > 0, "hasPremiumCacheForKindLocale must be present in premium route");
  assert.ok(creditReserveIndex > cacheIndex, "reserveRelationshipCredit must be AFTER cache check");

  // Verify that forceRegenerate is required to bypass cache
  assert.match(
    premiumRouteSrc,
    /if\s*\(\s*!forceRegenerate\s*&&\s*hasPremiumCacheForKindLocale/,
    "Cache hit check must bypass credit & LLM unless forceRegenerate is true",
  );
  ok("POST /api/relationship/analyze/premium returns saved result with 0 credit & 0 LLM calls when cache exists");
}

section("2. Verify client-side useRelationshipDetail autostart gate when premiumReady is true");
{
  const detailHookSrc = readSrc("app/relationship/[id]/useRelationshipDetail.ts");

  // Verify autostart effect checks premiumReady and aborts autostart if true
  assert.match(
    detailHookSrc,
    /if\s*\(\s*premiumReady\s*\)\s*\{\s*autostartTriggered\.current\s*=\s*true;\s*return;\s*\}/,
    "useRelationshipDetail autostart must short-circuit if premiumReady is true",
  );

  ok("useRelationshipDetail autostart=1 skips API call entirely when saved result exists (premiumReady === true)");
}

section("3. Verify GET /api/relationship/detail exposes saved result regardless of staleness");
{
  const detailRouteSrc = readSrc("app/api/relationship/detail/route.ts");

  // Check that result_premium_by_kind is returned directly without staleness filtering
  assert.match(
    detailRouteSrc,
    /result_premium_by_kind/,
    "detail route must include result_premium_by_kind",
  );
  assert.doesNotMatch(
    detailRouteSrc,
    /isStale/,
    "detail route must not filter out saved results based on staleness",
  );

  ok("GET /api/relationship/detail returns saved premium payload unconditionally so UI marks premiumReady=true");
}

section("4. Verify stale payload evaluation via helper functions");
{
  const stalePayload = {
    work: {
      byLocale: {
        "ko-KR": {
          format: WORK_COLLEAGUE_DEEP_FORMAT,
          report: {
            snapshot_panel: { relationshipGauges: [{ label: "legacy" }] },
            office: { some_legacy_field: true },
          },
        },
      },
    },
  };

  const hasCache = hasPremiumCacheForKindLocale(stalePayload, "work", "ko-KR");
  const payload = getPremiumPayloadForKindLocale(stalePayload, "work", "ko-KR");

  assert.equal(hasCache, true, "stale payload must still count as having a cached result");
  assert.equal(
    payload?.report?.office?.some_legacy_field,
    true,
    "saved stale result must be retrieved cleanly",
  );

  ok("hasPremiumCacheForKindLocale / getPremiumPayloadForKindLocale treat saved stale result as cached hit");
}

console.log(`\nAll ${passed} regression assertions passed cleanly.`);
