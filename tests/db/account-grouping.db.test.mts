/**
 * Account grouping (main report + grouped self reports) against a real local
 * PostgreSQL built from the migrations. Run via tests/db/run-db-tests.sh.
 *
 * Fixture (test data, not real people):
 *   u1: A (survey, no birth -- main) + B (birth, no survey, 3 relationships)
 *       the A/B production shape, incl. the same friend on A and B and
 *       two hand-added friends with the same name + birth date
 *   u2: one self report (a normal account, e.g. Korean site) -- must not change
 *   u3: main D1 (survey + birth X) + D2 (birth Y + a different survey) -- conflict
 */
import assert from "node:assert/strict";
import { connectTestDb, supabaseShim } from "./pgSupabaseShim";
import type { SupabaseClient } from "@supabase/supabase-js";

const db = await connectTestDb();
if (!db) {
  console.log("skip - AHA_TEST_DATABASE_URL / AHA_PG_MODULE not set");
  process.exit(0);
}
const sb = () => supabaseShim(db) as unknown as SupabaseClient;

const { profileSourceReportId, viewerGroupReportIds, effectiveViewerReportId, withProfileBirth } = await import(
  "../../lib/account/profileGroup"
);
const { loadProfileChoices, chooseBirthFromGrouped, chooseSurveyFromGrouped } = await import("../../lib/account/profileChoices");
const { resolveCanonicalReport } = await import("../../lib/home/resolveCanonicalReport");
const { buildRelationshipHubList } = await import("../../lib/relationship/hubList");
const { countHubRelationshipSummary } = await import("../../lib/relationship/hubRelationshipSummary");
const { fetchRelationshipMapConnections } = await import("../../lib/relationship/map/fetchRelationshipMapConnections");
const { isV2SurveyCompleteForReport } = await import("../../lib/v2/survey/dbCompletion");
const { fetchReportForPersonCore, fetchLatestSurveyForPersonCore } = await import("../../lib/personCore/data/fetchPersonCoreSources");
const { loadReportInputFacts } = await import("../../lib/report/inputSnapshot");
const { getSurveyAnswersForReport } = await import("../../lib/relationship/surveyPatterns");

const id = (p: string, n: number) => `${p.repeat(8)}-0000-0000-0000-${String(n).padStart(12, "0")}`;
const A = id("a", 1), B = id("b", 1), C1 = id("c", 1), X2 = id("c", 2), M1 = id("e", 1), M2 = id("e", 2);
const K = id("f", 1), D1 = id("d", 1), D2 = id("d", 2);
const SURVEY1 = { q1: "A", q2: "B", q3: "C", q4: "D", q5: "A", q6: "B", q7: "C", q8: "D", q9: "A", q10: "3" };
const SURVEY2 = { ...SURVEY1, q1: "D", q10: "5" };
const basic = (a: string, b: string) => ({ locale: "en-US", perspectives: { [a]: { x: 1 }, [b]: { x: 1 } } });

await db.query(`
  insert into reports (id, clerk_user_id, report_type, name, birth_date, birth_time, birth_place, created_at) values
   ('${A}','u1','self',null,null,null,null, now() - interval '1 day'),
   ('${B}','u1','self',null,'1990-05-17','08:30','Seoul', now() - interval '5 day'),
   ('${M1}','u1','partner_manual','Kim','2000-01-01',null,'Z', now() - interval '4 day'),
   ('${M2}','u1','partner_manual','Kim','2000-01-01',null,'Z', now() - interval '3 day'),
   ('${C1}','u9','self',null,'1991-01-01',null,'X', now() - interval '9 day'),
   ('${X2}','u8','self',null,'1992-02-02',null,'Y', now() - interval '9 day'),
   ('${K}','u2','self',null,'1985-01-01','09:00','Busan', now() - interval '2 day'),
   ('${D1}','u3','self',null,'1980-01-01','10:00','X', now() - interval '1 day'),
   ('${D2}','u3','self',null,'1981-02-02',null,'Y', now() - interval '3 day');
  insert into survey_responses (report_id, answers, created_at) values
   ('${A}', '${JSON.stringify(SURVEY1)}', now() - interval '1 day'),
   ('${K}', '${JSON.stringify(SURVEY1)}', now() - interval '1 day'),
   ('${D1}', '${JSON.stringify(SURVEY1)}', now() - interval '1 day'),
   ('${D2}', '${JSON.stringify(SURVEY2)}', now() - interval '2 day');
`);
const rel = async (a: string, b: string, created: string, withBasic = true) =>
  (
    await db.query(
      `insert into relationship_reports (report_id_a, report_id_b, result_basic, created_at) values ($1, $2, $3, now() - $4::interval) returning id`,
      [a, b, withBasic ? JSON.stringify(basic(a, b)) : null, created],
    )
  ).rows[0].id as string;
