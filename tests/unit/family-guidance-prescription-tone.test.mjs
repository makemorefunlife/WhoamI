/**
 * Part5 처방 — Part2 C guidance_fit 톤 보조 회귀.
 * Run: npx tsx tests/unit/family-guidance-prescription-tone.test.mjs
 */
import assert from "node:assert/strict";
import {
  applyGuidanceFitToneToPrescriptions,
  buildGuidanceFitToneAux,
  FAMILY_GUIDANCE_TONE_FORBIDDEN_PHRASES,
  mergeGuidanceToneSummary,
  selectGuidanceToneTargetIndex,
} from "../../lib/relationship/familyParent/familyGuidancePrescriptionTone.ts";
import { buildFamilyPrescriptions } from "../../lib/relationship/familyParent/buildFamilyPrescriptions.ts";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { resolveGuidanceFit } from "../../lib/personCore/sajuSignals/guidanceProfile.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function section(title) {
  console.log(`\n=== ${title} ===`);
}
function ok(name) {
  console.log(`ok - ${name}`);
}

function assertNoForbidden(text) {
  const s = String(text);
  const lower = s.toLowerCase();
  for (const phrase of FAMILY_GUIDANCE_TONE_FORBIDDEN_PHRASES) {
    assert.ok(
      !lower.includes(phrase.toLowerCase()) && !s.includes(phrase),
      `forbidden: ${phrase}`,
    );
  }
}

function sajuFromBirth(birthDate) {
  const bundle = calculateSajuBundle({ birthDate, birthTime: "12:00" });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

function stubItem(topic, summary = "base summary") {
  return {
    topic,
    headline: "h",
    evidence: {
      source: "pair_family_signals",
      signal_paths: [],
      summary,
      snapshot: {},
    },
    do_list: ["a"],
    dont_list: ["b"],
  };
}

const basePair = {
  umbilical_separation_index: 70,
  umbilical_band: "high",
  nagging_trigger_index: 65,
  nagging_band: "high",
  combined_karma_tension: 50,
  guidance_fit: null,
};

const baseParams = {
  nicknameA: "Alex",
  nicknameB: "Jordan",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuFromBirth("2014-05-15"),
  sajuJsonB: sajuFromBirth("1988-08-20"),
  locale: "ko-KR",
};

// ---------------------------------------------------------------------------
section("1) locale별 aux · 금지 의미 없음");

for (const fit of ["aligned", "partial", "mismatch"]) {
  for (const loc of ["ko-KR", "en-US"]) {
    const aux = buildGuidanceFitToneAux(fit, loc);
    assert.ok(aux.length > 0);
    assert.ok(!/^\s/.test(aux));
    assert.ok(!aux.includes("  "));
    assertNoForbidden(aux);
  }
}
assert.ok(buildGuidanceFitToneAux("aligned", "ko-KR").includes("일관"));
assert.ok(buildGuidanceFitToneAux("partial", "ko-KR").includes("순서"));
assert.ok(buildGuidanceFitToneAux("mismatch", "ko-KR").includes("채널"));
assert.ok(
  buildGuidanceFitToneAux("aligned", "en-US").toLowerCase().includes("consistent"),
);
assert.ok(
  buildGuidanceFitToneAux("partial", "en-US").toLowerCase().includes("order"),
);
assert.ok(
  buildGuidanceFitToneAux("mismatch", "en-US").toLowerCase().includes("channel"),
);

const toneSrc = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../lib/relationship/familyParent/familyGuidancePrescriptionTone.ts",
  ),
  "utf8",
);
const auxFn = toneSrc.slice(
  toneSrc.indexOf("export function buildGuidanceFitToneAux"),
  toneSrc.indexOf("export function selectGuidanceToneTargetIndex"),
);
assert.ok(!auxFn.includes("FAMILY_GUIDANCE_TONE_FORBIDDEN_PHRASES"));
ok("locale aux safe");

// ---------------------------------------------------------------------------
section("2) 대상 선택 순서 (첫 매치 결정론)");

