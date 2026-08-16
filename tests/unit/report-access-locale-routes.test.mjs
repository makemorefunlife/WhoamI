/**
 * Regression coverage for the "route resolves a request locale but forgets
 * to pass it into the ownership guard" bug, found across several report/
 * relationship API routes: app/api/v2/deep/essence, app/api/report/session-status,
 * app/api/my/report (GET + POST), app/api/relationship/analyze/basic,
 * app/api/relationship/analyze/premium, app/api/relationship/detail, and
 * app/api/llm (integrated mode — this one resolved locale AFTER the access
 * check rather than not passing it at all; fixed by hoisting the single
 * `normalizeLocale(...)` call above assertOwnedReportAccess).
 *
 * Two layers of coverage:
 *  1. Behavioral — assertOwnedReportAccess itself returns locale-correct
 *     401/403/404 error bodies, and owner access is unaffected by locale.
 *  2. Source guard — statically confirms each fixed route file actually
 *     threads `locale` into its access-assertion call (and, for llm/route.ts,
 *     that locale is resolved before that call and only once in the file),
 *     so the omission can't silently regress.
 *
 * Run: npx tsx tests/unit/report-access-locale-routes.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

function mockSupabase(reportRow) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: reportRow, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`[OK] ${name}`);
}

function readRoute(relPath) {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

/** Collapse whitespace so multi-line call sites match a single-line needle. */
function squash(src) {
  return src.replace(/\s+/g, "");
}