const rAC1 = await rel(A, C1, "1 hour");
const rBC1 = await rel(B, C1, "2 day");
const rBM1 = await rel(B, M1, "3 day");
const rAM2 = await rel(A, M2, "2 hour");
const rBX2 = await rel(B, X2, "4 day");
const rKC1 = await rel(K, C1, "5 day");
const rAB = await rel(A, B, "6 day"); // the person with themself (A and B are both u1's own reports)
await db.query(`insert into relationship_favorites (relationship_report_id, viewer_report_id) values ($1, $2)`, [rBX2, B]);

const listOpts = { locale: "en-US" as const, limit: undefined, formatSimple: false, scope: "all", favoritesOnly: false, includeWaiting: false };
type Item = { relationship_report_id: string; partner_report_id: string; viewer_report_id: string; is_favorite: boolean };
async function list(reportId: string) {
  const r = await buildRelationshipHubList(sb(), { reportId, ...listOpts });
  assert.ok(r.ok);
  return (r.body.relationships as Item[]).map((i) => ({ rr: i.relationship_report_id, partner: i.partner_report_id, viewer: i.viewer_report_id, fav: i.is_favorite }));
}
const norm = (x: unknown) => JSON.stringify(x, (_k, v) => (typeof v === "string" && /T\d\d:/.test(v) ? "<ts>" : v));

// ---- before grouping ------------------------------------------------------
const beforeU2 = norm({
  list: await list(K),
  canonical: (await resolveCanonicalReport(sb(), "u2")).report?.id,
  hub: await countHubRelationshipSummary(sb(), K),
  src: await profileSourceReportId(sb(), K),
});
assert.equal((await resolveCanonicalReport(sb(), "u1")).report?.id, A, "main = the survey report (unchanged rule)");
assert.deepEqual((await list(A)).map((i) => i.partner).sort(), [B, C1, M2].sort(), "before: A's relationships (incl. B, shown as before)");
assert.equal(await profileSourceReportId(sb(), B), B);
assert.equal(await isV2SurveyCompleteForReport(sb(), B), false);
assert.equal((await fetchReportForPersonCore(sb(), A)).birth_date, null);
console.log("ok - before grouping: A shows 2 relationships, B separate, nothing redirected");

// ---- dry run changes nothing ------------------------------------------------
const dry = await sb().rpc("group_account_self_reports", { p_clerk_user_id: "u1", p_main_report_id: A, p_apply: false });
assert.deepEqual(dry.data, [{ report_id: B, action: "would_group" }]);
assert.equal((await db.query(`select count(*)::int n from reports where merged_into_report_id is not null`)).rows[0].n, 0);
console.log("ok - dry run lists B and changes nothing");

// ---- group + fill -----------------------------------------------------------
await sb().rpc("group_account_self_reports", { p_clerk_user_id: "u1", p_main_report_id: A, p_apply: true });
const fill = await sb().rpc("fill_main_report_from_grouped", { p_main_report_id: A, p_apply: true });
assert.deepEqual(
  (fill.data as { field: string; result: string }[]).map((r) => [r.field, r.result]),
  [["birth", "filled"], ["survey", "already_set"]],
);
const aRow = (await db.query(`select birth_date, birth_time, birth_place, birth_date_correction_used_at from reports where id=$1`, [A])).rows[0];
assert.deepEqual([aRow.birth_date, aRow.birth_time, aRow.birth_place], ["1990-05-17", "08:30", "Seoul"]);
assert.equal(aRow.birth_date_correction_used_at, null, "integration is not a birth-date correction (decision 2)");
const bRow = (await db.query(`select birth_date, merged_into_report_id from reports where id=$1`, [B])).rows[0];
assert.equal(bRow.birth_date, "1990-05-17", "B keeps its own saved details");
assert.equal(bRow.merged_into_report_id, A);
console.log("ok - B grouped into A; A's empty birth filled from B; correction counter untouched; B unchanged");