assert.equal(
  selectGuidanceToneTargetIndex([
    stubItem("umbilical_independence"),
    stubItem("nagging_karma_avoidance"),
    stubItem("family_baseline"),
  ]),
  1,
);
assert.equal(
  selectGuidanceToneTargetIndex([
    stubItem("nagging_karma_avoidance"),
    stubItem("nagging_karma_avoidance"),
  ]),
  0,
  "여러 nagging → 첫 번째",
);
assert.equal(
  selectGuidanceToneTargetIndex([
    stubItem("umbilical_independence"),
    stubItem("family_baseline"),
    stubItem("family_baseline"),
  ]),
  1,
  "nagging 없음 → 첫 baseline",
);
assert.equal(
  selectGuidanceToneTargetIndex([stubItem("umbilical_independence")]),
  -1,
);
assert.equal(selectGuidanceToneTargetIndex([]), -1);
ok("target selection fixed");

// ---------------------------------------------------------------------------
section("3) mergeSummary — empty/null/undefined · 이중공백 금지");

const aux = buildGuidanceFitToneAux("aligned", "ko-KR");
assert.equal(mergeGuidanceToneSummary("hello", aux), `hello ${aux}`);
assert.equal(mergeGuidanceToneSummary("", aux), aux);
assert.equal(mergeGuidanceToneSummary("   ", aux), aux);
assert.equal(mergeGuidanceToneSummary(null, aux), aux);
assert.equal(mergeGuidanceToneSummary(undefined, aux), aux);
assert.equal(mergeGuidanceToneSummary(`hello ${aux}`, aux), `hello ${aux}`);
assert.ok(!mergeGuidanceToneSummary("  hello  ", aux).includes("  "));
assert.ok(!/^\s/.test(mergeGuidanceToneSummary(null, aux)));
ok("mergeSummary safe");

// ---------------------------------------------------------------------------
section("4) 원본 pack 불변 · 두 번 적용 중복 없음 · 한 item만");

const original = {
  schema_version: "family_prescription_v1",
  intro_line: "intro",
  items: [
    stubItem("umbilical_independence", "umb summary"),
    stubItem("nagging_karma_avoidance", "nag summary"),
    stubItem("family_baseline", "base summary"),
  ],
};
const frozen = structuredClone(original);
const once = applyGuidanceFitToneToPrescriptions(original, "aligned", "ko-KR");
assert.deepEqual(original, frozen, "input pack not mutated");
assert.notEqual(once, original);
assert.notEqual(once.items, original.items);
assert.equal(
  once.items[1].evidence.summary,
  `nag summary ${buildGuidanceFitToneAux("aligned", "ko-KR")}`,
);
assert.equal(once.items[0].evidence.summary, "umb summary");
assert.equal(once.items[2].evidence.summary, "base summary");

const twice = applyGuidanceFitToneToPrescriptions(once, "aligned", "ko-KR");
assert.equal(twice.items[1].evidence.summary, once.items[1].evidence.summary);
assert.equal(
  twice.items[1].evidence.summary.split(buildGuidanceFitToneAux("aligned", "ko-KR"))
    .length - 1,
  1,
);

const emptyPack = applyGuidanceFitToneToPrescriptions(
  { schema_version: "family_prescription_v1", intro_line: "x", items: [] },
  "aligned",
  "ko-KR",
);
assert.deepEqual(emptyPack.items, []);

const emptySum = applyGuidanceFitToneToPrescriptions(
  {
    schema_version: "family_prescription_v1",
    intro_line: "x",
    items: [stubItem("family_baseline", "")],
  },
  "partial",
  "ko-KR",
);
assert.equal(
  emptySum.items[0].evidence.summary,
  buildGuidanceFitToneAux("partial", "ko-KR"),
);

const undefSum = applyGuidanceFitToneToPrescriptions(
  {
    schema_version: "family_prescription_v1",
    intro_line: "x",
    items: [
      {
        topic: "family_baseline",
        headline: "h",
        evidence: {
          source: "pair_family_signals",
          signal_paths: [],
          summary: undefined,
          snapshot: {},
        },
        do_list: [],
        dont_list: [],
      },
    ],
  },
  "mismatch",
  "en-US",
);
assert.equal(
  undefSum.items[0].evidence.summary,
  buildGuidanceFitToneAux("mismatch", "en-US"),
);
ok("immutability + idempotent apply");

// ---------------------------------------------------------------------------
section("5) builder — fit null deep equal · nagging append · item 수");

