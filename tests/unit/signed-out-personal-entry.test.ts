/**
 * Signed-out entry to personal analysis (2026-10-12): the dock '나' (and the
 * menu '나를 읽다' page) show the personal choice -- free trial (login asked
 * only when chosen) or guest purchase (no login) -- instead of sign-in.
 * MOCK/static test: no browser, no Clerk.
 * Run: npx tsx tests/unit/signed-out-personal-entry.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openStitchPersonalChoice, setStitchPersonalChoiceHandler } from "../../lib/stitch/authBridge";
import { messagesKoKR as ko } from "../../lib/i18n/messages/ko-KR";
import { messagesEnUS as en } from "../../lib/i18n/messages/en-US";

// Bridge: false when the home page is not mounted (caller navigates to /?start=personal).
assert.equal(openStitchPersonalChoice(), false);
let opened = 0;
setStitchPersonalChoiceHandler(() => opened++);
assert.equal(openStitchPersonalChoice(), true);
assert.equal(opened, 1);
setStitchPersonalChoiceHandler(null);
assert.equal(openStitchPersonalChoice(), false);
console.log("ok - bridge opens the choice on the home page (/ and /kr alike), else reports not mounted");

const dock = readFileSync("components/layout/stitch/StitchScrollDock.tsx", "utf8");
assert.doesNotMatch(dock, /openSignIn/, "dock '나' never opens sign-in");
assert.doesNotMatch(dock, /pathname === "\/"/, "no '/'-only check (failed on /kr)");
assert.match(dock, /openStitchPersonalChoice\(\)/);
assert.match(dock, /localize\("\/\?start=personal"\)/);
console.log("ok - dock '나' (signed out, no profile): personal choice in place, or home with ?start=personal");

const home = readFileSync("app/homecontent.tsx", "utf8");
assert.match(home, /setStitchPersonalChoiceHandler\(/);
assert.match(home, /start !== "personal"/);
assert.match(home, /variant=\{startChoiceVariant\}/);
// Free trial keeps the existing path (login modal with the guest-buy link); purchase = existing pricing page.
assert.match(home, /onStartFree=\{\(\) => void startFreeSurvey\(\)\}/);
assert.match(home, /router\.push\(localize\(ROUTES\.pricing\)\)/);
console.log("ok - home: ?start=personal opens the personal choice; free -> existing login step, buy -> existing guest pricing");

const modal = readFileSync("components/landing/stitch/StartChoiceModal.tsx", "utf8");
assert.match(modal, /variant === "personal" && !signedIn/);
assert.match(modal, /<PersonalChoiceOptions/);
const opts = readFileSync("components/landing/stitch/PersonalChoiceOptions.tsx", "utf8");
assert.match(opts, /onClick=\{onStartFree\}/);
assert.match(opts, /onClick=\{onBuyAsGuest\}/);
assert.doesNotMatch(opts, /openSignIn|useClerk/, "choosing does not itself open sign-in");
console.log("ok - choice = free trial (with 'login first' note) + guest purchase");

const bp = readFileSync("app/blueprint-preview/page.tsx", "utf8");
assert.match(bp, /authLoaded && !isSignedIn/);
assert.match(bp, /localize\("\/\?start=self"\)/);
assert.match(bp, /localize\(ROUTES\.pricing\)/);
console.log("ok - /blueprint-preview signed out without a profile shows the same choice");

for (const [name, m] of [["ko", ko], ["en", en]] as const) {
  const t = m.startChoiceModal;
  for (const k of ["personalChoiceTitle", "personalChoiceFreeTitle", "personalChoiceFreeDesc", "personalChoiceBuyTitle", "personalChoiceBuyDesc", "freeNeedsLogin", "personalDesc"] as const) {
    assert.ok(typeof t[k] === "string" && t[k].length > 0, `${name}.${k}`);
  }
}
assert.equal(ko.startChoiceModal.personalChoiceFreeTitle, "무료 체험");
assert.equal(ko.startChoiceModal.personalChoiceBuyTitle, "비회원 유료 구매");
console.log("ok - copy present in ko / en");
console.log("signed-out-personal-entry: 5 passed");