// ---- one consistent profile -------------------------------------------------
assert.equal(await profileSourceReportId(sb(), B), A);
assert.equal(await isV2SurveyCompleteForReport(sb(), B), true, "B is described by A's survey");
assert.equal((await fetchReportForPersonCore(sb(), B)).birth_date, "1990-05-17");
assert.equal((await fetchLatestSurveyForPersonCore(sb(), B))?.answers.q1, "A");
assert.deepEqual(await getSurveyAnswersForReport(sb(), B), SURVEY1);
const facts = await loadReportInputFacts(sb(), B);
assert.equal(facts?.reportId, B, "fingerprint keeps B's id");
assert.equal(facts?.birth_date, "1990-05-17");
assert.ok(facts?.survey_id, "B's new analyses see A's survey");
assert.deepEqual(await viewerGroupReportIds(sb(), A), [A, B]);
assert.deepEqual(await viewerGroupReportIds(sb(), B), [B, A], "a grouped report opened directly sees its main report's group");
console.log("ok - My Account / readiness / generation read A's birth + survey for both A and B");

// ---- relationships together, duplicates once --------------------------------
const after = await list(A);
assert.deepEqual(after.map((i) => i.partner).sort(), [C1, M1, M2, X2].sort(), "A + B relationships, C1 once, A-B self row not listed");
assert.ok(!after.some((i) => i.rr === rAB), "self relationship not shown as a friend");
assert.equal((await db.query(`select count(*)::int n from relationship_reports where id=$1`, [rAB])).rows[0].n, 1, "self relationship kept in the DB");
assert.equal(after.find((i) => i.partner === C1)?.rr, rAC1, "same person on A and B: the main report's row");
assert.equal(after.find((i) => i.partner === X2)?.viewer, B, "B's relationship opens as B");
assert.equal(after.find((i) => i.partner === X2)?.fav, true, "B's favorites kept");
assert.ok(after.some((i) => i.rr === rBM1) && after.some((i) => i.rr === rAM2), "hand-added look-alikes both kept (no automatic merge)");
assert.deepEqual(await countHubRelationshipSummary(sb(), A), { pending: 0, completed: 4 }, "self relationship not counted");
const viaB = await list(B);
assert.deepEqual(viaB.map((i) => i.partner).sort(), [C1, M1, M2, X2].sort(), "opened with grouped B: same friends, A-B self row not listed");
assert.deepEqual(await countHubRelationshipSummary(sb(), B), { pending: 0, completed: 4 }, "opened with grouped B: same count");
assert.deepEqual((await fetchRelationshipMapConnections(sb(), A)).map((c) => c.partnerReportId).sort(), [C1, M1, M2, X2].sort(), "map: same set, no self");
assert.equal(await effectiveViewerReportId(sb(), A, B, X2), B);
assert.equal(await effectiveViewerReportId(sb(), A, C1, K), A, "not a participant -> unchanged (access check refuses)");
assert.equal(await effectiveViewerReportId(sb(), K, B, X2), K, "another account's main never maps to B");
assert.equal((await withProfileBirth(sb(), { id: B, birth_date: "x", name: "n" })).name, "n");
console.log("ok - list shows A+B relationships once each; B rows open as B; other accounts never map");

// ---- canonical: a hint at B means A -------------------------------------------
const canon = await resolveCanonicalReport(sb(), "u1", B);
assert.equal(canon.report?.id, A);
assert.equal(canon.invalidHint, false);
console.log("ok - canonical stays A, a hint at B resolves to A");

