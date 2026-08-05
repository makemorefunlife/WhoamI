/**
 * Integration: first survey-save 503 from broken Upstash REST → fixed path.
 * Reproduces Production failure after UPSTASH_* was set but REST call fails
 * (TCP URL, auth error, or network), without raising thresholds.
 *
 * Run: npx tsx tests/unit/survey-save-upstash-503.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.NODE_ENV = "development";
delete process.env.VERCEL_ENV;
delete process.env.RATE_LIMIT_DEV_UNLIMITED;
process.env.RATE_LIMIT_ALLOW_MEMORY = "true";

const {
  resetRateLimitMemoryForTests,
  setRateLimitFetchForTests,
  enforceRateLimit,
  resolveRemoteRateLimitConfig,
  isHttpsRestRateLimitUrl,
  rateLimitResponse,
} = await import("../../lib/security/rateLimit.ts");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

function restoreEnv(snapshot) {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function snapEnv(keys) {
  const s = {};
  for (const k of keys) s[k] = process.env[k];
  return s;
}

const ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "RATE_LIMIT_ALLOW_MEMORY",
  "NODE_ENV",
  "VERCEL_ENV",
  "RATE_LIMIT_DEV_UNLIMITED",
];

/**
 * Exact final-submit order (matches createOwnedReportIdempotent + finalizeSurveySubmit):
 * 1) GET /api/home/resume — no rate-limit bucket
 * 2) If no reportId → POST /api/report/create (bucket report_create) FIRST
 * 3) Else skip create → POST /api/v2/survey (bucket survey_write) FIRST
 */
async function simulateFinalSubmitRateGates(opts) {
  const { hasExistingReport, userId } = opts;
  const sequence = [];
  if (!hasExistingReport) {
    const create = await enforceRateLimit("report_create", userId);
    sequence.push({
      endpoint: "POST /api/report/create",
      bucket: "report_create",
      key: `rl:report_create:${userId}`,
      result: create,
    });
    if (!create.ok) return sequence;
  }
  const survey = await enforceRateLimit("survey_write", userId);
  sequence.push({
    endpoint: "POST /api/v2/survey",
    bucket: "survey_write",
    key: `rl:survey_write:${userId}`,
    result: survey,
  });
  return sequence;
}

