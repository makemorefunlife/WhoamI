/**
 * Free relationship result per language (decision 5): the original is never
 * rewritten; another language is made from scratch only on request.
 * Run: npx tsx tests/unit/relationship-basic-by-locale.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickBasicForLocale } from "../../lib/relationship/basicResultByLocale";

const ko = { locale: "ko-KR", perspectives: { a: {}, b: {} } };
const en = { locale: "en-US", perspectives: { a: {}, b: {} } };
const unknown = { perspectives: { a: {}, b: {} } };

assert.deepEqual(pickBasicForLocale({ original: ko, localeRow: null, locale: "ko-KR" }), { kind: "original", result: ko });
assert.deepEqual(pickBasicForLocale({ original: ko, localeRow: null, locale: "en-US" }), { kind: "other_locale_only", otherLocale: "ko-KR" });
assert.deepEqual(pickBasicForLocale({ original: ko, localeRow: en, locale: "en-US" }), { kind: "locale_row", result: en });
assert.deepEqual(pickBasicForLocale({ original: ko, localeRow: null, locale: "ko-KR" }).kind, "original", "ko screen: the Korean original");
assert.deepEqual(pickBasicForLocale({ original: unknown, localeRow: null, locale: "en-US" }), { kind: "original", result: unknown }, "language never recorded: shown as is, not guessed");
assert.deepEqual(pickBasicForLocale({ original: null, localeRow: null, locale: "en-US" }), { kind: "none" });
assert.deepEqual(pickBasicForLocale({ original: { locale: "ko-KR" }, localeRow: null, locale: "en-US" }), { kind: "none" }, "no result content");
console.log("ok - which free result a screen shows");

const route = readFileSync("app/api/relationship/analyze/basic/route.ts", "utf8");
assert.match(route, /pick\.kind === "other_locale_only" && body\.create_in_locale !== true/, "other language: only on request");
assert.match(route, /saveBasicResultForLocale\(/, "new language saved per language");
const updates = route.match(/\.from\("relationship_reports"\)\s*\.update\(/g) ?? [];
assert.equal(updates.length, 1, "result_basic written in exactly one place");
assert.match(route, /if \(originalExists\) \{[\s\S]*saveBasicResultForLocale[\s\S]*\} else \{[\s\S]*\.from\("relationship_reports"\)\s*\.update/, "...and only when there is no original");
assert.doesNotMatch(route, /patchedWithLocale|migratedWithLocale/, "display repairs are not saved");
const detail = readFileSync("app/api/relationship/detail/route.ts", "utf8");
assert.match(detail, /basic_other_locale:/);
const hook = readFileSync("app/relationship/[id]/useRelationshipDetail.ts", "utf8");
assert.match(hook, /if \(hasBasicContent \|\| basicOtherLocale \|\| basicAttempted\.current\) return;/, "no automatic generation in the other language");
assert.match(hook, /create_in_locale: true/);
console.log("ok - route/detail/screen: original kept, other language only from the button");
