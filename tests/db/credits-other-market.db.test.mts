/**
 * "This credit belongs to the other site" hint (lib/credits/otherMarket.ts)
 * against a real local PostgreSQL. Run via tests/db/run-db-tests.sh.
 */
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connectTestDb, supabaseShim } from "./pgSupabaseShim";

const db = await connectTestDb();
if (!db) {
  console.log("skip - AHA_TEST_DATABASE_URL / AHA_PG_MODULE not set");
  process.exit(0);
}
const sb = supabaseShim(db) as unknown as SupabaseClient;
const { otherMarketWithCredit } = await import("../../lib/credits/otherMarket");

await db.query(`
  insert into credit_lots (clerk_user_id, credit_type, amount, remaining, source, locale, scope_basis, expires_at) values
   ('k1', 'personal', 1, 1, 'one_time_purchase', 'ko-KR', 'order', now() + interval '30 days'),
   ('k2', 'personal', 1, 0, 'one_time_purchase', 'ko-KR', 'order', null),
   ('k3', 'personal', 1, 1, 'one_time_purchase', 'ko-KR', 'order', now() - interval '1 day'),
   ('k4', 'personal', 1, 1, 'promo', null, 'issuer', null),
   ('k5', 'relationship', 1, 1, 'one_time_purchase', 'en-US', 'order', null)`);

assert.equal(await otherMarketWithCredit(sb, "k1", "personal", "en-US"), "ko-KR", "unused KR credit -> point to the Korean site");
assert.equal(await otherMarketWithCredit(sb, "k1", "personal", "ko-KR"), null, "same site: nothing to point to");
assert.equal(await otherMarketWithCredit(sb, "k2", "personal", "en-US"), null, "used up");
assert.equal(await otherMarketWithCredit(sb, "k3", "personal", "en-US"), null, "expired");
assert.equal(await otherMarketWithCredit(sb, "k4", "personal", "en-US"), null, "both-sites lots are not 'the other site'");
assert.equal(await otherMarketWithCredit(sb, "k5", "relationship", "ko-KR"), "en-US");
assert.equal(await otherMarketWithCredit(sb, "k5", "personal", "ko-KR"), null, "other credit type");
const lots = (await db.query(`select clerk_user_id, remaining from credit_lots where clerk_user_id in ('k1','k2','k3','k4','k5') order by clerk_user_id`)).rows;
assert.deepEqual(lots.map((l) => l.remaining), [1, 0, 1, 1, 1], "read only: nothing spent");
console.log("ok - other-site credit hint: unused, unexpired, that market only; nothing spent");
await db.end();