// ---- normal account unchanged ----------------------------------------------
const afterU2 = norm({
  list: await list(K),
  canonical: (await resolveCanonicalReport(sb(), "u2")).report?.id,
  hub: await countHubRelationshipSummary(sb(), K),
  src: await profileSourceReportId(sb(), K),
});
assert.equal(afterU2, beforeU2, "ungrouped account: identical results");
void rKC1;
console.log("ok - an ungrouped account (one self report) reads exactly what it read before");

// ---- conflicts: the owner chooses -------------------------------------------
await sb().rpc("group_account_self_reports", { p_clerk_user_id: "u3", p_main_report_id: D1, p_apply: true });
const f3 = await sb().rpc("fill_main_report_from_grouped", { p_main_report_id: D1, p_apply: true });
assert.deepEqual((f3.data as { result: string }[]).map((r) => r.result), ["already_set", "already_set"], "nothing filled over saved values");
const ch = await loadProfileChoices(sb(), { clerkUserId: "u3", mainReportId: D1 });
assert.equal(ch?.birth.current?.birthDate, "1980-01-01");
assert.deepEqual(ch?.birth.options.map((o) => o.birthDate), ["1981-02-02"]);
assert.deepEqual(ch?.survey.options.map((o) => o.sourceReportId), [D2]);
assert.equal(await loadProfileChoices(sb(), { clerkUserId: "u1", mainReportId: D1 }), null, "other account: nothing");
assert.equal(await chooseBirthFromGrouped(sb(), { clerkUserId: "u1", mainReportId: D1, sourceReportId: D2 }), "not_allowed");
assert.equal(await chooseBirthFromGrouped(sb(), { clerkUserId: "u3", mainReportId: D1, sourceReportId: B }), "not_allowed");
assert.equal(await chooseBirthFromGrouped(sb(), { clerkUserId: "u3", mainReportId: D1, sourceReportId: D2 }), "chosen");
const d1 = (await db.query(`select birth_date, birth_time, birth_place, birth_date_correction_used_at from reports where id=$1`, [D1])).rows[0];
assert.deepEqual([d1.birth_date, d1.birth_time, d1.birth_place], ["1981-02-02", null, "Y"]);
assert.equal(d1.birth_date_correction_used_at, null);
const hist = (await db.query(`select birth_date, birth_time, reason from report_birth_history where report_id=$1`, [D1])).rows;
assert.deepEqual(hist, [{ birth_date: "1980-01-01", birth_time: "10:00", reason: "account_profile_choice" }], "previous details kept");
assert.equal(await chooseSurveyFromGrouped(sb(), { clerkUserId: "u3", mainReportId: D1, sourceReportId: D2 }), "chosen");
const d1Surveys = (await db.query(`select answers from survey_responses where report_id=$1 order by created_at`, [D1])).rows;
assert.equal(d1Surveys.length, 2, "survey added as a new row; the old one stays");
assert.equal((d1Surveys[1].answers as Record<string, string>).q1, "D");
assert.equal(await chooseSurveyFromGrouped(sb(), { clerkUserId: "u3", mainReportId: D1, sourceReportId: D2 }), "same");
const ev = (await db.query(`select event, actor from account_profile_events where clerk_user_id='u3' order by created_at`)).rows.map((r) => `${r.event}:${r.actor}`);
assert.deepEqual(ev, ["grouped:ops", "birth_chosen:user", "survey_chosen:user"]);
console.log("ok - conflicts are never filled automatically; the owner's choice keeps the previous values");

// ---- undo -------------------------------------------------------------------
const un = await sb().rpc("unfill_main_report", { p_main_report_id: A });
assert.deepEqual((un.data as { result: string }[]).map((r) => r.result), ["unfilled"]);
await sb().rpc("ungroup_account_self_reports", { p_clerk_user_id: "u1" });
assert.equal((await db.query(`select birth_date from reports where id=$1`, [A])).rows[0].birth_date, null);
assert.equal(await profileSourceReportId(sb(), B), B);
assert.deepEqual((await list(A)).map((i) => i.partner).sort(), [B, C1, M2].sort(), "back to the state before");
console.log("ok - unfill + ungroup restore the previous state exactly");

await db.end();
