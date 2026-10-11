/**
 * Stage 2 (2026-10-11): one "missing info" rule, nothing saved is deleted or
 * overwritten when info changes, reports show they reflect the info at the time.
 * Run: npx tsx tests/unit/stage2-inputs-preserve.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nextInfoStepPath } from "../../lib/profile/infoSteps";
import { buildInputSnapshot, describeSnapshot, fingerprintInputs } from "../../lib/report/inputSnapshot";
import { deleteReportAnalysis } from "../../lib/report/reportAnalyses";
import { currentSelfProfileFromSurveyAnswers } from "../../lib/relationship/surveyPatterns";
import { invalidateRelationshipPremiumsForReport } from "../../lib/relationship/invalidateRelationshipPremiums";

let n = 0;
const ok = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  n++;
  console.log(`ok - ${name}`);
};

/** Tiny fake of the supabase query builder for report_analyses / history. */
function fakeSupabase(opts: { historyFails?: boolean }) {
  const rows = [{ report_id: "r1", analysis_type: "astrology", content: "old", metadata: null, created_at: "t0", updated_at: "t1" }];
  const history: unknown[] = [];
  let deleted = false;
  const builder = (table: string) => {
    const q: Record<string, unknown> = {};
    q.select = () => q;
    q.eq = () => q;
    q.then = (res: (v: unknown) => void) => res({ data: table === "report_analyses" ? rows : [], error: null });
    q.insert = (v: unknown[]) => {
      if (opts.historyFails) return Promise.resolve({ error: { message: "no table" } });
      history.push(...v);
      return Promise.resolve({ error: null });
    };
    q.delete = () => {
      deleted = true;
      const d: Record<string, unknown> = {};
      d.eq = () => d;
      d.then = (res: (v: unknown) => void) => res({ error: null });
      return d;
    };
    return q;
  };
  return { client: { from: builder } as never, history, isDeleted: () => deleted };
}

async function main() {
  await ok("missing-info rule: KR survey optional, US required, done input not asked again", () => {
    assert.equal(nextInfoStepPath({ reportId: "r", hasBirth: true, hasSurvey: false, surveyRequired: false }), null);
    assert.equal(nextInfoStepPath({ reportId: "r", hasBirth: false, hasSurvey: false, surveyRequired: false }), "/onboarding/birth?reportId=r");
    assert.equal(nextInfoStepPath({ reportId: "r", hasBirth: true, hasSurvey: false, surveyRequired: true }), "/survey-v2?reportId=r");
    assert.equal(nextInfoStepPath({ reportId: "r", hasBirth: false, hasSurvey: true, surveyRequired: true }), "/survey-v2/complete?reportId=r");
    assert.equal(nextInfoStepPath({ reportId: "r", hasBirth: true, hasSurvey: true, surveyRequired: true }), null);
  });

  await ok("rebuilt analyses are archived before delete; kept if archive fails", async () => {
    const a = fakeSupabase({});
    await deleteReportAnalysis(a.client, "r1", "astrology");
    assert.equal(a.history.length, 1);
    assert.equal(a.isDeleted(), true);
    const b = fakeSupabase({ historyFails: true });
    await deleteReportAnalysis(b.client, "r1", "astrology");
    assert.equal(b.isDeleted(), false, "no archive -> original stays");
  });

  await ok("info change never empties saved relationship reports", async () => {
    assert.equal(await invalidateRelationshipPremiumsForReport({} as never, "r1"), 0);
    const birth = readFileSync("app/api/report/birth/route.ts", "utf8");
    const survey = readFileSync("app/api/v2/survey/route.ts", "utf8");
    assert.doesNotMatch(birth, /invalidateRelationshipPremiumsForReport\(/);
    assert.doesNotMatch(survey, /invalidateRelationshipPremiumsForReport\(/);
    assert.match(survey, /survey_delete_retired/);
    assert.doesNotMatch(readFileSync("app/survey-v2/page.tsx", "utf8"), /clearSurveyOnServer\(/);
  });

  await ok("invite sign-up never overwrites an existing profile's birth data", () => {
    assert.match(readFileSync("app/api/report/birth/route.ts", "utf8"), /onlyIfEmpty === true && currentBirthDate/);
    assert.match(readFileSync("lib/home/completeInviteOrConnectSignup.ts", "utf8"), /onlyIfEmpty: true/);
  });

  await ok("newest survey answer set is used (uuid ids are random)", () => {
    for (const f of ["app/api/v2/survey/route.ts", "lib/relationship/surveyPatterns.ts", "lib/v2/survey/dbCompletion.ts", "lib/personCore/data/fetchPersonCoreSources.ts"]) {
      assert.match(readFileSync(f, "utf8"), /order\("created_at", \{ ascending: false \}\)/, f);
    }
  });

  await ok("skipped survey (neutral placeholder) is never read as survey scores", () => {
    const neutral = { primary_axes: { autonomy: 50 } };
    assert.equal(currentSelfProfileFromSurveyAnswers({ survey_skipped: true, survey_source: "v2_10q", v2_profile: neutral }), null);
  });

  await ok("snapshot: fingerprint only, detects later change", () => {
    const facts = [{ reportId: "a", birth_date: "1990-01-01", birth_time: null, birth_place: "Seoul", survey_id: "s1" }];
    const snap = buildInputSnapshot(facts, new Date("2026-10-11T00:00:00Z"));
    assert.equal(JSON.stringify(snap).includes("1990"), false, "no raw birth data stored");
    assert.deepEqual(describeSnapshot(snap, facts), { generatedAt: "2026-10-11T00:00:00.000Z", inputsChanged: false });
    const changed = [{ ...facts[0], survey_id: "s2" }];
    assert.equal(describeSnapshot(snap, changed).inputsChanged, true);
    assert.notEqual(fingerprintInputs(facts), fingerprintInputs(changed));
    assert.deepEqual(describeSnapshot(null, facts), { generatedAt: null, inputsChanged: null });
  });

  await ok("Personal deep generates from the SAVED profile and records the snapshot", () => {
    const route = readFileSync("app/api/v2/deep/essence/route.ts", "utf8");
    assert.match(route, /loadReportInputFacts\(supabase, reportId\)/);
    assert.match(route, /currentSelfProfile: inputs\.dbProfile/);
    assert.match(route, /input_snapshot: inputs\.snapshot/);
    const premium = readFileSync("lib/relationship/premiumGenerationHandler.ts", "utf8");
    assert.match(premium, /inputSnapshot,/);
  });

  console.log(`\n${n} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