async function run() {
  // --- URL classifier ---
  {
    assert.equal(isHttpsRestRateLimitUrl("https://x.upstash.io"), true);
    assert.equal(
      isHttpsRestRateLimitUrl("rediss://default:tok@x.upstash.io:6379"),
      false,
    );
    assert.equal(
      isHttpsRestRateLimitUrl("redis://default:tok@x.upstash.io:6379"),
      false,
    );
    assert.equal(isHttpsRestRateLimitUrl("http://x.upstash.io"), false);
    ok("REST URL classifier rejects TCP / non-https");
  }

  // --- Reproduce pre-fix first 503: https URL configured, REST auth fails ---
  // (This is the Production shape after user set UPSTASH_* but token/URL wrong.)
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "not-a-valid-rest-token";
    delete process.env.RATE_LIMIT_ALLOW_MEMORY;

    let upstashHttpStatus = 0;
    let upstashCmd = "";
    setRateLimitFetchForTests(async (_url, init) => {
      const body = JSON.parse(init.body);
      upstashCmd = Array.isArray(body) ? String(body[0]) : "";
      upstashHttpStatus = 401;
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      };
    });

    resetRateLimitMemoryForTests();
    // Existing owner (resume returns reportId) → survey POST is first write gate
    const seq = await simulateFinalSubmitRateGates({
      hasExistingReport: true,
      userId: "user_existing_owner",
    });
    assert.equal(seq.length, 1);
    assert.equal(seq[0].endpoint, "POST /api/v2/survey");
    assert.equal(seq[0].bucket, "survey_write");
    assert.equal(seq[0].key, "rl:survey_write:user_existing_owner");
    assert.equal(upstashCmd, "INCR");
    assert.equal(upstashHttpStatus, 401);
    // AFTER fix: memory fallback → ok (not 503)
    assert.equal(seq[0].result.ok, true);
    ok(
      "existing report: first gate is survey_write; Upstash 401 no longer 503s save",
    );
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- New user: report/create fails first when remote broken (pre-fix would 503) ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "bad";
    setRateLimitFetchForTests(async () => {
      throw new Error("network down");
    });
    resetRateLimitMemoryForTests();
    const seq = await simulateFinalSubmitRateGates({
      hasExistingReport: false,
      userId: "user_new",
    });
    assert.equal(seq[0].endpoint, "POST /api/report/create");
    assert.equal(seq[0].bucket, "report_create");
    assert.equal(seq[0].result.ok, true);
    assert.equal(seq[1].endpoint, "POST /api/v2/survey");
    assert.equal(seq[1].result.ok, true);
    ok("new user: report_create is first gate; remote down falls back to memory");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- TCP endpoint in REST_URL must not be treated as configured remote ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL =
      "rediss://default:password@example.upstash.io:6379";
    process.env.UPSTASH_REDIS_REST_TOKEN = "password-or-token";
    assert.equal(resolveRemoteRateLimitConfig(), null);
    resetRateLimitMemoryForTests();
    const r = await enforceRateLimit("survey_write", "user_tcp");
    assert.equal(r.ok, true);
    ok("TCP redis URL is ignored → memory path (not fail-closed 503)");
    restoreEnv(snap);
  }

  // --- Document exact pre-fix HTTP body when remote fails without fallback ---
  {
    const body = {
      error: "temporarily unavailable",
      code: "rate_limit_backend_unavailable",
    };
    const res = rateLimitResponse({
      ok: false,
      status: 503,
      error: body.error,
      code: body.code,
    });
    assert.equal(res.status, 503);
    const json = await res.json();
    assert.deepEqual(json, body);
    ok("pre-fix first failure body: 503 + temporarily unavailable + code");
  }

  // --- Healthy REST still uses INCR then EXPIRE on first hit ---
  {
    const snap = snapEnv(ENV_KEYS);
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "ok-token";
    const calls = [];
    setRateLimitFetchForTests(async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      const cmd = body[0];
      if (cmd === "INCR") {
        return { ok: true, status: 200, json: async () => ({ result: 1 }) };
      }
      if (cmd === "EXPIRE") {
        return { ok: true, status: 200, json: async () => ({ result: 1 }) };
      }
      return { ok: false, status: 500, json: async () => ({ error: "nope" }) };
    });
    const r = await enforceRateLimit("survey_write", "user_ok");
    assert.equal(r.ok, true);
    assert.equal(calls[0][0], "INCR");
    assert.equal(calls[0][1], "rl:survey_write:user_ok");
    assert.equal(calls[1][0], "EXPIRE");
    assert.equal(calls[1][1], "rl:survey_write:user_ok");
    assert.equal(typeof calls[1][2], "number");
    ok("healthy REST: INCR then EXPIRE on first hit");
    restoreEnv(snap);
    setRateLimitFetchForTests(null);
  }

  // --- Independent request format matches Upstash REST docs ---
  {
    const src = fs.readFileSync("lib/security/rateLimit.ts", "utf8");
    assert.match(src, /JSON\.stringify\(command\)/);
    assert.match(src, /Authorization:\s*`Bearer \$\{config\.token\}`/);
    assert.match(src, /\["INCR", key\]/);
    assert.match(src, /\["EXPIRE", key, windowSec\]/);
    ok("Upstash request format: POST JSON array + Bearer (docs-compatible)");
  }

  // --- Thresholds unchanged for cost-bearing buckets ---
  {
    const { getRateLimitMaxForTests } = await import(
      "../../lib/security/rateLimit.ts"
    );
    assert.equal(getRateLimitMaxForTests("llm"), 5);
    assert.equal(getRateLimitMaxForTests("relationship_premium"), 3);
    assert.equal(getRateLimitMaxForTests("survey_write"), 60);
    ok("thresholds unchanged (no hide-by-raising-limits)");
  }

  console.log(`\n${passed} passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
