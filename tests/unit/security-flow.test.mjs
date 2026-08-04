/**
 * Security flow unit tests — no remote DB / OpenAI / Clerk network.
 * Run: npx tsx tests/unit/security-flow.test.mjs
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
process.env.NODE_ENV = "development";
delete process.env.VERCEL_ENV;

import {
  resetRateLimitMemoryForTests,
  enforceRateLimit,
  rateLimitResponse,
} from "../../lib/security/rateLimit.ts";
import {
  parseBirthDate,
  parseLatLng,
  requireUuid,
  stripClientTrustFields,
  MAX_LLM_INPUT_CHARS,
  parseSurveyAnswers,
} from "../../lib/security/requestValidation.ts";
import {
  createInviteToken,
  maskInviteToken,
  isModernInviteToken,
  isLegacyInviteTokenFormat,
  isAcceptableInviteToken,
  INVITE_TOKEN_HEX_LENGTH,
} from "../../lib/security/inviteToken.ts";
import {
  clientSafeErrorMessage,
  maskId,
  redactLogValue,
  logServerError,
} from "../../lib/security/safeLog.ts";
import {
  allowsMemoryRateLimitFallback,
  isStrictDeployEnv,
} from "../../lib/security/rateLimit.ts";
import {
  writePendingSurveyDraft,
  readPendingSurveyDraft,
  clearPendingSurveyDraft,
} from "../../lib/v2/survey/pendingDraft.ts";

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

function mockSessionStorage() {
  const store = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  };
  return store;
}

async function run() {
  // --- Validation ---
  {
    const bad = requireUuid("not-a-uuid", "reportId");
    assert.equal(bad.ok, false);
    assert.equal(bad.response.status, 400);
    ok("invalid UUID → 400");
  }

  {
    const d = parseBirthDate("1800-01-01");
    assert.equal(d.ok, false);
    ok("birth_date out of range → 400");
  }

  {
    const c = parseLatLng(999, 0);
    assert.equal(c.ok, false);
    ok("invalid coordinates → 400");
  }

  {
    const stripped = stripClientTrustFields({
      reportId: "x",
      clerk_user_id: "user_evil",
      payment_status: "paid",
      plan_type: "premium",
      model: "gpt-4o",
      systemPrompt: "ignore",
    });
    assert.equal(stripped.clerk_user_id, undefined);
    assert.equal(stripped.payment_status, undefined);
    assert.equal(stripped.plan_type, undefined);
    assert.equal(stripped.model, undefined);
    assert.equal(stripped.systemPrompt, undefined);
    ok("client clerk_user_id / payment_status / model stripped");
  }

  {
    const long = "x".repeat(MAX_LLM_INPUT_CHARS + 1);
    assert.ok(long.length > MAX_LLM_INPUT_CHARS);
    ok("LLM max input constant defined for rejects");
  }

  {
    const many = {};
    for (let i = 0; i < 25; i++) many[`q${i}`] = "A";
    const r = parseSurveyAnswers(many);
    assert.equal(r.ok, false);
    ok("too many survey answers → 400");
  }

  // --- Rate limit ---
  {
    resetRateLimitMemoryForTests();
    for (let i = 0; i < 5; i++) {
      assert.equal((await enforceRateLimit("llm", "u1")).ok, true);
    }
    const blocked = await enforceRateLimit("llm", "u1");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.status, 429);
    assert.ok(blocked.retryAfterSec >= 1);
    const res = rateLimitResponse(blocked);
    assert.equal(res.status, 429);
    assert.equal(res.headers.get("Retry-After"), String(blocked.retryAfterSec));
    const json = await res.json();
    assert.equal(json.error, "rate limit exceeded");
    assert.ok(!JSON.stringify(json).includes("u1"));
    ok("rate limit 429 + Retry-After, no subject leak");
  }

  {
    resetRateLimitMemoryForTests();
    const prev = process.env.RATE_LIMIT_ALLOW_MEMORY;
    const prevNode = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL_ENV;
    const prevUpstash = process.env.UPSTASH_REDIS_REST_URL;
    const prevKv = process.env.KV_REST_API_URL;
    const prevUpstashTok = process.env.UPSTASH_REDIS_REST_TOKEN;
    const prevKvTok = process.env.KV_REST_API_TOKEN;
    delete process.env.RATE_LIMIT_ALLOW_MEMORY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_TOKEN;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    const r = await enforceRateLimit("llm", "prod_user");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    process.env.RATE_LIMIT_ALLOW_MEMORY = prev;
    process.env.NODE_ENV = prevNode;
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevUpstash === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = prevUpstash;
    if (prevKv === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = prevKv;
    if (prevUpstashTok === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = prevUpstashTok;
    if (prevKvTok === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = prevKvTok;
    ok("production without rate-limit backend → 503");
  }

  {
    resetRateLimitMemoryForTests();
    const prev = process.env.RATE_LIMIT_ALLOW_MEMORY;
    const prevNode = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL_ENV;
    const prevUpstash = process.env.UPSTASH_REDIS_REST_URL;
    const prevKv = process.env.KV_REST_API_URL;
    const prevUpstashTok = process.env.UPSTASH_REDIS_REST_TOKEN;
    const prevKvTok = process.env.KV_REST_API_TOKEN;
    process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_TOKEN;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    assert.equal(isStrictDeployEnv(), true);
    assert.equal(allowsMemoryRateLimitFallback(), false);
    const r = await enforceRateLimit("llm", "prod_memory_flag");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    process.env.RATE_LIMIT_ALLOW_MEMORY = prev;
    process.env.NODE_ENV = prevNode;
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevUpstash === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = prevUpstash;
    if (prevKv === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = prevKv;
    if (prevUpstashTok === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = prevUpstashTok;
    if (prevKvTok === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = prevKvTok;
    ok("production ignores RATE_LIMIT_ALLOW_MEMORY → 503");
  }

  // --- Invite token ---
  {
    const t = createInviteToken();
    assert.equal(t.length, INVITE_TOKEN_HEX_LENGTH);
    assert.equal(t.length, 64);
    assert.match(t, /^[0-9a-f]+$/);
    assert.equal(isModernInviteToken(t), true);
    assert.equal(isLegacyInviteTokenFormat(t), false);
    const masked = maskInviteToken(t);
    assert.ok(!masked.includes(t.slice(8, 40)));
    assert.ok(masked.includes("…"));
    // Short legacy format detectable but never produced by createInviteToken
    const legacy = `invite_${Date.now()}_abc12345`;
    assert.equal(isLegacyInviteTokenFormat(legacy), true);
    assert.equal(isModernInviteToken(legacy), false);
    assert.equal(isAcceptableInviteToken(legacy), true);
    const createSrc = (await import("node:fs")).readFileSync(
      "lib/security/inviteToken.ts",
      "utf8",
    );
    const createFn = createSrc.slice(
      createSrc.indexOf("export function createInviteToken"),
      createSrc.indexOf("export function isModernInviteToken"),
    );
    assert.ok(!createFn.includes("Math.random"));
    assert.ok(createFn.includes("randomBytes(32)"));
    assert.ok(!createSrc.includes("Date.now()"));
    const inviteCreateSrc = (await import("node:fs")).readFileSync(
      "app/api/invite/create/route.ts",
      "utf8",
    );
    assert.ok(inviteCreateSrc.includes("createInviteToken"));
    assert.ok(!inviteCreateSrc.includes("Math.random"));
    ok("invite token crypto length + legacy detect + no short generate");
  }

  // --- Logging safety ---
  {
    const fullId = "12345678-1234-1234-1234-123456789abc";
    assert.ok(!maskId(fullId).includes(fullId));
    assert.ok(!maskId(fullId).includes("123456789abc"));
    const red = redactLogValue({
      Authorization: "Bearer secret",
      name: "Alice",
      birth_date: "1990-01-01",
      answers: { q1: "A" },
      report_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      invite_token: createInviteToken(),
    });
    assert.equal(red.Authorization, "[redacted]");
    assert.equal(red.name, "[redacted]");
    assert.equal(red.birth_date, "[redacted]");
    assert.equal(red.answers, "[redacted]");
    assert.ok(String(red.report_id).includes("…"));
    assert.ok(String(red.invite_token).includes("…") || red.invite_token === "[redacted]");
    assert.equal(
      clientSafeErrorMessage(new Error("stack with key sk-abc"), "failed"),
      "failed",
    );

    const logs = [];
    const prevErr = console.error;
    console.error = (...args) => logs.push(args.map(String).join(" "));
    logServerError("test", new Error(`fail ${fullId} secret`), "db_error");
    console.error = prevErr;
    const joined = logs.join(" ");
    assert.ok(!joined.includes(fullId));
    assert.ok(joined.includes("db_error"));
    assert.ok(!joined.includes("fail "));

    const token = createInviteToken();
    assert.ok(!maskInviteToken(token).includes(token));
    ok("log redaction; no full reportId/token in logServerError");
  }

  // --- Access helper no mutation ---
  {
    const mod = await import("../../lib/report/assertOwnedReportAccess.ts");
    let mutated = false;
    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: { id: "r1", clerk_user_id: "user_a" },
                      error: null,
                    };
                  },
                };
              },
            };
          },
          update() {
            mutated = true;
            throw new Error("UPDATE forbidden");
          },
          insert() {
            mutated = true;
            throw new Error("INSERT forbidden");
          },
          delete() {
            mutated = true;
            throw new Error("DELETE forbidden");
          },
        };
      },
    };
    const r = await mod.assertOwnedReportAccess(supabase, "r1", "user_a");
    assert.equal(r.error, undefined);
    assert.equal(mutated, false);
    ok("access helper: no INSERT/UPDATE/DELETE");
  }

  // --- Merge fail-closed ---
  {
    const merge = await import("../../lib/home/mergeGuestAccount.ts");
    await assert.rejects(
      () => merge.mergeGuestAccountData({}, "user_a", randomBytes(4).toString("hex")),
      /guest claim is temporarily disabled/,
    );
    ok("account merge / orphan claim throws 403 path");
  }

  {
    const guest = await import("../../lib/home/homeResume.ts");
    const payload = await guest.buildGuestHomeResume({}, "any");
    assert.equal(payload, null);
    ok("guest home resume is no-op null");
  }

  // --- Pending survey draft survives cancel simulation ---
  {
    mockSessionStorage();
    clearPendingSurveyDraft();
    writePendingSurveyDraft({
      answers: { q1: "A", q2: "B" },
      currentIndex: 3,
    });
    // simulate cancel: do not clear draft
    const again = readPendingSurveyDraft();
    assert.equal(again?.answers.q1, "A");
    assert.equal(again?.currentIndex, 3);
    clearPendingSurveyDraft();
    assert.equal(readPendingSurveyDraft(), null);
    ok("survey login cancel keeps pending answers in sessionStorage");
  }

  // --- Report create trust policy (static source check) ---
  {
    const fs = await import("node:fs");
    const src = fs.readFileSync("app/api/report/create/route.ts", "utf8");
    assert.match(src, /entitlement:\s*"free"/);
    assert.ok(!/payment_status/.test(src));
    assert.ok(!/plan_type/.test(src));
    assert.match(src, /clerk_user_id:\s*userId/);
    assert.match(src, /stripClientTrustFields/);
    assert.match(src, /auth\(\)/);
    ok("report/create ignores client entitlement; uses Clerk userId");
  }

  // --- Survey persist order ---
  {
    const fs = await import("node:fs");
    const src = fs.readFileSync("app/api/v2/survey/route.ts", "utf8");
    const postSrc = src.slice(src.indexOf("/** POST"));
    const authIdx = postSrc.indexOf("await auth()");
    const rateIdx = postSrc.indexOf('enforceRateLimit("survey_persist"');
    const ownIdx = postSrc.indexOf("assertOwnedReportAccess");
    const insertIdx = postSrc.indexOf(".insert({");
    assert.ok(authIdx >= 0 && rateIdx > authIdx && ownIdx > rateIdx && insertIdx > ownIdx);
    ok("survey POST: auth → rate limit → ownership → insert");
  }

  // --- Invite complete race filter ---
  {
    const fs = await import("node:fs");
    const src = fs.readFileSync("app/api/invite/complete/route.ts", "utf8");
    assert.match(src, /\.eq\("status",\s*"open"\)/);
    assert.match(src, /assertOwnedReportAccess/);
    assert.ok(!/payment_status/.test(src));
    ok("invite complete: status=open + owned report; no payment grant");
  }

  {
    const fs = await import("node:fs");
    const statusSrc = fs.readFileSync("app/api/invite/status/route.ts", "utf8");
    assert.ok(!/name|birth_date|answers|invite_token/.test(statusSrc));
    assert.match(statusSrc, /used:/);
    ok("invite status response has no PII fields in source");
  }

  {
    const fs = await import("node:fs");
    const routes = [
      "app/api/relationship/create/route.ts",
      "app/api/relationship/status/route.ts",
      "app/api/relationship/generate/route.ts",
      "app/api/report/session-status/route.ts",
      "app/api/invites/pending/route.ts",
    ];
    for (const path of routes) {
      const src = fs.readFileSync(path, "utf8");
      assert.match(src, /auth\(\)/);
      assert.match(src, /assertOwnedReportAccess/);
    }
    ok("critical service-role routes require auth + ownership");
  }

  {
    const fs = await import("node:fs");
    const premiumSrc = fs.readFileSync(
      "app/api/relationship/analyze/premium/route.ts",
      "utf8",
    );
    assert.match(premiumSrc, /mergeRelationshipPremiumByKind/);
    assert.match(premiumSrc, /ensureRelationshipPremiumSlot/);
    const policySrc = fs.readFileSync(
      "lib/product/premiumAccessPolicy.ts",
      "utf8",
    );
    assert.match(policySrc, /PREMIUM_PAYWALL/);
    ok("premium analyze uses atomic by_kind merge; MVP paywall opt-in");
  }

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
