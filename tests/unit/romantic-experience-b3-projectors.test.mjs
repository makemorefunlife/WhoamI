/**
 * Romantic Experience B3 content projectors.
 * Run: npx tsx tests/unit/romantic-experience-b3-projectors.test.mjs
 */
import assert from "node:assert/strict";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  ROMANTIC_MODULE_ORDER,
  summarizeRomanticModuleSlots,
} from "../../lib/relationship/romantic/experience/romanticExperienceTypes.ts";
import {
  makeCompleteRomanticReport,
  makeMinimalRomanticReport,
  makePartialRomanticReport,
} from "../fixtures/romantic/minimal-report.mjs";

function ok(name) {
  console.log(`ok - ${name}`);
}

function build(report, extra = {}) {
  return buildRomanticExperienceViewModel({
    report,
    viewerIsReportA: true,
    myName: "Mina",
    partnerName: "Jun",
    nameA: "A-Name",
    nameB: "B-Name",
    locale: "ko-KR",
    ...extra,
  });
}

const FORBIDDEN_VM = [
  "grade",
  "relationship_formula",
  "ScoreBoard",
  "event_scores",
  "total_score",
];

console.log("\n=== 1) complete report projection ===");
const complete = makeCompleteRomanticReport();
const before = JSON.stringify(complete);
const vm = build(complete);
assert.equal(vm.meta.buildId, "b3-content-projectors");
assert.equal(vm.differenceMap.available, true);
assert.ok(vm.differenceMap.buckets.length >= 1);
assert.equal(vm.flow.available, true);
assert.ok(vm.flow.nodes.length >= 2);
assert.equal(vm.dailyLife.available, true);
assert.ok(vm.dailyLife.domains.some((d) => d.supported));
assert.equal(
  vm.dailyLife.domains.find((d) => d.id === "money_practicality")?.supported,
  false,
);
assert.equal(vm.doDont.available, true);
assert.ok(vm.doDont.pack?.items.length >= 1);
assert.equal(vm.repair.available, true);
assert.ok(vm.repair.stages.length >= 1);
assert.equal(vm.nextStep.available, false);
assert.equal(vm.deepRead, null);
const slots = summarizeRomanticModuleSlots(vm);
assert.deepEqual(
  slots.map((s) => s.id),
  [...ROMANTIC_MODULE_ORDER],
);
assert.equal(slots.find((s) => s.id === "M4")?.available, true);
assert.equal(slots.find((s) => s.id === "M5")?.available, true);
assert.equal(slots.find((s) => s.id === "M7")?.available, true);
assert.equal(slots.find((s) => s.id === "M8")?.available, true);
assert.equal(slots.find((s) => s.id === "M9")?.available, true);
ok("M4/M5/M7/M8/M9 available from complete fixture");

console.log("\n=== 2) partial / missing optional evidence ===");
const partial = build(makePartialRomanticReport());
assert.equal(partial.differenceMap.available, false);
assert.equal(partial.flow.available, false);
assert.equal(partial.dailyLife.available, false);
assert.equal(partial.doDont.available, false);
assert.equal(partial.repair.available, false);
assert.equal(partial.nextStep.available, false);
ok("partial → B3 modules unavailable");

const minimal = build(makeMinimalRomanticReport());
assert.equal(minimal.flow.available, false);
assert.equal(minimal.repair.available, false);
assert.equal(minimal.doDont.available, false);
ok("minimal without dynamics → flow/repair/dodont unavailable");

console.log("\n=== 3) deterministic + immutability ===");
const vm2 = build(complete);
assert.deepEqual(vm, vm2);
assert.equal(JSON.stringify(complete), before);
ok("deterministic deep equality; source not mutated");

console.log("\n=== 4) evidence / source traceability ===");
assert.ok(vm.differenceMap.evidence.some((e) => e.path.includes("comparison_table")));
assert.ok(
  vm.differenceMap.buckets.some((b) =>
    b.items.every((i) => i.sourceKeys.length > 0),
  ),
);
assert.ok(vm.flow.nodes.every((n) => n.sourceKeys.length > 0));
assert.ok(
  vm.dailyLife.domains.filter((d) => d.supported).every((d) => d.sourceKeys.length > 0),
);
assert.ok(vm.doDont.pack.items.every((i) => i.evidence.signal_paths.length > 0));
assert.ok(vm.repair.stages.every((s) => s.sourceKeys.length > 0));
ok("evidence paths present on projected items");

console.log("\n=== 5) viewer A/B symmetry ===");
const vmB = build(complete, { viewerIsReportA: false });
assert.equal(vmB.differenceMap.available, true);
const itemA = vm.differenceMap.buckets.flatMap((b) => b.items)[0];
const itemB = vmB.differenceMap.buckets.flatMap((b) => b.items)[0];
assert.ok(itemA && itemB);
assert.equal(itemA.aspect, itemB.aspect);
assert.equal(itemA.me, itemB.partner);
assert.equal(itemA.partner, itemB.me);
assert.equal(vm.repair.asymmetry?.fasterExpresser, "me");
assert.equal(vmB.repair.asymmetry?.fasterExpresser, "partner");
ok("viewer A/B lean and asymmetry swap");

