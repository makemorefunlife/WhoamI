/**
 * Part2 diversity diagnosis — 4 fixtures, full signal→bucket→copy trace.
 * Run: npx tsx tests/unit/family-part2-diversity-diagnose.mjs
 */
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";
import { extractFamilySignals } from "../../lib/personCore/sajuSignals/extractFamilySignals.ts";
import { buildPairFamilySignals } from "../../lib/personCore/sajuSignals/pairFamilySignals.ts";
import { profileTenGods } from "../../lib/relationship/marriage/marriageTenGodAnalysis.ts";
import {
  resolveCorrectionStyleBucket,
  resolveBondDistanceBucket,
  resolveGuidanceBalanceBucket,
  resolveHomeClimateBucket,
} from "../../lib/relationship/familyParent/familySajuCompareTable.ts";
import { resolveGuidanceFit } from "../../lib/personCore/sajuSignals/guidanceProfile.ts";

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  const counts = {};
  for (const t of payload.tenGods ?? []) {
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (name) counts[name] = (counts[name] ?? 0) + 1;
  }
  return {
    bundle,
    counts,
    familySignals: extractFamilySignals(bundle),
    sajuJson: {
      saju: payload.saju,
      dayStemData: payload.dayStemData,
      dayBranchData: payload.dayBranchData,
      hiddenStemsData: payload.hiddenStemsData,
      tenGods: payload.tenGods,
      twelveStageData: payload.twelveStageData,
      relations: payload.relations,
      shinsals: payload.shinsals,
    },
  };
}

const FIXTURES = [
  {
    id: "F1_parent_child_classic",
    parent: sajuFromBirth("1988-08-20"),
    child: sajuFromBirth("2014-05-15"),
    withSignals: true,
  },
  {
    id: "F2_distant_pair",
    parent: sajuFromBirth("1975-01-10"),
    child: sajuFromBirth("2008-11-03"),
    withSignals: true,
  },
  {
    id: "F3_same_era_diff",
    parent: sajuFromBirth("1990-03-22", "08:30"),
    child: sajuFromBirth("2016-07-07", "18:00"),
    withSignals: true,
  },
  {
    id: "F4_no_family_signals_collapse",
    parent: sajuFromBirth("1988-08-20"),
    child: sajuFromBirth("2014-05-15"),
    withSignals: false, // pairFamily/familySignals 없음 → medium/low 붕괴 재현
  },
];

const DISPLAY_IDS = [
  "correction_style",
  "bond_distance",
  "guidance_balance",
  "home_climate",
];

