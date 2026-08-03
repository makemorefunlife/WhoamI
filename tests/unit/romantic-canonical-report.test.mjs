import assert from "node:assert/strict";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload.ts";

const EXPECTED_TITLES = [
  "우리는 어떤 커플인가",
  "왜 서로에게 끌렸는가",
  "우리가 관계를 맺는 방식",
  "실제로 자주 부딪히는 순간",
  "마음이 잘못 번역되는 순간",
  "가장 깊은 곳, 숨은 마음",
  "다시 가까워지는 방법",
  "함께라서 강해지는 것과 취약해지는 것",
  "현실에서 마주하는 장면들",
  "올해 우리 관계의 흐름",
  "관계를 통해 배우는 것",
  "이해한 뒤 우리가 선택할 것",
];

const report = buildCanonicalRomanticV4Report("ko-KR");
assert.equal(report.schemaVersion, "romantic_canonical_report_v1");
assert.equal(report.sections.length, 12);
assert.deepEqual(
  report.sections.map((s) => s.title),
  EXPECTED_TITLES,
);

// validation must not be neutered; soft warnings ok, structural errors fail hard when present
for (const issue of report.validation.issues) {
  if (issue.severity === "error") {
    assert.fail(`canonical validation error: ${issue.code} ${issue.message}`);
  }
}

const byId = Object.fromEntries(report.sections.map((s) => [s.chapterId, s]));

// 3. CONNECT unused engine evidence into story plan / report
assert.ok(report.connectedFromExistingEngine.length > 0, "expected CONNECT evidence ids");
const connectJoin = report.connectedFromExistingEngine.join(" ");
assert.ok(
  /cross_chart_stem_combine|cross_chart_six_combine|cross_chart_wonjin|pair_ce_bonding|balance_of_power|psych_match/.test(
    connectJoin,
  ),
  `expected CONNECT of existing combine/psych evidence, got: ${connectJoin}`,
);

// 6–9 bilateral attraction / misread / repair
const attr = byId.c2_attraction;
assert.ok(attr.visible);
assert.ok(attr.blocks.some((b) => b.blockId === "attr.a"));
assert.ok(attr.blocks.some((b) => b.blockId === "attr.b"));
assert.ok(report.storyPlan.attraction.aSeeks.seeker === "a");
assert.ok(report.storyPlan.attraction.bSeeks.seeker === "b");

const mis = byId.c5_misunderstanding;
assert.ok(mis.visible);
assert.ok(mis.blocks.filter((b) => b.blockId.startsWith("misread.")).length >= 2);

const repair = byId.c7_repair;
assert.ok(repair.visible);
assert.ok(repair.blocks.some((b) => b.blockId === "repair.helpsA"));
assert.ok(repair.blocks.some((b) => b.blockId === "repair.helpsB"));

const dual = byId.c8_strength_vulnerability;
assert.ok(dual.visible);
assert.ok(report.storyPlan.bilateralChanges.length >= 2);
assert.ok(
  report.storyPlan.bilateralChanges.some((c) => c.from === "a" && c.to === "b"),
);
assert.ok(
  report.storyPlan.bilateralChanges.some((c) => c.from === "b" && c.to === "a"),
);

// 11 timing
const year = byId.c10_future_timing;
assert.ok(year);

// 12 no internal leak in user-visible bodies
const bodyText = report.sections
  .filter((s) => s.visible)
  .flatMap((s) => s.blocks.map((b) => `${b.title}\n${b.body}`))
  .join("\n");
for (const leaked of [
  "personal_ce_v1",
  "pair_ce_v1",
  "sourceKind",
  "schema_version",
  "ce.individual.a",
  "ch2_",
]) {
  assert.equal(bodyText.includes(leaked), false, `leaked: ${leaked}`);
}

// 14 no empty visible chapters
for (const section of report.sections.filter((s) => s.visible)) {
  assert.ok(section.blocks.length > 0, `empty visible chapter ${section.chapterId}`);
  assert.ok(section.blocks.every((b) => b.body.trim().length > 0));
}

// payload wire
const payload = buildRomanticV4PrototypePayload("complete", "ko-KR");
assert.ok(payload.canonicalReport);
assert.equal(payload.canonicalReport.sections.length, 12);

const en = buildCanonicalRomanticV4Report("en-US");
assert.equal(en.sections.length, 12);
assert.ok(en.names.a);

console.log(
  JSON.stringify(
    {
      validationOk: report.validation.ok,
      warnings: report.validation.issues.filter((i) => i.severity === "warning").map((i) => i.code),
      visible: report.sections.filter((s) => s.visible).map((s) => s.chapterId),
      hidden: report.hiddenChapters,
      connectedCount: report.connectedFromExistingEngine.length,
      timingAvailable: report.storyPlan.timing.available,
      chemistryAvailable: report.storyPlan.pairChemistry.available,
    },
    null,
    2,
  ),
);
console.log("romantic canonical report tests passed");
