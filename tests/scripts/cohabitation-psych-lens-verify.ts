/**
 * 동거 psychDomainLens 통합 검증
 * 실행: npx tsx tests/scripts/cohabitation-psych-lens-verify.ts
 */
import { PSYCH_MASTER_JSON_VERSION } from "@/lib/personCore/schemaVersion";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { buildCohabitationPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildCohabitationPsychMatch";
import {
  domainLensToHomePsychLens,
  homePsychLensToDomain,
} from "@/lib/relationship/marriage/buildMarriagePsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import { SECONDARY_AXIS_KEYS } from "@/lib/v2/survey/types";

function samplePsych(seed: number): PsychMasterJson {
  const secondary_axes = Object.fromEntries(
    SECONDARY_AXIS_KEYS.map((k, i) => [k, 35 + ((seed + i * 7) % 50)]),
  ) as PsychMasterJson["secondary_axes"];
  return {
    schema_version: PSYCH_MASTER_JSON_VERSION,
    secondary_axes,
    survey_source: "v2_10q",
    survey_completed_at: "2026-07-13T00:00:00.000Z",
    survey_input_fingerprint: `fp-${seed}`,
    home_life_dna: {
      lifestyle_title: "테스트 홈",
      family_identity_category: "balanced",
      family_identity_line: "테스트",
      life_values_line: "테스트",
      private_home_self_line: "테스트",
      energy_battery_line: "테스트",
    },
  };
}

const psychA = samplePsych(1);
const psychB = samplePsych(2);
const bundle = buildCohabitationPsychMatchBundle(psychA, psychB);
if (!bundle) throw new Error("bundle null");
if (bundle.psych_match.axis_results.length !== 11) {
  throw new Error(`expected 11 axes, got ${bundle.psych_match.axis_results.length}`);
}
if (!bundle.psych_lens.lens_title.includes("동거")) {
  throw new Error("missing cohabitation lens title");
}
if (bundle.psych_lens.highlights.length < 1 || bundle.psych_lens.highlights.length > 3) {
  throw new Error(`expected 1-3 highlights, got ${bundle.psych_lens.highlights.length}`);
}
console.log("OK buildCohabitationPsychMatchBundle");

const legacy = domainLensToHomePsychLens(bundle.psych_lens);
const roundTrip = homePsychLensToDomain(legacy);
if (roundTrip.highlights[0]?.topic !== legacy.highlights[0]?.home_topic) {
  throw new Error("home_topic round-trip failed");
}
console.log("OK legacy home_psych_lens adapter");

const fromMeta = resolveReportPsychDisplay(
  {
    psych_match: bundle.psych_match,
    home_psych_lens: legacy,
  },
  buildCohabitationPsychMatchBundle,
);
if (!fromMeta?.psych_lens.chart_note) {
  throw new Error("resolveReportPsychDisplay legacy meta failed");
}
console.log("OK resolveReportPsychDisplay home_psych_lens fallback");

const fromPersonCore = resolveReportPsychDisplay(
  {
    person_core: {
      report_id_a: "a",
      report_id_b: "b",
      input_fingerprint_a: "fa",
      input_fingerprint_b: "fb",
      psych_a: psychA,
      psych_b: psychB,
    },
  },
  buildCohabitationPsychMatchBundle,
);
if (!fromPersonCore?.psych_match.axis_results.length) {
  throw new Error("resolveReportPsychDisplay person_core failed");
}
console.log("OK resolveReportPsychDisplay person_core");

console.log("All cohabitation psych lens checks passed.");