console.log("\n=== 6) no grade / formula / ScoreBoard / event_scores ===");
const json = JSON.stringify(vm);
for (const key of FORBIDDEN_VM) {
  assert.equal(json.includes(`"${key}"`), false, `must not contain ${key}`);
}
assert.equal(Object.hasOwn(vm, "grade"), false);
ok("forbidden score fields absent");

console.log("\n=== 7) no invented meant/heard; repair ordered ===");
assert.ok(vm.conflict.rows.every((r) => r.meant === null && r.heard === null));
const order = ["pause", "re_entry", "acknowledgement", "clarification", "reassurance", "closure"];
const ids = vm.repair.stages.map((s) => s.id);
for (let i = 1; i < ids.length; i++) {
  assert.ok(
    order.indexOf(ids[i - 1]) < order.indexOf(ids[i]),
    `stage order ${ids[i - 1]} before ${ids[i]}`,
  );
}
ok("meant/heard null; repair stages ordered");

console.log("\n=== 8) M8 preventive vs M9 recovery separation ===");
const preventive = new Set(
  (vm.doDont.pack?.items ?? []).flatMap((i) => [
    i.headline,
    ...i.do_list,
    ...i.dont_list,
  ]),
);
for (const stage of vm.repair.stages) {
  assert.equal(preventive.has(stage.body), false);
  if (stage.speakable) assert.equal(preventive.has(stage.speakable), false);
}
assert.ok(vm.doDont.pack.intro_line.includes("예방"));
ok("M8 lines not copied into M9 bodies");

console.log("\n=== 9) M4 does not carry M3 why_special; M5 not M2 needs ===");
const m4json = JSON.stringify(vm.differenceMap);
assert.equal(m4json.includes(vm.whySpecial.whySpecial ?? "___"), false);
const m5json = JSON.stringify(vm.flow);
assert.equal(m5json.includes(vm.hiddenHeart.me?.need ?? "___"), false);
assert.equal(m5json.includes(vm.hiddenHeart.partner?.need ?? "___"), false);
for (const row of vm.conflict.rows) {
  if (row.said) assert.equal(m5json.includes(row.said), false);
  if (row.better) assert.equal(m5json.includes(row.better), false);
}
ok("cross-module copy guards");

console.log("\n=== 10) B2 modules still project ===");
assert.equal(vm.opening.available, true);
assert.equal(vm.hiddenHeart.available, true);
assert.equal(vm.whySpecial.available, true);
assert.equal(vm.conflict.available, true);
assert.equal(vm.horizon.available, true);
ok("B2 modules remain available");

console.log("\n=== 11) weak chores proxy + money unsupported ===");
const chores = vm.dailyLife.domains.find((d) => d.id === "chores_structure");
const money = vm.dailyLife.domains.find((d) => d.id === "money_practicality");
assert.equal(chores?.supported, false);
assert.equal(chores?.observation, null);
assert.equal(chores?.sourceKeys.length, 0);
assert.equal(money?.supported, false);
assert.equal(money?.observation, null);
const supportedObs = vm.dailyLife.domains
  .filter((d) => d.supported)
  .map((d) => d.observation ?? "")
  .join(" ");
assert.equal(/청소|설거지|빨래|가사 분담|집안일 나누/.test(supportedObs), false);
assert.equal(
  vm.dailyLife.domains.some(
    (d) =>
      d.id === "chores_structure" &&
      d.supported &&
      (d.sourceKeys ?? []).some((k) => k.includes("stress")),
  ),
  false,
);
ok("money/chores unsupported; no household-specific claims");

console.log("\n=== 12) section_5_action excluded from deterministic pack ===");
assert.ok(vm.doDont.pack?.items.length >= 1);
for (const item of vm.doDont.pack.items) {
  assert.equal(item.evidence.source.startsWith("canonical_projections."), true);
  assert.equal(item.evidence.source.includes("section_5"), false);
  assert.equal(
    item.evidence.signal_paths.some((p) => p.includes("section_5_action")),
    false,
  );
}
const actionTitle = complete.section_5_action.advice_for_a[0].action_title;
assert.equal(
  JSON.stringify(vm.doDont.pack).includes(actionTitle),
  false,
);
ok("section_5_action not mixed into M8 pack");

console.log("\n=== 13) every M9 stage evidence-backed; good_line speakable only ===");
for (const stage of vm.repair.stages) {
  assert.ok(stage.sourceKeys.length >= 1);
}
const closure = vm.repair.stages.find((s) => s.id === "closure");
if (closure?.speakable) {
  assert.ok(
    complete.section_3_conversation_patterns.conflict_situation.dialogue_table.some(
      (r) => r.good_line === closure.speakable,
    ),
  );
  // speakable must not be the sole reason stages exist — other stages from canonical
  assert.ok(vm.repair.stages.some((s) => s.id !== "closure"));
}
ok("M9 stages sourced; good_line is speakable only");

console.log("\nAll romantic-experience-b3-projectors tests passed.");