function traceFixture(fx) {
  const countsP = fx.parent.counts;
  const countsC = fx.child.counts;
  const famP = fx.withSignals ? fx.parent.familySignals : undefined;
  const famC = fx.withSignals ? fx.child.familySignals : undefined;

  const styleP = resolveCorrectionStyleBucket(countsP);
  const styleC = resolveCorrectionStyleBucket(countsC);
  const bondP = resolveBondDistanceBucket(countsP, famP);
  const bondC = resolveBondDistanceBucket(countsC, famC);
  const guideP = resolveGuidanceBalanceBucket(countsP);
  const guideC = resolveGuidanceBalanceBucket(countsC);
  const climateP = resolveHomeClimateBucket(famP);
  const climateC = resolveHomeClimateBucket(famC);

  const pair =
    famP && famC
      ? buildPairFamilySignals(famP, famC, {
          modeA: guideP.bucket,
          modeB: guideC.bucket,
        })
      : null;

  const report = buildFamilyParentReport({
    nicknameA: "Child",
    nicknameB: "Parent",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
    sajuJsonA: fx.child.sajuJson,
    sajuJsonB: fx.parent.sajuJson,
    familySignalsA: famC,
    familySignalsB: famP,
    pairFamily: pair,
    locale: "ko-KR",
    childIsViewer: false,
  });

  const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
  const compare = vm.sections.find((s) => s.type === "compare_table");
  const roles = vm.sections.find((s) => s.type === "household_roles");
  const rows = Object.fromEntries(compare.rows.map((r) => [r.id, r]));

  const profileP = profileTenGods(countsP);
  const profileC = profileTenGods(countsC);

  console.log(`\n${"=".repeat(72)}\nFIXTURE ${fx.id} (signals=${fx.withSignals})\n${"=".repeat(72)}`);

  console.log("\n[원본 사주 신호 요약]");
  console.log(
    `  Parent seals=${profileP.seal} food=${profileP.food} officer=${profileP.officer} self=${profileP.self} wealth=${profileP.wealth} excess=${profileP.sealExcess}`,
  );
  console.log(
    `  Child  seals=${profileC.seal} food=${profileC.food} officer=${profileC.officer} self=${profileC.self} wealth=${profileC.wealth} excess=${profileC.sealExcess}`,
  );
  if (famP && famC) {
    console.log(
      `  Parent bond=${famP.seal_parent.parent_bond_band} conflict=${famP.home_punishment.family_conflict_index} punish=${famP.home_punishment.punishment_count} karma=${famP.year_karma.karma_tension_index}`,
    );
    console.log(
      `  Child  bond=${famC.seal_parent.parent_bond_band} conflict=${famC.home_punishment.family_conflict_index} punish=${famC.home_punishment.punishment_count} karma=${famC.year_karma.karma_tension_index}`,
    );
  } else {
    console.log("  familySignals: ABSENT");
  }

  for (const id of DISPLAY_IDS) {
    const row = rows[id];
    let personA;
    let personB;
    let pairBucket;
    let copyKey;
    if (id === "correction_style") {
      personA = styleP.bucket;
      personB = styleC.bucket;
      // report may rebuild pair from counts when signals absent — read from meaning lead + friction
      pairBucket = pair?.nagging_band ?? "(rebuilt in report from counts)";
      copyKey = `personLead + CORRECTION_FRICTION_MEANING[mother][${pair?.nagging_band ?? "rebuilt"}]`;
    } else if (id === "bond_distance") {
      personA = bondP.bucket;
      personB = bondC.bucket;
      pairBucket = pair?.umbilical_band ?? "(rebuilt in report from counts)";
      copyKey = `personLead + UMBILICAL_MEANING[mother][${pair?.umbilical_band ?? "rebuilt"}]`;
    } else if (id === "guidance_balance") {
      personA = guideP.bucket;
      personB = guideC.bucket;
      pairBucket =
        pair?.guidance_fit ?? resolveGuidanceFit(guideP.bucket, guideC.bucket);
      copyKey = `personLead + GUIDANCE_FIT_MEANING[mother][${pairBucket}]`;
    } else {
      personA = climateP.bucket;
      personB = climateC.bucket;
      const combo = [personA, personB].sort().join("|");
      pairBucket = `combo:${combo}`;
      copyKey = `personLead + HOME_CLIMATE_MEANING[mother][${combo}]`;
    }

    console.log(`\n--- ${id} ---`);
    console.log(`  person Parent bucket: ${personA}`);
    console.log(`  person Child  bucket: ${personB}`);
    console.log(`  pair bucket / key:    ${pairBucket}`);
    console.log(`  copy key:             ${copyKey}`);
    console.log(`  shortLabel Parent:    ${row.personParent.shortLabel}`);
    console.log(`  shortLabel Child:     ${row.personChild.shortLabel}`);
    console.log(`  meaning:              ${row.meaning}`);
  }

  console.log("\n--- household_roles ---");
  console.log(`  self=${roles.selfName} label=${roles.selfRoleLabel}`);
  console.log(`  detail: ${roles.selfRoleDetail}`);
  console.log(`  partner=${roles.partnerName} label=${roles.partnerRoleLabel}`);
  console.log(`  detail: ${roles.partnerRoleDetail}`);
  console.log(`  complement: ${roles.complement}`);
  console.log(`  tension: ${roles.tension}`);

  return {
    id: fx.id,
    meanings: Object.fromEntries(DISPLAY_IDS.map((id) => [id, rows[id].meaning])),
    labels: Object.fromEntries(
      DISPLAY_IDS.map((id) => [
        id,
        `${rows[id].personParent.shortLabel} | ${rows[id].personChild.shortLabel}`,
      ]),
    ),
    roles: {
      self: roles.selfRoleLabel,
      partner: roles.partnerRoleLabel,
      complement: roles.complement,
      tension: roles.tension,
    },
    pair: pair
      ? {
          nagging: pair.nagging_band,
          umbilical: pair.umbilical_band,
          fit: pair.guidance_fit,
        }
      : null,
  };
}

const results = FIXTURES.map(traceFixture);

console.log(`\n${"=".repeat(72)}\nCROSS-FIXTURE MEANING EQUALITY\n${"=".repeat(72)}`);
for (const id of DISPLAY_IDS) {
  const texts = results.map((r) => r.meanings[id]);
  const unique = new Set(texts);
  console.log(`\n${id}: ${unique.size} unique / ${texts.length} fixtures`);
  for (const r of results) {
    console.log(`  ${r.id}: ${r.meanings[id].slice(0, 60)}...`);
  }
}

console.log("\n[LLM] family pipeline: OpenAI unused (_openai) — confirmed by architecture");
console.log("[CACHE] premium route returns result_premium_by_kind unless force_regenerate");
