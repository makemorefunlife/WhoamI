/**
 * Phase 6-2d7 — dialogue_table binding to expression_speed.direction.
 * Run: npx tsx tests/unit/romantic-dialogue-expression-speed-binding.test.mjs
 */
import assert from "node:assert/strict";
import { bindDialogueTableToExpressionSpeed } from "../../lib/relationship/romantic/romanticDialogueTableBinding.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

const names = { nameA: "Alex", nameB: "Jordan" };

const llmWrongOrder = [
  {
    speaker: "B",
    label: "Jordan",
    bad_line: "B bad",
    good_line: "B good",
  },
  {
    speaker: "A",
    label: "Alex",
    bad_line: "A bad",
    good_line: "A good",
  },
];

section("1) direction A — faster slot is A first");
const dirA = bindDialogueTableToExpressionSpeed(llmWrongOrder, "A", names);
assert.equal(dirA.length, 2);
assert.equal(dirA[0].speaker, "A");
assert.equal(dirA[0].label, "Alex");
assert.equal(dirA[0].bad_line, "A bad");
assert.equal(dirA[1].speaker, "B");
assert.equal(dirA[1].label, "Jordan");
assert.equal(dirA[1].bad_line, "B bad");
ok("A faster");

section("2) direction B — faster slot is B first");
const dirB = bindDialogueTableToExpressionSpeed(llmWrongOrder, "B", names);
assert.equal(dirB[0].speaker, "B");
assert.equal(dirB[0].label, "Jordan");
assert.equal(dirB[0].good_line, "B good");
assert.equal(dirB[1].speaker, "A");
assert.equal(dirB[1].label, "Alex");
ok("B faster");

section("3) balanced / null — safe fallback (order preserved)");
const balanced = bindDialogueTableToExpressionSpeed(
  llmWrongOrder,
  "balanced",
  names,
);
assert.deepEqual(
  balanced.map((r) => r.speaker),
  ["B", "A"],
);
const missing = bindDialogueTableToExpressionSpeed(llmWrongOrder, null, names);
assert.deepEqual(
  missing.map((r) => r.speaker),
  ["B", "A"],
);
const undef = bindDialogueTableToExpressionSpeed(
  llmWrongOrder,
  undefined,
  names,
);
assert.deepEqual(
  undef.map((r) => r.speaker),
  ["B", "A"],
);
ok("balanced/null unchanged");

section("4) LLM wrong labels cannot override server speakers");
const mislabeled = [
  {
    speaker: "A",
    label: "Jordan (LLM lie)",
    bad_line: "fastish",
    good_line: "ok",
  },
  {
    speaker: "B",
    label: "Alex (LLM lie)",
    bad_line: "slowish",
    good_line: "ok2",
  },
];
const forced = bindDialogueTableToExpressionSpeed(mislabeled, "B", names);
assert.equal(forced[0].speaker, "B");
assert.equal(forced[0].label, "Jordan");
assert.equal(forced[1].speaker, "A");
assert.equal(forced[1].label, "Alex");
ok("labels forced from names + direction");

section("5) missing speakers — still bind when two rows exist");
const noSpeaker = [
  { label: "Someone", bad_line: "x", good_line: "y" },
  { label: "Other", bad_line: "p", good_line: "q" },
];
const inferred = bindDialogueTableToExpressionSpeed(noSpeaker, "A", names);
assert.equal(inferred[0].speaker, "A");
assert.equal(inferred[0].label, "Alex");
assert.equal(inferred[1].speaker, "B");
assert.equal(inferred[1].label, "Jordan");
ok("speaker-less fallback");

section("6) immutable input");
const frozen = structuredClone(llmWrongOrder);
bindDialogueTableToExpressionSpeed(llmWrongOrder, "A", names);
assert.deepEqual(llmWrongOrder, frozen);
ok("no mutate");

console.log("\nOK: romantic dialogue expression-speed binding tests passed");
