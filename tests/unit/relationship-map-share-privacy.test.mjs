/**
 * Anonymous Relationship Map share — privacy regression test (gap-closure
 * section 9). Feeds buildAnonymousMapShare/buildAnonymousMapShareText a
 * fixture whose role rows carry distinctive, obviously-sensitive-looking
 * extra fields (name, email, report/person ids, a fake Day Master, a fake
 * raw connection record) that a future regression might start spreading
 * into the output. Asserts none of those distinctive markers ever appear
 * in the built share object or its rendered text — not just that the
 * *type* excludes them, but that the actual runtime output does too.
 *
 * Run: npx tsx tests/unit/relationship-map-share-privacy.test.mjs
 */
import assert from "node:assert/strict";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const { buildAnonymousMapShare } = await import(
  "../../lib/relationship/map/buildAnonymousMapShare.ts"
);
const { buildAnonymousMapShareText } = await import(
  "../../lib/relationship/map/anonymousMapShareText.ts"
);

const LEAK_MARKERS = [
  "LEAK_NAME_동글",
  "LEAK_EMAIL_donggeul@example.com",
  "LEAK_REPORT_ID_51e60cca-8596-4634-87e7-ca3b6468b14c",
  "LEAK_PERSON_ID_9df3e263-0875-4e19-8f0b-9e9181f84b6f",
  "LEAK_DAYMASTER_jeong",
  "LEAK_BIRTHDATE_1998-03-14",
  "LEAK_SURVEY_ANSWER_q7",
];

// Simulates a row that (incorrectly, hypothetically) still carries raw
// connection/PII fields alongside the {roleId, count} the function actually
// needs -- proving the function reaches for only what it declares, not
// "whatever happens to be on the object."
const contaminatedRoles = [
  {
    roleId: "my_person",
    count: 3,
    partnerName: LEAK_MARKERS[0],
    recipientEmail: LEAK_MARKERS[1],
    relationshipReportId: LEAK_MARKERS[2],
    partnerReportId: LEAK_MARKERS[3],
    dayMaster: LEAK_MARKERS[4],
    birthDate: LEAK_MARKERS[5],
    surveyAnswerId: LEAK_MARKERS[6],
  },
  { roleId: "couch", count: 2 },
  { roleId: "spark", count: 1 },
  { roleId: "muse", count: 0 },
];

section("buildAnonymousMapShare never surfaces contaminating fields");
const share = buildAnonymousMapShare(
  { totalPeople: 6, roles: contaminatedRoles },
  "en-US",
);
const serialized = JSON.stringify(share);
for (const marker of LEAK_MARKERS) {
  assert.ok(!serialized.includes(marker), `leaked "${marker}" into buildAnonymousMapShare output`);
}
assert.equal(share.roles.length, 4);
assert.equal(share.roles[0].label, "My Person");
assert.equal(share.roles[0].count, 3);
assert.equal(share.roles[0].percent, 50);
// Only the declared fields should exist on each output row.
for (const row of share.roles) {
  assert.deepEqual(Object.keys(row).sort(), ["count", "label", "percent", "roleId"]);
}
ok("share object contains zero leak markers and only {roleId, label, count, percent} per role");

section("buildAnonymousMapShareText never surfaces contaminating fields");
const text = buildAnonymousMapShareText(
  share,
  (n) => (n === 1 ? "1 person" : `${n} people`),
  "My Relationship Map",
);
for (const marker of LEAK_MARKERS) {
  assert.ok(!text.includes(marker), `leaked "${marker}" into share text`);
}
assert.ok(text.includes("My Person 3 people · 50%"));
assert.ok(text.includes("Couch 2 people · 33%"));
assert.ok(text.includes("Spark 1 person · 17%"));
assert.ok(!text.includes("Muse"), "zero-count roles are omitted from the shared text, not just zeroed out");
ok("rendered share text contains zero leak markers; zero-count roles are omitted entirely");

section("Korean locale: labels localize, still zero leakage");
const shareKo = buildAnonymousMapShare({ totalPeople: 6, roles: contaminatedRoles }, "ko-KR");
const serializedKo = JSON.stringify(shareKo);
for (const marker of LEAK_MARKERS) {
  assert.ok(!serializedKo.includes(marker), `leaked "${marker}" into ko-KR share output`);
}
assert.equal(shareKo.roles[0].label, "내 편");
ok("ko-KR share output localizes labels with zero leak markers");

console.log("\nAll relationship-map share privacy tests passed.");
