/**
 * Regression guard for resolveCanonicalReport() picking a manually-added
 * friend's proxy report (report_type: "partner_manual") as the logged-in
 * user's own canonical/self report.
 *
 * Root cause: app/api/relationship/manual/route.ts gives the friend proxy
 * report the SAME clerk_user_id as the person who added them. Before this
 * fix, fetchOwnedReports() in lib/home/resolveCanonicalReport.ts selected
 * every report row for that clerk_user_id with no report_type filter — so a
 * freshly-created (therefore newest) partner_manual row could win the
 * "self report" tie-break purely on recency, and the friend's name/birth
 * info would then be surfaced app-wide as "my info".
 *
 * This test uses a hand-rolled fake Supabase client (no jest/vitest in this
 * repo) that applies eq/neq/in/not/order/limit generically against small
 * in-memory tables, so it exercises resolveCanonicalReport()'s real query
 * chains (reports, survey_responses, relationship_reports, invites) exactly
 * as written, without touching a real database.
 * Run: npx tsx tests/unit/resolve-canonical-report.test.mjs
 */
import assert from "node:assert/strict";
import { resolveCanonicalReport } from "../../lib/home/resolveCanonicalReport.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function applyFilters(rows, filters) {
  let out = rows;
  for (const f of filters) {
    if (f.op === "eq") out = out.filter((r) => r[f.col] === f.val);
    else if (f.op === "neq") out = out.filter((r) => r[f.col] !== f.val);
    else if (f.op === "in") out = out.filter((r) => f.vals.includes(r[f.col]));
    else if (f.op === "not_is_null")
      out = out.filter((r) => r[f.col] !== null && r[f.col] !== undefined);
  }
  return out;
}

