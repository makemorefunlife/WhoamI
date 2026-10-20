/**
 * My Account "My Credits" numbers per site (2026-10-21).
 *
 * English site: the tiles show what can actually be spent on the English site
 * (English-site + both-site credits = /api/account/entitlements?locale=en-US
 * breakdown.usableHere). Korean site: unchanged -- same request and the same
 * account total as before. Display only; spending (reserve_credit with the
 * site's locale) is not touched.
 *
 * Static-source + fixture style, like tests/unit/account-credits-gift-tile.test.mjs.
 * Run: npx tsx tests/unit/account-credits-site-view.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const src = readFileSync(join(root, "components/account/AccountCreditsSection.tsx"), "utf8");

// 1) requests
assert.ok(
  src.includes('isEn ? "/api/account/entitlements?locale=en-US" : "/api/account/entitlements"'),
  "en-US asks for the English-site view; ko-KR keeps the original request",
);
assert.ok(/\}, \[isEn\]\);/.test(src), "request re-runs if the site language changes");
console.log("ok - en-US requests ?locale=en-US, ko-KR request unchanged");

// 2) the expression the tiles use, evaluated on the A/B account's real shape
const m = src.match(/const shownRemaining = \(c: CreditSummary\): number =>\s*([\s\S]*?);\n/);
assert.ok(m, "shownRemaining expression present");
const body = m[1].replace(/\?\./g, "?.");
// eslint-disable-next-line no-new-func
const make = (isEn) => new Function("c", "isEn", `return (${body});`).bind(null);
const shown = (isEn, c) => make(isEn)(c, isEn);

// PROD A/B account after integration: personal lots ko 7 / both 5, relationship ko 2.
const personalEn = { remaining: 12, breakdown: { usableHere: { remaining: 5 } } };
const relationshipEn = { remaining: 2, breakdown: { usableHere: { remaining: 0 } } };
const personalKo = { remaining: 12, breakdown: { usableHere: { remaining: 12 } } };
const relationshipKo = { remaining: 2, breakdown: { usableHere: { remaining: 2 } } };

assert.equal(shown(true, personalEn), 5, "English site: personal = English + both-site credits");
assert.equal(shown(true, relationshipEn), 0, "English site: no relationship credit usable here");
assert.equal(shown(false, personalKo), 12, "Korean site: unchanged total");
assert.equal(shown(false, relationshipKo), 2, "Korean site: unchanged total");
assert.equal(shown(false, { remaining: 9, breakdown: { usableHere: { remaining: 3 } } }), 9, "Korean site never switches to the per-site number");
assert.equal(shown(true, { remaining: 4 }), 4, "older API shape without breakdown: falls back to the total");
console.log("ok - English tiles show usable-here counts; Korean tiles show the same totals as before");

// 3) both tiles use the per-site value; nothing spends or writes
assert.ok(src.includes("copy.myAccessRemainingCount(personalShown)"));
assert.ok(src.includes("copy.myAccessRemainingCount(relationshipShown)"));
assert.ok(!/reserve_credit|consume_credit|method:\s*"POST"/.test(src), "display only");
console.log("ok - both tiles use the site view; display only");
