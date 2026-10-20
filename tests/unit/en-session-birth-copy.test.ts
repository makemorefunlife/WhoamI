/**
 * English site, report without saved birth details (2026-10-19 production
 * case: survey on report A, birth details saved on the same account's report
 * B). Birth details are filled ONLY from the account's own saved data on the
 * server, never from a browser copy; nothing saved is ever replaced.
 * Run: npx tsx tests/unit/en-session-birth-copy.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { restoreBirthFromOwnedReports } from "../../lib/report/restoreBirthFromOwnedReports";
import { missingBirthStep, restoreBirthFromAccount } from "../../lib/v2/onboarding/sessionBirthToServer";

type Row = Record<string, unknown> & { id: string };

/** Tiny in-memory stand-in for the query shapes used. */
function fakeDb(rows: Row[], opts: { noCoords?: boolean } = {}) {
  const updates: { id: string; patch: Record<string, unknown> }[] = [];
  const from = () => {
    const f: ((r: Row) => boolean)[] = [];
    let patch: Record<string, unknown> | null = null;
    let cols = "";
    const q = {
      select(c?: string) { if (c) cols = c; return q; },
      eq(k: string, v: unknown) { f.push((r) => r[k] === v); return q; },
      neq(k: string, v: unknown) { f.push((r) => r[k] !== v); return q; },
      is(k: string, v: null) { f.push((r) => (r[k] ?? null) === v); return q; },
      not(k: string, _op: string, _v: null) { f.push((r) => r[k] != null); return q; },
      update(p: Record<string, unknown>) { patch = p; return q; },
      async maybeSingle() { return { data: rows.find((r) => f.every((g) => g(r))) ?? null, error: null }; },
      then(res: (v: { data: unknown; error: unknown }) => unknown) {
        if (!patch && opts.noCoords && cols.includes("birth_latitude")) return res({ data: null, error: { message: "column birth_latitude does not exist" } });
        const hit = rows.filter((r) => f.every((g) => g(r)));
        if (patch) {
          for (const r of hit) { Object.assign(r, patch); updates.push({ id: r.id, patch: { ...patch } }); }
          return res({ data: hit.map((r) => ({ id: r.id })), error: null });
        }
        return res({ data: hit.map((r) => ({ ...r })), error: null });
      },
    };
    return q;
  };
  return { db: { from } as unknown as SupabaseClient, updates, rows };
}

const U = "user_owner";
const birth = { birth_date: "1990-05-17", birth_time: "08:30", birth_place: "Seoul", birth_latitude: 37.5, birth_longitude: 127, birth_timezone: "Asia/Seoul" };
const empty = { birth_date: null, birth_time: null, birth_place: null };
const A = "aaaaaaaa-0000-0000-0000-000000000000";
const B = "bbbbbbbb-0000-0000-0000-000000000000";

