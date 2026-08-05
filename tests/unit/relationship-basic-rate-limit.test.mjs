/**
 * Relationship basic rate-limit product policy regressions (no remote DB).
 * Run: npx tsx tests/unit/relationship-basic-rate-limit.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.NODE_ENV = "development";
process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
delete process.env.VERCEL_ENV;
delete process.env.RATE_LIMIT_DEV_UNLIMITED;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const {
  resetRateLimitMemoryForTests,
  enforceRateLimit,
  releaseRateLimitSlot,
  resetOwnRateLimitBucket,
  peekRateLimitBucketStatus,
  getRateLimitMaxForTests,
  rateLimitResponse,
  isSelfResetableRateLimitBucket,
} = await import("../../lib/security/rateLimit.ts");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

async function run() {
  // --- buckets separate ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_sep";
    const basicMax = getRateLimitMaxForTests("relationship_basic");
    for (let i = 0; i < basicMax; i++) {
      assert.equal((await enforceRateLimit("relationship_basic", uid)).ok, true);
    }
    assert.equal((await enforceRateLimit("relationship_basic", uid)).ok, false);
    assert.equal((await enforceRateLimit("relationship_premium", uid)).ok, true);
    assert.equal((await enforceRateLimit("llm", uid)).ok, true);
    ok("basic and premium/llm buckets are separate");
  }

  // --- failed request refund ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_refund";
    const max = getRateLimitMaxForTests("relationship_basic");
    for (let i = 0; i < max; i++) {
      assert.equal((await enforceRateLimit("relationship_basic", uid)).ok, true);
    }
    assert.equal((await enforceRateLimit("relationship_basic", uid)).ok, false);
    await releaseRateLimitSlot("relationship_basic", uid);
    assert.equal((await enforceRateLimit("relationship_basic", uid)).ok, true);
    ok("failed request refund restores one usable slot");
  }

  // --- Retry-After ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_ra";
    const max = getRateLimitMaxForTests("relationship_basic");
    for (let i = 0; i < max; i++) {
      await enforceRateLimit("relationship_basic", uid);
    }
    const blocked = await enforceRateLimit("relationship_basic", uid);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterSec >= 1);
    const res = rateLimitResponse(blocked);
    assert.equal(res.status, 429);
    assert.ok(res.headers.get("Retry-After"));
    ok("rate-limit response includes Retry-After");
  }

  // --- self reset cannot target another user (API contract) ---
  {
    resetRateLimitMemoryForTests();
    const owner = "user_owner";
    const other = "user_other";
    const max = getRateLimitMaxForTests("relationship_basic");
    for (let i = 0; i < max; i++) {
      await enforceRateLimit("relationship_basic", owner);
      await enforceRateLimit("relationship_basic", other);
    }
    assert.equal((await enforceRateLimit("relationship_basic", owner)).ok, false);
    assert.equal((await enforceRateLimit("relationship_basic", other)).ok, false);

    const reset = await resetOwnRateLimitBucket("relationship_basic", owner);
    assert.equal(reset.ok, true);
    assert.equal((await enforceRateLimit("relationship_basic", owner)).ok, true);
    assert.equal((await enforceRateLimit("relationship_basic", other)).ok, false);
    ok("resetOwnRateLimitBucket only clears the provided subject");
  }

  // --- premium/llm not self-resetable ---
  {
    assert.equal(isSelfResetableRateLimitBucket("relationship_basic"), true);
    assert.equal(isSelfResetableRateLimitBucket("relationship_premium"), false);
    assert.equal(isSelfResetableRateLimitBucket("llm"), false);
    ok("paid premium/llm buckets are not self-resetable");
  }

  // --- peek does not expose subject ---
  {
    resetRateLimitMemoryForTests();
    await enforceRateLimit("relationship_basic", "user_peek");
    const status = await peekRateLimitBucketStatus(
      "relationship_basic",
      "user_peek",
    );
    assert.ok(status);
    const json = JSON.stringify(status);
    assert.ok(!json.includes("user_peek"));
    assert.ok(!json.includes("rl:"));
    ok("peek status omits subject and redis key");
  }

  // --- client single-flight + no retry storm ---
  {
    const client = fs.readFileSync(
      "app/relationship/[id]/useRelationshipDetail.ts",
      "utf8",
    );
    assert.match(client, /basicInFlight/);
    assert.match(client, /if \(basicInFlight\.current\) return/);
    assert.ok(!/ensureBasic[\s\S]{0,400}setTimeout/.test(client));
    assert.ok(
      !/!res\.ok[\s\S]{0,200}ensureBasic\(/.test(client),
      "failed ensureBasic must not auto-retry",
    );
    ok("one click / in-flight makes one request; no failure retry storm");
  }

  // --- basic route consumes after validation ---
  {
    const route = fs.readFileSync(
      "app/api/relationship/analyze/basic/route.ts",
      "utf8",
    );
    const accessIdx = route.indexOf("assertOwnedViewerParticipantAccess");
    const limitIdx = route.indexOf('enforceRateLimit("relationship_basic"');
    const openaiIdx = route.indexOf("openai.chat.completions.create");
    assert.ok(accessIdx > 0 && limitIdx > accessIdx && openaiIdx > limitIdx);
    assert.match(route, /releaseRateLimitSlot\("relationship_basic"/);
    assert.match(route, /rateLimitResponse/);
    ok("basic route rate-limits only before OpenAI and refunds on failure");
  }

  // --- admin route ignores client userId ---
  {
    const admin = fs.readFileSync(
      "app/api/admin/rate-limit-reset/route.ts",
      "utf8",
    );
    assert.match(admin, /RATE_LIMIT_RESET_SECRET/);
    assert.match(admin, /x-rate-limit-reset-secret/);
    assert.match(admin, /resetOwnRateLimitBucket/);
    assert.match(admin, /void body\.userId/);
    assert.ok(!/resetOwnRateLimitBucket\([\s\S]*body\.userId/.test(admin));
    ok("admin reset uses auth subject only; ignores body.userId");
  }

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