async function run() {
  const { assertOwnedReportAccess } = await import(
    "../../lib/report/assertOwnedReportAccess.ts"
  );

  // --- Behavioral: locale-correct error bodies for every status these two routes rely on ---

  // 401 — unauthenticated (session-status and essence both hit this before ownership lookup)
  {
    const rEn = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_a" }),
      "r1",
      null,
      "en-US",
    );
    const rKo = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_a" }),
      "r1",
      null,
      "ko-KR",
    );
    assert.equal(rEn.error?.status, 401);
    assert.equal(rKo.error?.status, 401);
    const enBody = await rEn.error.json();
    const koBody = await rKo.error.json();
    assert.notEqual(enBody.error, koBody.error, "401 message must differ by locale");
    ok("401 unauthenticated → localized message (en-US vs ko-KR differ)");
  }

  // 403 — report exists but belongs to someone else
  {
    const rEn = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_b" }),
      "r1",
      "user_a",
      "en-US",
    );
    const rKo = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_b" }),
      "r1",
      "user_a",
      "ko-KR",
    );
    assert.equal(rEn.error?.status, 403);
    assert.equal(rKo.error?.status, 403);
    const enBody = await rEn.error.json();
    const koBody = await rKo.error.json();
    assert.notEqual(enBody.error, koBody.error, "403 message must differ by locale");
    ok("403 forbidden → localized message (en-US vs ko-KR differ)");
  }

  // 404 — report row missing (session-status specifically branches on this status)
  {
    const rEn = await assertOwnedReportAccess(
      mockSupabase(null),
      "missing-report",
      "user_a",
      "en-US",
    );
    const rKo = await assertOwnedReportAccess(
      mockSupabase(null),
      "missing-report",
      "user_a",
      "ko-KR",
    );
    assert.equal(rEn.error?.status, 404);
    assert.equal(rKo.error?.status, 404);
    const enBody = await rEn.error.json();
    const koBody = await rKo.error.json();
    assert.notEqual(enBody.error, koBody.error, "404 message must differ by locale");
    ok("404 not found → localized message (en-US vs ko-KR differ)");
  }

  // Owner access — success path must be locale-independent (no behavior change)
  {
    const rEn = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_a" }),
      "r1",
      "user_a",
      "en-US",
    );
    const rKo = await assertOwnedReportAccess(
      mockSupabase({ id: "r1", clerk_user_id: "user_a" }),
      "r1",
      "user_a",
      "ko-KR",
    );
    assert.equal(rEn.error, undefined);
    assert.equal(rKo.error, undefined);
    assert.equal(rEn.report?.id, "r1");
    assert.equal(rKo.report?.id, "r1");
    ok("owner access succeeds identically regardless of locale");
  }

  // --- Source guard: the two fixed routes must actually thread `locale` through ---

  {
    const src = readRoute("app/api/v2/deep/essence/route.ts");
    assert.ok(
      !src.includes("assertGuestOrOwnerReportAccess"),
      "essence/route.ts must no longer use the deprecated assertGuestOrOwnerReportAccess wrapper",
    );
    assert.match(
      src,
      /import\s*\{\s*assertOwnedReportAccess\s*\}\s*from\s*"@\/lib\/report\/assertOwnedReportAccess";/,
      "essence/route.ts must import assertOwnedReportAccess directly",
    );
    assert.ok(
      squash(src).includes(
        "assertOwnedReportAccess(supabase,reportId,userId,locale,",
      ) || squash(src).includes(
        "assertOwnedReportAccess(supabase,reportId,userId,locale)",
      ),
      "essence/route.ts must pass the resolved locale into assertOwnedReportAccess",
    );
    ok("app/api/v2/deep/essence/route.ts threads locale into assertOwnedReportAccess");
  }

  {
    const src = readRoute("app/api/report/session-status/route.ts");
    assert.ok(
      squash(src).includes(
        "assertOwnedReportAccess(supabase,reportId,userId,locale)",
      ),
      "session-status/route.ts must pass the resolved locale into assertOwnedReportAccess",
    );
    ok("app/api/report/session-status/route.ts threads locale into assertOwnedReportAccess");
  }

  // --- Follow-up batch: my/report, analyze/basic, analyze/premium, relationship/detail ---

  {
    const src = readRoute("app/api/my/report/route.ts");
    const squashed = squash(src);
    const needle = "assertGuestOrOwnerReportAccess(supabase,reportId,userId,locale,";
    const occurrences = squashed.split(needle).length - 1;
    assert.equal(
      occurrences,
      2,
      "my/report/route.ts must thread locale into both assertGuestOrOwnerReportAccess call sites (GET and POST)",
    );
    ok("app/api/my/report/route.ts threads locale into both assertGuestOrOwnerReportAccess call sites");
  }

  {
    const src = readRoute("app/api/relationship/analyze/basic/route.ts");
    assert.ok(
      squash(src).includes(
        "assertOwnedViewerParticipantAccess(supabase,userId,viewerReportId,rr.report_id_a,rr.report_id_b,locale,",
      ),
      "analyze/basic/route.ts must pass the resolved locale into assertOwnedViewerParticipantAccess",
    );
    ok("app/api/relationship/analyze/basic/route.ts threads locale into assertOwnedViewerParticipantAccess");
  }

  {
    const src = readRoute("app/api/relationship/analyze/premium/route.ts");
    assert.ok(
      squash(src).includes(
        "assertOwnedViewerParticipantAccess(supabase,userId,viewerReportId,rr.report_id_a,rr.report_id_b,locale,",
      ),
      "analyze/premium/route.ts must pass the resolved locale into assertOwnedViewerParticipantAccess",
    );
    ok("app/api/relationship/analyze/premium/route.ts threads locale into assertOwnedViewerParticipantAccess");
  }

  {
    const src = readRoute("app/api/relationship/detail/route.ts");
    assert.ok(
      squash(src).includes(
        "assertOwnedViewerParticipantAccess(supabase,userId,viewerReportId,rr.report_id_a,rr.report_id_b,locale,",
      ),
      "relationship/detail/route.ts must pass the resolved locale into assertOwnedViewerParticipantAccess",
    );
    ok("app/api/relationship/detail/route.ts threads locale into assertOwnedViewerParticipantAccess");
  }

  // --- Final closeout: app/api/llm/route.ts (integrated mode) ---
  // Locale resolution was previously computed AFTER assertOwnedReportAccess,
  // so access-control error bodies (401/403/404) never respected the
  // request's locale even though the LLM prompts further down did. Fixed by
  // hoisting the single `normalizeLocale(...)` call above the access check
  // and reusing that one `locale` binding for everything downstream.
  {
    const src = readRoute("app/api/llm/route.ts");
    const squashed = squash(src);

    const localeDeclIdx = src.indexOf("const locale = normalizeLocale(");
    const accessCallIdx = src.indexOf("await assertOwnedReportAccess(");
    assert.ok(
      localeDeclIdx !== -1 && accessCallIdx !== -1,
      "llm/route.ts must contain both a locale resolution and an assertOwnedReportAccess call",
    );
    assert.ok(
      localeDeclIdx < accessCallIdx,
      "llm/route.ts must resolve locale BEFORE calling assertOwnedReportAccess",
    );
    ok("app/api/llm/route.ts resolves locale before assertOwnedReportAccess");

    assert.ok(
      squashed.includes(
        "assertOwnedReportAccess(supabase,idCheck.value,userId,locale,",
      ),
      "llm/route.ts must pass the resolved locale into assertOwnedReportAccess",
    );
    ok("app/api/llm/route.ts threads locale into assertOwnedReportAccess");

    const normalizeLocaleCallCount = (
      src.match(/normalizeLocale\(/g) ?? []
    ).length;
    assert.equal(
      normalizeLocaleCallCount,
      1,
      "llm/route.ts must have exactly one locale resolution (single locale authority) — no duplicate independent resolution left later in the same path",
    );
    ok("app/api/llm/route.ts has a single locale authority (no duplicate resolution)");
  }

  console.log(`\n${passed} tests passed`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
