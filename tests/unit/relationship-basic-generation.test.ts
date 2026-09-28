/**
 * Relationship Basic (free) analysis -- generation shape + error copy.
 * Run: npx tsx tests/unit/relationship-basic-generation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildRelationshipBasicResponseSchema } from "../../lib/prompts/relationshipAnalysis";
import {
  RELATIONSHIP_AXIS_KEYS,
  normalizeRelationshipPerspectives,
} from "../../lib/relationship/normalizeRelationshipPerspectives";
import { describePerspectivesShape } from "../../lib/relationship/describePerspectivesShape";
import { messagesEnUS as enUS } from "../../lib/i18n/messages/en-US";
import { messagesKoKR as koKR } from "../../lib/i18n/messages/ko-KR";

const HANGUL = /[가-힣]/;
let passed = 0;
const ok = (n: string) => {
  passed += 1;
  console.log(`ok - ${n}`);
};

const A = "9b2f6c1e-1111-4a4a-8888-aaaaaaaaaaaa";
const B = "3d7e0f2a-2222-4b4b-9999-bbbbbbbbbbbb";

// ---- 1. Strict schema pins the exact shape the validator requires ---------
type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema };
const schema = buildRelationshipBasicResponseSchema(A, B) as Schema;
function assertStrict(node: Schema, path: string) {
  if (node.type === "object") {
    assert.equal(node.additionalProperties, false, `${path}: additionalProperties must be false`);
    assert.deepEqual([...(node.required ?? [])].sort(), Object.keys(node.properties ?? {}).sort(), `${path}: every property required`);
    for (const [k, v] of Object.entries(node.properties ?? {})) assertStrict(v, `${path}.${k}`);
  }
  if (node.type === "array") assertStrict(node.items!, `${path}[]`);
}
assertStrict(schema, "root");
const persp = schema.properties!.perspectives;
assert.deepEqual(persp.required, [A, B]);
for (const id of [A, B]) {
  assert.deepEqual(persp.properties![id].required, [...RELATIONSHIP_AXIS_KEYS]);
  for (const axis of RELATIONSHIP_AXIS_KEYS) {
    const ax = persp.properties![id].properties![axis];
    assert.equal(ax.properties!.my_line.type, "string");
    assert.equal(ax.properties!.partner_line.type, "string");
    assert.equal(ax.properties!.insights.type, "array");
    assert.equal(ax.properties!.actions.type, "array");
  }
}
ok("strict schema: both perspective ids, all 4 axes, every field + type required (OpenAI strict-mode compatible)");

// Any response that satisfies the schema passes the (unchanged) validator.
function sampleFrom(node: Schema, key = ""): unknown {
  if (node.type === "object") return Object.fromEntries(Object.entries(node.properties!).map(([k, v]) => [k, sampleFrom(v, k)]));
  if (node.type === "array") return [`${key} one`, `${key} two`];
  return `${key} text`;
}
const conforming = sampleFrom(schema) as { perspectives: Record<string, unknown> };
assert.ok(normalizeRelationshipPerspectives(conforming, A, B, "tester", "Partner", "en-US"));
ok("a schema-conforming response always passes normalizeRelationshipPerspectives");

// ---- 2. Validation is NOT weakened ----------------------------------------
const clone = () => JSON.parse(JSON.stringify(conforming));
const stringInsights = clone();
stringInsights.perspectives[B].conflict_response.insights = "one string";
assert.equal(normalizeRelationshipPerspectives(stringInsights, A, B, "t", "P", "en-US"), null);
const missingAxis = clone();
delete missingAxis.perspectives[B].energy_pattern;
assert.equal(normalizeRelationshipPerspectives(missingAxis, A, B, "t", "P", "en-US"), null);
const onePerspective = clone();
delete onePerspective.perspectives[B];
assert.equal(normalizeRelationshipPerspectives(onePerspective, A, B, "t", "P", "en-US"), null);
ok("validator still rejects wrong types, missing axes and a missing perspective");

// ---- 3. Failure diagnostics name the exact field, never content ---------
const secret = "PRIVATE generated sentence about tester";
const diag = clone();
diag.perspectives[B].conflict_response.insights = secret;
delete diag.perspectives[A].energy_pattern;
const d = describePerspectivesShape(diag, A, B);
assert.match(d, /B\.conflict_response:invalid\(insights=string\)/);
assert.match(d, /A\.energy_pattern:missing/);
assert.ok(!d.includes(secret) && !d.includes(A) && !d.includes("tester"), "no content/ids/names in logs");
assert.equal(describePerspectivesShape(onePerspective, A, B), "slices=1 idB:absent");
ok("server log explains which perspective/axis/field failed, with no generated text, ids or names");

// ---- 4. Route: strict generation, localized errors, no internal wording --
const route = readFileSync("app/api/relationship/analyze/basic/route.ts", "utf8");
const code = route.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
assert.match(code, /type: "json_schema"/);
assert.match(code, /strict: true/);
assert.match(code, /buildRelationshipBasicResponseSchema\(rr\.report_id_a, rr\.report_id_b\)/);
assert.doesNotMatch(code, /type: "json_object"/);
ok("generation uses Structured Outputs (strict schema) instead of free-form json_object");

assert.ok(!HANGUL.test(code), "no hardcoded Korean in the route");
assert.doesNotMatch(code, /error: "[^"]*"/, "no hardcoded error string literals");
assert.doesNotMatch(code, /error:[^\n]*LLM/);
assert.match(code, /\{ error: messages\.errors\.analysisFailed \},\s*\{ status: 502 \}/);
assert.match(code, /messages = getMessages\(locale\)/);
// Fallback names come from the canonical resolver (request locale), which
// reads the localized labels (lib/relationship/relationshipPersonNames.ts).
assert.match(code, /await resolveRelationshipPairLabels\(\{[\s\S]{0,200}locale,/);
const personNames = readFileSync("lib/relationship/relationshipPersonNames.ts", "utf8");
assert.match(personNames, /me: m\.meFallbackLabel, other: m\.partnerFallbackLabel/);
ok("every user-facing error comes from i18n for the request locale; fallback names are localized");

assert.match(code, /catch \{\s*parsed = null;\s*\}/);
assert.match(code, /if \(!parsed\?\.perspectives\) \{\s*await releaseRateLimitSlot/);
ok("unparseable output is handled (rate-limit slot released, friendly error) instead of throwing");

// ---- 5. Copy: English has no Korean, nothing exposes internal field names
const keys = ["analysisFailed", "relationshipSurveyIncomplete", "relationshipIdsRequired", "serviceUnavailable", "notFound", "relationshipSaveFailed", "unauthorized"] as const;
for (const k of keys) {
  const en = (enUS.errors as Record<string, string>)[k];
  const ko = (koKR.errors as Record<string, string>)[k];
  assert.ok(en && ko, `missing ${k}`);
  assert.ok(!HANGUL.test(en), `en ${k} contains Korean`);
  assert.ok(HANGUL.test(ko), `ko ${k} should be Korean`);
  for (const s of [en, ko]) assert.doesNotMatch(s, /LLM|_id\b|report_id|viewer_report/i, `${k} exposes internals`);
}
assert.ok(!HANGUL.test(enUS.report.meFallbackLabel) && !HANGUL.test(enUS.report.partnerFallbackLabel));
ok("en errors are English, ko errors are Korean, none mention LLM or internal ids");

console.log(`\nrelationship-basic-generation: ${passed} passed`);
