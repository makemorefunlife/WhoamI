/**
 * /onboarding/birth uses the same light Stitch birth form and save payload as
 * the other birth-input screens (no dark space theme). Static/mock test.
 * Run: npx tsx tests/unit/birth-onboarding-light.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/onboarding/birth/page.tsx", "utf8");
assert.doesNotMatch(page, /SpaceBackground|GlowButton|onboarding\/BirthInputForm"/, "no dark space theme / old dark form");
assert.match(page, /<StitchSurveyShell>/);
assert.match(page, /<StitchBirthInputForm/);
assert.match(page, /isStitchBirthFormReady\(birthForm\)/);
assert.match(page, /className="stitch-cta-primary w-full/);
console.log("ok - light Stitch shell + form + primary button, like guest use / survey complete");

// Same payload as survey-v2/complete (unknown place -> locale fallback + coordinates).
for (const k of ["birthPlaceUnknown: payload.birthPlaceUnknown", "unknownFallback.latitude", "unknownFallback.longitude", '"/api/report/birth"']) {
  assert.ok(page.includes(k), k);
}
// Flow kept: return to the friend-add origin or the blueprint; reset still offered.
assert.match(page, /consumeSelfProfileReturn\(reportId\)/);
assert.match(page, /messages\.onboarding\.resetCta/);
console.log("ok - save payload and next step unchanged in meaning");
console.log("birth-onboarding-light: 2 passed");
