import assert from "node:assert/strict";
import {
  decideFriendAddReadiness,
  friendAddReturnPath,
  selfProfileStepPath,
} from "../../lib/relationship/friendAddReadiness";

const base = { signedIn: true, reportId: "r1", hasBirthDate: true, surveyComplete: false, surveyRequired: false };
let n = 0;
const ok = (m: string) => { n++; console.log(`ok - ${m}`); };

assert.deepEqual(decideFriendAddReadiness({ ...base, signedIn: false }), { status: "signed_out" });
ok("signed out -> log in first");

assert.deepEqual(decideFriendAddReadiness({ ...base, reportId: null }), { status: "no_profile" });
ok("no own profile -> start (free)");

assert.deepEqual(decideFriendAddReadiness({ ...base, hasBirthDate: false }), { status: "needs_birth", reportId: "r1", surveyDone: false });
ok("KR: birth date missing -> birth step");

assert.deepEqual(decideFriendAddReadiness(base), { status: "ready", reportId: "r1" });
ok("KR: birth date is enough (survey optional, no purchase involved)");

assert.deepEqual(decideFriendAddReadiness({ ...base, surveyRequired: true }), { status: "needs_survey", reportId: "r1" });
assert.deepEqual(decideFriendAddReadiness({ ...base, surveyRequired: true, surveyComplete: true }), { status: "ready", reportId: "r1" });
ok("US: survey required before adding a friend");

assert.equal(selfProfileStepPath({ status: "needs_birth", reportId: "r 1", surveyDone: false }, false), "/onboarding/birth?reportId=r%201");
assert.equal(selfProfileStepPath({ status: "needs_birth", reportId: "r1", surveyDone: true }, true), "/survey-v2/complete?reportId=r1");
assert.equal(selfProfileStepPath({ status: "needs_survey", reportId: "r1" }, true), "/survey-v2?reportId=r1");
assert.equal(selfProfileStepPath({ status: "ready", reportId: "r1" }, false), null);
ok("step paths");

assert.equal(friendAddReturnPath("r1"), "/relationships?section=add&myReportId=r1");
assert.equal(friendAddReturnPath(null), "/relationships?section=add");
ok("return path reopens add-friend");

// The decision takes no purchase input at all.
assert.deepEqual(Object.keys(base).sort(), ["hasBirthDate", "reportId", "signedIn", "surveyComplete", "surveyRequired"]);
ok("readiness inputs contain no entitlement / purchase field");

console.log(`\nfriend-add-readiness: ${n} passed`);
