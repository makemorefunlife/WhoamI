/**
 * Survey rate-limit split + final-submit single-flight regression.
 * Run: npx tsx tests/unit/survey-submit-rate-limit.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";

process.env.NODE_ENV = "development";
delete process.env.VERCEL_ENV;
delete process.env.RATE_LIMIT_DEV_UNLIMITED;
process.env.RATE_LIMIT_ALLOW_MEMORY = "true";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const {
  resetRateLimitMemoryForTests,
  enforceRateLimit,
  getRateLimitMaxForTests,
} = await import("../../lib/security/rateLimit.ts");

const {
  finalizeSurveySubmit,
  resetFinalizeSurveySubmitForTests,
  isFinalizeSurveySubmitInFlight,
} = await import("../../lib/v2/survey/finalizeSurveySubmit.ts");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

async function run() {
  // --- Bucket ceilings: cost-bearing stay strict; survey ops split ---
  {
    assert.equal(getRateLimitMaxForTests("llm"), 5);
    assert.equal(getRateLimitMaxForTests("relationship_premium"), 3);
    assert.equal(getRateLimitMaxForTests("survey_read"), 300);
    assert.equal(getRateLimitMaxForTests("survey_write"), 60);
    assert.equal(getRateLimitMaxForTests("survey_delete"), 20);
    assert.ok(getRateLimitMaxForTests("survey_read") > getRateLimitMaxForTests("survey_write"));
    ok("premium/llm remain strict; survey buckets split with generous read");
  }

  // --- GET hydration must not consume POST write bucket ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_hydrate_vs_write";
    const writeMax = getRateLimitMaxForTests("survey_write");
    for (let i = 0; i < 40; i++) {
      const r = await enforceRateLimit("survey_read", uid);
      assert.equal(r.ok, true, `read #${i + 1} should pass`);
    }
    for (let i = 0; i < writeMax; i++) {
      const r = await enforceRateLimit("survey_write", uid);
      assert.equal(r.ok, true, `write #${i + 1} after reads should pass`);
    }
    const blocked = await enforceRateLimit("survey_write", uid);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.status, 429);
    // Reads still independent after write exhausted
    const stillRead = await enforceRateLimit("survey_read", uid);
    assert.equal(stillRead.ok, true);
    ok("GET hydration does not consume POST survey_write bucket");
  }

  // --- Normal reload/resume: many reads + few writes stay under write limit ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_reload_resume";
    for (let reload = 0; reload < 25; reload++) {
      const r = await enforceRateLimit("survey_read", uid);
      assert.equal(r.ok, true);
    }
    // One final submit write after many hydrates
    const w = await enforceRateLimit("survey_write", uid);
    assert.equal(w.ok, true);
    ok("reload/resume hydrates do not reach survey write limit");
  }

  // --- Route source: split buckets, no shared survey_persist ---
  {
    const src = fs.readFileSync("app/api/v2/survey/route.ts", "utf8");
    assert.match(src, /enforceRateLimit\("survey_read"/);
    assert.match(src, /enforceRateLimit\("survey_write"/);
    assert.match(src, /enforceRateLimit\("survey_delete"/);
    assert.ok(!/survey_persist/.test(src));
    const page = fs.readFileSync("app/survey-v2/page.tsx", "utf8");
    assert.match(page, /finalizeSurveySubmit/);
    assert.match(page, /submitStartedRef/);
    assert.match(page, /errorShownRef/);
    // Failures must not re-arm pending complete
    assert.ok(
      !/sessionStorage\.setItem\(PENDING_COMPLETE_KEY,\s*"1"\)[\s\S]*saved\.ok/.test(
        page,
      ),
    );
    ok("route + page wire split buckets and single-flight finalize");
  }

  // --- One click → at most one report-create and one survey POST ---
  {
    resetFinalizeSurveySubmitForTests();
    let creates = 0;
    let posts = 0;
    let errors = 0;
    const answers = { q1: "a" };

    const deps = {
      createOwnedReport: async () => {
        creates += 1;
        await new Promise((r) => setTimeout(r, 30));
        return { ok: true, reportId: "rid-1" };
      },
      persistSurvey: async () => {
        posts += 1;
        await new Promise((r) => setTimeout(r, 20));
        return { ok: true };
      },
      scoreAnswers: () => ({ axes: {} }),
      writeLocalSession: () => {},
      clearPendingDraft: () => {},
    };

    const [a, b, c] = await Promise.all([
      finalizeSurveySubmit(answers, deps),
      finalizeSurveySubmit(answers, deps),
      finalizeSurveySubmit(answers, deps),
    ]);

    assert.equal(creates, 1);
    assert.equal(posts, 1);
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(c.ok, true);
    assert.equal(a.reportId, "rid-1");
    assert.equal(isFinalizeSurveySubmitInFlight(), false);
    void errors;
    ok("rapid double-click deduped: one create + one survey POST");
  }

  // --- One failed request → one error path; no retry storm ---
  {
    resetFinalizeSurveySubmitForTests();
    let creates = 0;
    let posts = 0;
    let errorCount = 0;

    const deps = {
      createOwnedReport: async () => {
        creates += 1;
        return { ok: false, error: "temporarily unavailable" };
      },
      persistSurvey: async () => {
        posts += 1;
        return { ok: true };
      },
      scoreAnswers: () => ({ axes: {} }),
      writeLocalSession: () => {},
      clearPendingDraft: () => {},
    };

    const r1 = await finalizeSurveySubmit({ q1: "a" }, deps);
    assert.equal(r1.ok, false);
    if (!r1.ok) errorCount += 1;
    assert.equal(r1.error, "temporarily unavailable");
    assert.equal(creates, 1);
    assert.equal(posts, 0);

    // Caller must not auto-loop; a second call is a deliberate user retry only.
    const r2 = await finalizeSurveySubmit({ q1: "a" }, deps);
    assert.equal(r2.ok, false);
    if (!r2.ok) errorCount += 1;
    assert.equal(creates, 2);
    assert.equal(posts, 0);
    assert.equal(errorCount, 2);
    ok("failed submit does not auto-retry; one error per deliberate call");
  }

  // --- Persist failure: create once, post once, no storm ---
  {
    resetFinalizeSurveySubmitForTests();
    let creates = 0;
    let posts = 0;

    const deps = {
      createOwnedReport: async () => {
        creates += 1;
        return { ok: true, reportId: "rid-fail" };
      },
      persistSurvey: async () => {
        posts += 1;
        return { ok: false, error: "rate limit exceeded" };
      },
      scoreAnswers: () => ({ axes: {} }),
      writeLocalSession: () => {},
      clearPendingDraft: () => {},
    };

    const parallel = await Promise.all([
      finalizeSurveySubmit({ q1: "a" }, deps),
      finalizeSurveySubmit({ q1: "a" }, deps),
      finalizeSurveySubmit({ q1: "a" }, deps),
    ]);

    assert.equal(creates, 1);
    assert.equal(posts, 1);
    assert.ok(parallel.every((r) => r.ok === false));
    ok("one failed request produces one create+POST; no retry storm");
  }

  // --- DELETE bucket independent of write ---
  {
    resetRateLimitMemoryForTests();
    const uid = "user_delete_split";
    const writeMax = getRateLimitMaxForTests("survey_write");
    for (let i = 0; i < writeMax; i++) {
      assert.equal((await enforceRateLimit("survey_write", uid)).ok, true);
    }
    assert.equal((await enforceRateLimit("survey_write", uid)).ok, false);
    assert.equal((await enforceRateLimit("survey_delete", uid)).ok, true);
    ok("DELETE uses separate bucket from POST write");
  }

  console.log(`\n${passed} passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
