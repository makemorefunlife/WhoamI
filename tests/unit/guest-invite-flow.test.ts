/**
 * Stage 3 (2026-10-11): friend invite -- member fills only what is missing,
 * non-member can continue (30 days), token alone never proves anything.
 * Run: npx tsx tests/unit/guest-invite-flow.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { joinInviteAsGuest } from "../../lib/invite/guestInvite";

let n = 0;
const ok = async (name: string, fn: () => void | Promise<void>) => { await fn(); n++; console.log(`ok - ${name}`); };
const base = {
  inviteToken: "a".repeat(64), locale: "ko-KR" as const, displayName: "민지", birthDate: "1995-05-05",
  birthTime: null, birthTimeUnknown: true, birthPlace: null, birthPlaceUnknown: true, surveyAnswers: null,
  consent: { age: true, privacy: true },
};
const noDb = { rpc: () => { throw new Error("must not touch the DB"); } } as never;

async function main() {
  await ok("join validates before touching anything", async () => {
    assert.deepEqual(await joinInviteAsGuest(noDb, { ...base, displayName: " " }), { ok: false, code: "invalid" });
    assert.deepEqual(await joinInviteAsGuest(noDb, { ...base, birthDate: "1995/5/5" }), { ok: false, code: "invalid" });
    assert.deepEqual(await joinInviteAsGuest(noDb, { ...base, consent: { age: true, privacy: false } }), { ok: false, code: "consent_required" });
    assert.deepEqual(await joinInviteAsGuest(noDb, { ...base, consent: { age: false, privacy: true } }), { ok: false, code: "consent_required" });
  });
  await ok("US keeps the survey required; KR optional", async () => {
    assert.deepEqual(await joinInviteAsGuest(noDb, { ...base, locale: "en-US", consent: { age: false, privacy: true } }), { ok: false, code: "survey_required" });
  });
  await ok("claim refused -> unavailable, nothing created", async () => {
    const calls: string[] = [];
    const db = { rpc: (fn: string) => { calls.push(fn); return Promise.resolve({ data: [], error: null }); }, from: () => { throw new Error("no writes"); } } as never;
    assert.deepEqual(await joinInviteAsGuest(db, base), { ok: false, code: "unavailable" });
    assert.deepEqual(calls, ["claim_invite_for_guest"]);
  });
  await ok("wiring: session-only access, link needs Clerk + session, token never shown", () => {
    for (const f of ["state", "preview", "email/start", "email/verify"]) {
      assert.match(readFileSync(`app/api/invite/guest/${f}/route.ts`, "utf8"), /resolveGuestParticipant\(/, f);
    }
    const link = readFileSync("app/api/invite/guest/link/route.ts", "utf8");
    assert.match(link, /const \{ userId \} = await auth\(\)/);
    assert.match(link, /resolveGuestParticipant\(/);
    assert.doesNotMatch(readFileSync("app/invite/InviteContent.tsx", "utf8"), /token: \{token\}/);
    const recover = readFileSync("app/api/invite/guest/recover/start/route.ts", "utf8");
    assert.match(recover, /not\("email_verified_at", "is", null\)/, "recovery only to a confirmed email");
    assert.match(recover, /return NextResponse\.json\(\{ ok: true \}\);/, "same answer either way");
  });
  await ok("member invitee is asked only for what is missing", () => {
    const home = readFileSync("app/homecontent.tsx", "utf8");
    assert.match(home, /const inviteeMissingStep = resume\.reportId/);
    assert.match(home, /nextInfoStepPath\(\{/);
  });
  await ok("free preview pairs people in argument order (was swapped for report_id_b)", () => {
    const fp = readFileSync("app/api/relationship/map/free-preview/route.ts", "utf8");
    assert.match(fp, /personViewer = pair\.personA;/);
  });
  console.log(`\n${n} passed`);
}
main().catch((e) => { console.error(e); process.exit(1); });