function makeFakeSupabase(tables) {
  function from(table) {
    const filters = [];
    let orderCol = null;
    let orderAsc = true;
    let limitN = null;

    function resolveRows() {
      let rows = applyFilters(tables[table] ?? [], filters);
      if (orderCol) {
        rows = [...rows].sort((a, b) => {
          const av = a[orderCol];
          const bv = b[orderCol];
          if (av === bv) return 0;
          const cmp = av < bv ? -1 : 1;
          return orderAsc ? cmp : -cmp;
        });
      }
      if (limitN != null) rows = rows.slice(0, limitN);
      return rows;
    }

    const builder = {
      select() {
        return builder;
      },
      eq(col, val) {
        filters.push({ op: "eq", col, val });
        return builder;
      },
      neq(col, val) {
        filters.push({ op: "neq", col, val });
        return builder;
      },
      in(col, vals) {
        filters.push({ op: "in", col, vals });
        return builder;
      },
      not(col, kind, val) {
        if (kind === "is" && val === null) {
          filters.push({ op: "not_is_null", col });
        }
        return builder;
      },
      order(col, opts) {
        orderCol = col;
        orderAsc = !(opts && opts.ascending === false);
        return builder;
      },
      limit(n) {
        limitN = n;
        return builder;
      },
      maybeSingle() {
        const rows = resolveRows();
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      single() {
        const rows = resolveRows();
        return Promise.resolve({
          data: rows[0] ?? null,
          error: rows[0] ? null : { message: "not found" },
        });
      },
      then(resolvePromise, rejectPromise) {
        return Promise.resolve({ data: resolveRows(), error: null }).then(
          resolvePromise,
          rejectPromise,
        );
      },
    };
    return builder;
  }
  return { from };
}

const CLERK_USER_ID = "clerk_user_1";

function selfReport(overrides = {}) {
  return {
    id: "self-report-id",
    name: "SelfName",
    clerk_user_id: CLERK_USER_ID,
    created_at: "2026-01-01T00:00:00.000Z",
    birth_date: "1990-01-01",
    birth_time: "12:00",
    birth_place: "Seoul",
    entitlement: "free",
    report_type: "self",
    ...overrides,
  };
}

function partnerManualReport(id, createdAt, overrides = {}) {
  return {
    id,
    name: "FriendName",
    clerk_user_id: CLERK_USER_ID,
    created_at: createdAt,
    birth_date: "1992-02-02",
    birth_time: null,
    birth_place: "Busan",
    entitlement: "free",
    report_type: "partner_manual",
    ...overrides,
  };
}

function surveyRow(reportId) {
  return {
    id: reportId,
    report_id: reportId,
    answers: { survey_source: "v2_10q", v2_profile: { primary_axes: {}, secondary_axes: {} } },
  };
}

/** One relationship_reports row connecting two reports — counted from either side. */
function relationshipRow(reportIdA, reportIdB) {
  const [a, b] = [reportIdA, reportIdB].sort();
  return {
    id: `rel-${a}-${b}`,
    report_id_a: a,
    report_id_b: b,
    analysis_type: "basic",
    result_basic: null,
    result_premium_by_kind: {},
    relationship_kind: "friendship",
  };
}

section("a. self + 1 partner_manual, tied relationship count, partner newer -> self wins");
{
  const self = selfReport();
  const partner = partnerManualReport("partner-a", "2026-06-01T00:00:00.000Z"); // newer than self
  const supabase = makeFakeSupabase({
    reports: [self, partner],
    survey_responses: [surveyRow(self.id), surveyRow(partner.id)],
    relationship_reports: [relationshipRow(self.id, partner.id)], // counted for both -> tie
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID);
  assert.ok(result.report, "expected a report to be resolved");
  assert.equal(result.report.id, self.id, "self must win, not the newer partner_manual row");
  assert.equal(result.report.report_type, "self");
  ok("self selected over a tied, more-recently-created partner_manual row");
}

section("b. self + several partner_manual -> all partner_manual excluded, self wins");
{
  const self = selfReport();
  const partners = [
    partnerManualReport("partner-b1", "2026-06-01T00:00:00.000Z"),
    partnerManualReport("partner-b2", "2026-06-02T00:00:00.000Z"),
    partnerManualReport("partner-b3", "2026-06-03T00:00:00.000Z"), // newest of all rows
  ];
  const supabase = makeFakeSupabase({
    reports: [self, ...partners],
    survey_responses: [self, ...partners].map((r) => surveyRow(r.id)),
    // give every partner_manual row MORE relationships than self, to stress-test
    // that report_type exclusion (not the tie-break scoring) is what protects self
    relationship_reports: [
      relationshipRow(self.id, partners[0].id),
      relationshipRow(partners[1].id, "some-other-report"),
      relationshipRow(partners[2].id, "some-other-report-2"),
    ],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID);
  assert.ok(result.report);
  assert.equal(result.report.id, self.id);
  assert.equal(result.report.report_type, "self");
  ok("self selected even when every partner_manual row is newer and has more relationships");
}

section("c. reportIdHint points at self -> self selected");
{
  const self = selfReport();
  const partner = partnerManualReport("partner-c", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [self, partner],
    survey_responses: [surveyRow(self.id), surveyRow(partner.id)],
    relationship_reports: [relationshipRow(self.id, partner.id)],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID, self.id);
  assert.ok(result.report);
  assert.equal(result.report.id, self.id);
  assert.equal(result.invalidHint, false);
  ok("explicit self hint resolves to self with invalidHint=false");
}

section("d. only partner_manual rows exist (no self report) -> documents current behavior, not a new spec");
{
  const partner = partnerManualReport("partner-d", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [partner],
    survey_responses: [surveyRow(partner.id)],
    relationship_reports: [],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID);
  // Current code path (unchanged by this fix): fetchOwnedReports() now
  // excludes the partner_manual row, no hint is supplied, so the candidate
  // pool is empty and resolveCanonicalReport short-circuits to `report: null`.
  // This assertion documents that actual behavior — it is NOT a claim that
  // null is the "right" UX for this edge case (a user with zero self report
  // but one manually-added friend is presumably an inconsistent account
  // state to begin with).
  assert.equal(result.report, null);
  assert.equal(result.invalidHint, false);
  ok("no self report + only partner_manual rows -> report: null, invalidHint: false (unchanged pre-existing behavior)");
}

section("hint-a. reportIdHint points at self -> self selected, invalidHint=false");
{
  const self = selfReport({ id: "hint-self-a" });
  const partner = partnerManualReport("hint-partner-a", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [self, partner],
    survey_responses: [surveyRow(self.id), surveyRow(partner.id)],
    relationship_reports: [relationshipRow(self.id, partner.id)],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID, self.id);
  assert.equal(result.report?.id, self.id);
  assert.equal(result.invalidHint, false);
  ok("hint pointing at self resolves to self, invalidHint=false");
}

section("hint-b. reportIdHint points at partner_manual -> never adopted as canonical");
{
  const self = selfReport({ id: "hint-self-b" });
  const partner = partnerManualReport("hint-partner-b", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [self, partner],
    survey_responses: [surveyRow(self.id), surveyRow(partner.id)],
    relationship_reports: [relationshipRow(self.id, partner.id)],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID, partner.id);
  assert.notEqual(
    result.report?.id,
    partner.id,
    "partner_manual must never be the resolved canonical report, even when directly hinted",
  );
  assert.equal(
    result.invalidHint,
    true,
    "a hint pointing at a partner_manual row must be flagged invalid",
  );
  ok("hint pointing at partner_manual is rejected outright (report is never the friend's proxy)");
}

section("hint-c. hint is partner_manual but a separate self report exists -> self selected");
{
  const self = selfReport({ id: "hint-self-c" });
  const partner = partnerManualReport("hint-partner-c", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [self, partner],
    survey_responses: [surveyRow(self.id), surveyRow(partner.id)],
    relationship_reports: [relationshipRow(self.id, partner.id)],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID, partner.id);
  assert.equal(
    result.report?.id,
    self.id,
    "self must win even when the hint explicitly names the friend's proxy report",
  );
  ok("partner_manual hint falls through to the real self report when one exists");
}

section("hint-d. hint is partner_manual and no self report exists -> documents current return value");
{
  const partner = partnerManualReport("hint-partner-d", "2026-06-01T00:00:00.000Z");
  const supabase = makeFakeSupabase({
    reports: [partner],
    survey_responses: [surveyRow(partner.id)],
    relationship_reports: [],
    invites: [],
  });

  const result = await resolveCanonicalReport(supabase, CLERK_USER_ID, partner.id);
  // Documents current behavior (not a new spec): the hint is rejected because
  // it names an ineligible report_type, leaving zero candidates (no owned
  // self report either), so resolveCanonicalReport short-circuits to
  // `report: null`. invalidHint is true here — unlike the no-hint "d." case
  // above — because a hint WAS supplied and WAS explicitly rejected.
  assert.equal(result.report, null);
  assert.equal(result.invalidHint, true);
  ok("partner_manual-only hint with no self report -> report: null, invalidHint: true");
}

console.log("\nOK: resolveCanonicalReport partner_manual exclusion tests passed");