async function main() {
  // the production shape: A (survey, no birth) + B (birth saved), same account
  {
    const { db, updates, rows } = fakeDb([
      { id: A, clerk_user_id: U, report_type: "self", ...empty },
      { id: B, clerk_user_id: U, report_type: "self", ...birth },
      { id: "c", clerk_user_id: U, report_type: "partner_manual", birth_date: "1970-01-01", birth_time: null, birth_place: "X" },
      { id: "d", clerk_user_id: "someone_else", report_type: "self", birth_date: "1999-09-09", birth_time: null, birth_place: "Y" },
    ]);
    assert.deepEqual(await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A }), { kind: "restored", sourceReportId: B });
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0], { id: A, patch: birth });
    assert.equal(rows[1].birth_date, "1990-05-17", "source report unchanged");
    assert.deepEqual(await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A }), { kind: "already_has_birth" }, "second call changes nothing");
    assert.equal(updates.length, 1);
  }
  // friends' manual reports and other accounts are never sources
  {
    const { db, updates } = fakeDb([
      { id: A, clerk_user_id: U, report_type: "self", ...empty },
      { id: "c", clerk_user_id: U, report_type: "partner_manual", ...birth },
      { id: "d", clerk_user_id: "someone_else", report_type: "self", ...birth },
    ]);
    assert.deepEqual(await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A }), { kind: "no_source" });
    assert.equal(updates.length, 0);
  }
  // two different saved details -> the person decides
  {
    const { db, updates } = fakeDb([
      { id: A, clerk_user_id: U, report_type: "self", ...empty },
      { id: B, clerk_user_id: U, report_type: "self", ...birth },
      { id: "e", clerk_user_id: U, report_type: "self", ...birth, birth_time: "09:00" },
    ]);
    assert.deepEqual(await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A }), { kind: "conflict" });
    assert.equal(updates.length, 0);
  }
  // not the owner / already saved -> nothing written
  {
    const { db, updates } = fakeDb([
      { id: A, clerk_user_id: "someone_else", report_type: "self", ...empty },
      { id: B, clerk_user_id: U, report_type: "self", ...birth },
    ]);
    assert.deepEqual(await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A }), { kind: "not_owner" });
    const t = fakeDb([{ id: A, clerk_user_id: U, report_type: "self", ...birth, birth_time: "23:00" }, { id: B, clerk_user_id: U, report_type: "self", ...birth }]);
    assert.deepEqual(await restoreBirthFromOwnedReports(t.db, { clerkUserId: U, reportId: A }), { kind: "already_has_birth" });
    assert.equal(updates.length + t.updates.length, 0, "saved details are never replaced");
  }
  // environments without coordinate columns
  {
    const { db, updates } = fakeDb([{ id: A, clerk_user_id: U, report_type: "self", ...empty }, { id: B, clerk_user_id: U, report_type: "self", ...birth }], { noCoords: true });
    assert.equal((await restoreBirthFromOwnedReports(db, { clerkUserId: U, reportId: A })).kind, "restored");
    assert.deepEqual(Object.keys(updates[0].patch).sort(), ["birth_date", "birth_place", "birth_time"]);
  }
  console.log("ok - fills only from the same account's own saved report; never browser data, friends' reports, other accounts, or over saved details");

  // client step: English only, only when nothing is saved
  assert.equal(missingBirthStep({ locale: "en-US", dbRow: { birth_date: null } }), "restore_from_account");
  assert.equal(missingBirthStep({ locale: "en-US", dbRow: null }), "restore_from_account", "lookup failed: server still checks");
  assert.equal(missingBirthStep({ locale: "en-US", dbRow: { birth_date: "1990-05-17" } }), "none");
  assert.equal(missingBirthStep({ locale: "ko-KR", dbRow: { birth_date: null } }), "none", "Korean unchanged");
  const sent: unknown[] = [];
  globalThis.fetch = (async (u: string, init: { body: string }) => { sent.push([u, JSON.parse(init.body)]); return new Response(JSON.stringify({ result: "restored" })); }) as unknown as typeof fetch;
  assert.equal(await restoreBirthFromAccount(A), "restored");
  assert.deepEqual(sent[0], ["/api/report/birth/restore", { reportId: A }], "only the report id is sent -- no browser birth data");
  globalThis.fetch = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  assert.equal(await restoreBirthFromAccount(A), "error");
  console.log("ok - client sends only the report id; English only");

  // pages: no automatic save of browser data; not-restored stays on the form
  for (const f of ["app/onboarding/birth/page.tsx", "app/survey-v2/complete/page.tsx"]) {
    const src = readFileSync(f, "utf8");
    assert.doesNotMatch(src, /copySessionBirthToServerIfEmpty|decideSessionBirthAction/, `${f}: no automatic save of browser data`);
    const at = src.indexOf("missingBirthStep({");
    const back = src.indexOf("consumeSelfProfileReturn(", at);
    assert.ok(at > 0 && back > at, `${f}: restore step runs before the redirect back`);
    const notRestored = src.slice(at, back).split("} else {").slice(1).join("} else {");
    assert.match(notRestored, /return;/, `${f}: not restored -> stays on the form`);
    assert.doesNotMatch(notRestored, /router\.(replace|push)/, `${f}: no redirect when not restored`);
  }
  const birthPage = readFileSync("app/onboarding/birth/page.tsx", "utf8");
  assert.match(birthPage, /\.\.\.\(fromBrowserCopy\.current \? \{ onlyIfEmpty: true \} : \{\}\)/, "confirming a prefilled form never replaces saved details");
  assert.match(readFileSync("app/survey-v2/complete/page.tsx", "utf8"), /\.\.\.\(birthNotice \? \{ onlyIfEmpty: true \} : \{\}\)/);
  const account = readFileSync("components/account/AccountBirthEditor.tsx", "utf8");
  assert.match(account, /locale === "en-US" && synced\.source === "session" \? null : synced\.birth/, "My Account (en) shows only saved details");
  const route = readFileSync("app/api/report/birth/route.ts", "utf8");
  assert.doesNotMatch(route, /owned_by_viewer/, "earlier auto-save flag removed");
  console.log("ok - pages: restore from account, else confirm on the form; My Account shows only saved details");
}
main();
