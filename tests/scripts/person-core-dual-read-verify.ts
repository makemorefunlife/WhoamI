/**
 * Phase 2 — dual-read boundary verification (no DB required).
 *
 * Proves:
 * - Individual-first vs legacy-fallback compatible outputs
 * - Individual-first path does not import/call recalc engines
 * - missing / invalid Individual → legacy_master
 *
 * Usage: npx tsx tests/scripts/person-core-dual-read-verify.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { bundlePersonCoreForPremium } from "@/lib/personCore/services/bundlePersonCoreForPremium";
import { buildIndividualSajuChart } from "@/lib/personCore/individualSaju/buildIndividualSajuChart";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";
import { mapPsychMasterJson } from "@/lib/personCore/mappers/mapPsychMasterJson";
import {
  PERSON_CORE_BLUEPRINT_VERSION,
  USER_META_JSON_VERSION,
} from "@/lib/personCore/schemaVersion";
import type { PersonCoreBlueprint } from "@/lib/personCore/types/personCoreBlueprint";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { INDIVIDUAL_SAJU_CHART_VERSION } from "@/lib/personCore/individualSaju/constants";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function makeBlueprint(opts: {
  withIndividual: boolean;
  corruptIndividual?: boolean;
}): PersonCoreBlueprint {
  const birthDate = "1990-05-15";
  const birthTime = "14:30";
  const bundle = calculateSajuBundle({
    birthDate,
    birthTime,
    birthTimeUnknown: false,
  });
  const master = mapSajuBundleToMasterJson({
    bundle,
    birthDate,
    birthTime,
    birthTimeUnknown: false,
  });
  const individual = buildIndividualSajuChart({
    reportId: "dual-read-fixture",
    birthDate,
    birthTime,
    birthTimeUnknown: false,
    bundle,
    inputFingerprint: "fp-dual-read",
  });
  const psych = mapPsychMasterJson({
    displayName: "fixture",
    bundle,
    surveyAnswers: null,
  });

  let individual_saju_json = opts.withIndividual ? individual : null;
  if (opts.corruptIndividual && individual_saju_json) {
    individual_saju_json = {
      ...individual_saju_json,
      engine: {
        ...individual_saju_json.engine,
        schema_version: "bogus_version" as typeof INDIVIDUAL_SAJU_CHART_VERSION,
      },
    };
  }

  return {
    schema_version: PERSON_CORE_BLUEPRINT_VERSION,
    report_id: "dual-read-fixture",
    input_fingerprint: "fp-dual-read",
    built_at: new Date().toISOString(),
    user_meta: {
      schema_version: USER_META_JSON_VERSION,
      report_id: "dual-read-fixture",
      display_name: "fixture",
      clerk_user_id: null,
      report_name: "fixture",
    },
    individual_saju_json,
    saju_master_json: master,
    psych_master_json: psych,
  };
}

function compareCoreSaju(
  a: ReturnType<typeof bundlePersonCoreForPremium>["sajuJson"],
  b: ReturnType<typeof bundlePersonCoreForPremium>["sajuJson"],
) {
  assert(
    JSON.stringify(a.saju) === JSON.stringify(b.saju),
    "saju pillars mismatch",
  );
  assert(
    a.dayStemData?.kor_name === b.dayStemData?.kor_name,
    "dayStem kor_name mismatch",
  );
  assert(
    JSON.stringify((a.tenGods ?? []).map((t) => t.godCode)) ===
      JSON.stringify((b.tenGods ?? []).map((t) => t.godCode)),
    "tenGods mismatch",
  );
  assert(
    JSON.stringify((a.shinsals ?? []).map((s) => s.name_ko).sort()) ===
      JSON.stringify((b.shinsals ?? []).map((s) => s.name_ko).sort()),
    "shinsals mismatch",
  );
}

function staticNoRecalcInBundle() {
  const src = readFileSync(
    join(process.cwd(), "lib/personCore/services/bundlePersonCoreForPremium.ts"),
    "utf8",
  );
  for (const banned of [
    "calculateSajuBundle",
    "buildChartContext",
    "analyzeRelations",
    "analyzeShinsal",
  ]) {
    assert(!new RegExp(`\\b${banned}\\s*\\(`).test(src), `bundle calls ${banned}`);
    assert(
      !new RegExp(`import\\s*\\{[^}]*\\b${banned}\\b`).test(src),
      `bundle imports ${banned}`,
    );
  }
}

function main() {
  staticNoRecalcInBundle();

  const withInd = makeBlueprint({ withIndividual: true });
  // Simulate loadPerson rejecting corrupt schema → null individual
  const corruptRaw = makeBlueprint({
    withIndividual: true,
    corruptIndividual: true,
  });
  const corruptLoaded: PersonCoreBlueprint = {
    ...corruptRaw,
    individual_saju_json: null, // loadPerson.parseIndividual would null this
  };
  const legacyOnly = makeBlueprint({ withIndividual: false });

  const indBundle = bundlePersonCoreForPremium(withInd);
  const legacyBundle = bundlePersonCoreForPremium(legacyOnly);
  const corruptBundle = bundlePersonCoreForPremium(corruptLoaded);

  assert(indBundle.sajuSource === "individual", "expected individual source");
  assert(legacyBundle.sajuSource === "legacy_master", "expected legacy source");
  assert(
    corruptBundle.sajuSource === "legacy_master",
    "corrupt individual must fall back",
  );
  assert(!!indBundle.chartContext, "individual path should expose chartContext");
  assert(
    !legacyBundle.chartContext,
    "legacy path should not invent chartContext from Individual",
  );

  compareCoreSaju(indBundle.sajuJson, legacyBundle.sajuJson);
  compareCoreSaju(indBundle.sajuJson, corruptBundle.sajuJson);

  assert(
    indBundle.provenance.dayStemCode === legacyBundle.provenance.dayStemCode,
    "provenance dayStemCode mismatch",
  );
  assert(
    indBundle.provenance.pillars.day === legacyBundle.provenance.pillars.day,
    "provenance day pillar mismatch",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        individual_source: indBundle.sajuSource,
        legacy_source: legacyBundle.sajuSource,
        corrupt_fallback_source: corruptBundle.sajuSource,
        pillars: indBundle.sajuJson.saju,
        dayStem: indBundle.provenance.dayStemCode,
      },
      null,
      2,
    ),
  );
}

main();
