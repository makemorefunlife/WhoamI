/**
 * Verifies the map's short-TTL result cache and its invalidation hook
 * directly against computeRelationshipMap — read-only, no mutations.
 *
 * ok - a second call within the TTL returns the SAME object reference
 *      (proves it's served from cache, not recomputed)
 * ok - after invalidateRelationshipMapCache(), the next call returns a
 *      DIFFERENT object reference (proves invalidation actually clears it)
 *
 * Requires a real reportId with connections (pass as argv[2]).
 *
 * Run: npx tsx tests/scripts/relationship-map-cache.test.mjs <reportId>
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const {
  computeRelationshipMap,
  invalidateRelationshipMapCache,
} = await import("../../lib/relationship/map/computeRelationshipMap.ts");

async function main() {
  const reportId = process.argv[2];
  if (!reportId) {
    console.error("usage: npx tsx tests/scripts/relationship-map-cache.test.mjs <reportId>");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const first = await computeRelationshipMap(supabase, reportId);
  const t0 = performance.now();
  const second = await computeRelationshipMap(supabase, reportId);
  const cachedMs = performance.now() - t0;

  if (first !== second) {
    console.error("FAIL: second call within the TTL should return the cached object, got a new one");
    process.exit(1);
  }
  console.log(`ok - cache hit returns the same object reference (${cachedMs.toFixed(1)}ms)`);

  invalidateRelationshipMapCache(reportId);

  const t1 = performance.now();
  const third = await computeRelationshipMap(supabase, reportId);
  const recomputedMs = performance.now() - t1;

  if (third === second) {
    console.error("FAIL: after invalidateRelationshipMapCache, the next call should recompute, got the stale cached object");
    process.exit(1);
  }
  console.log(`ok - invalidateRelationshipMapCache forces a fresh computation (${recomputedMs.toFixed(1)}ms)`);

  if (third.totalPeople !== second.totalPeople) {
    console.error(
      `FAIL: recomputed result should still agree on totalPeople for unchanged data (was ${second.totalPeople}, now ${third.totalPeople})`,
    );
    process.exit(1);
  }
  console.log("ok - recomputed result matches the prior one for unchanged underlying data");

  console.log("\nAll relationship-map cache tests passed.");
}

main().catch((e) => {
  console.error("test crashed:", e);
  process.exit(1);
});