const packNull = buildFamilyPrescriptions({
  pair: basePair,
  parentNickname: "Jordan",
  childNickname: "Alex",
  locale: "ko-KR",
});
const packAligned = buildFamilyPrescriptions({
  pair: { ...basePair, guidance_fit: "aligned" },
  parentNickname: "Jordan",
  childNickname: "Alex",
  locale: "ko-KR",
});
assert.equal(packAligned.items.length, packNull.items.length);
assert.deepEqual(
  packAligned.items.map((i) => i.topic),
  packNull.items.map((i) => i.topic),
);
const nagNull = packNull.items.find((i) => i.topic === "nagging_karma_avoidance");
const nagAligned = packAligned.items.find(
  (i) => i.topic === "nagging_karma_avoidance",
);
assert.deepEqual(nagAligned.do_list, nagNull.do_list);
assert.equal(
  nagAligned.evidence.summary,
  `${nagNull.evidence.summary} ${buildGuidanceFitToneAux("aligned", "ko-KR")}`,
);
assert.equal(
  packAligned.items.find((i) => i.topic === "umbilical_independence").evidence
    .summary,
  packNull.items.find((i) => i.topic === "umbilical_independence").evidence
    .summary,
);
assertNoForbidden(JSON.stringify(packAligned));
ok("builder tone on nagging only");

// ---------------------------------------------------------------------------
section("6) baseline-only · umbilical-only · pair null");

const lowPair = {
  umbilical_separation_index: 10,
  umbilical_band: "low",
  nagging_trigger_index: 10,
  nagging_band: "low",
  combined_karma_tension: 10,
  guidance_fit: "partial",
};
const baselinePack = buildFamilyPrescriptions({
  pair: lowPair,
  parentNickname: "Jordan",
  childNickname: "Alex",
  locale: "ko-KR",
});
assert.equal(baselinePack.items[0].topic, "family_baseline");
assert.ok(baselinePack.items[0].evidence.summary.includes("전달 팁"));

const umbilOnly = applyGuidanceFitToneToPrescriptions(
  {
    schema_version: "family_prescription_v1",
    intro_line: "x",
    items: [stubItem("umbilical_independence")],
  },
  "aligned",
  "ko-KR",
);
assert.equal(umbilOnly.items[0].evidence.summary, "base summary");

const noPair = buildFamilyPrescriptions({
  pair: null,
  parentNickname: "Jordan",
  childNickname: "Alex",
  locale: "ko-KR",
});
assert.ok(!noPair.items[0].evidence.summary.includes("전달 팁"));
ok("baseline / umbilical-only / no pair");

// ---------------------------------------------------------------------------
section("7) Part2 C mode·talent 불변 · Track B");

const reportNull = buildFamilyParentReport({
  ...baseParams,
  pairFamily: basePair,
});
const reportAligned = buildFamilyParentReport({
  ...baseParams,
  pairFamily: { ...basePair, guidance_fit: "aligned" },
});
const cNull = reportNull.family.section_compare_table.find(
  (r) => r.id === "guidance_balance",
);
const cAligned = reportAligned.family.section_compare_table.find(
  (r) => r.id === "guidance_balance",
);
assert.deepEqual(cAligned.personParent, cNull.personParent);
assert.deepEqual(cAligned.personChild, cNull.personChild);
assert.equal(cAligned.label, cNull.label);
assert.deepEqual(
  reportAligned.family.section_talent,
  reportNull.family.section_talent,
);

const trackB = buildFamilyParentReport({
  ...baseParams,
  roles: { roleA: "mother", roleB: "child" },
  nicknameA: "Jordan",
  nicknameB: "Alex",
  sajuJsonA: baseParams.sajuJsonB,
  sajuJsonB: baseParams.sajuJsonA,
  pairFamily: { ...basePair, guidance_fit: "mismatch" },
});
const nagB = trackB.meta.prescription_family.items.find(
  (i) => i.topic === "nagging_karma_avoidance",
);
assert.ok(nagB.evidence.summary.includes("채널"));
assertNoForbidden(nagB.evidence.summary);
ok("C modes + talent + Track B");

console.log("\nOK: family guidance prescription tone tests passed");

// print locale strings for final review (not assertions)
console.log("\n--- aux copy dump ---");
for (const fit of ["aligned", "partial", "mismatch"]) {
  console.log(`[${fit}] ko:`, buildGuidanceFitToneAux(fit, "ko-KR"));
  console.log(`[${fit}] en:`, buildGuidanceFitToneAux(fit, "en-US"));
}
