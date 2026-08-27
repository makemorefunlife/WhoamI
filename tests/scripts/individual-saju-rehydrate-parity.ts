/**
 * Batch 4 — rehydration parity:
 * IndividualSajuChart → legacy views vs current legacy pipeline output.
 *
 * Usage: npx tsx tests/scripts/individual-saju-rehydrate-parity.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import {
  legacySajuInputsFromIndividual,
  rehydrateChartContextFromIndividual,
  rehydrateSajuDataFromIndividual,
  rehydrateSajuMasterFromIndividual,
} from "@/lib/personCore/adapters/rehydrateFromIndividual";
import { rehydrateSajuDataForIntegrated } from "@/lib/personCore/adapters/rehydrateSajuFromPersonCore";
import { buildIndividualSajuChart } from "@/lib/personCore/individualSaju/buildIndividualSajuChart";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";
import { buildChartContext } from "@/lib/saju/chartContext";
import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";

const FIXTURES = [
  { birthDate: "1990-05-15", birthTime: "14:30" as string | null, label: "known_time" },
  { birthDate: "1988-01-01", birthTime: null, label: "unknown_time" },
  { birthDate: "2000-12-31", birthTime: "00:15", label: "midnight" },
  { birthDate: "1975-08-20", birthTime: "12:00", label: "noon" },
  { birthDate: "1995-03-08", birthTime: "23:45", label: "late" },
];

type Issue = { path: string; message: string; a?: unknown; b?: unknown };

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function compareSajuJson(
  fromIndividual: ReturnType<typeof rehydrateSajuDataFromIndividual>,
  fromLegacyMaster: ReturnType<typeof rehydrateSajuDataForIntegrated>,
): Issue[] {
  const issues: Issue[] = [];
  const check = (path: string, a: unknown, b: unknown) => {
    if (!eq(a, b)) issues.push({ path, message: "mismatch", a, b });
  };

  check("saju", fromIndividual.saju, fromLegacyMaster.saju);
  check(
    "dayStemData.kor_name",
    fromIndividual.dayStemData?.kor_name,
    fromLegacyMaster.dayStemData?.kor_name,
  );
  check(
    "dayStemData.metaphor_ko",
    fromIndividual.dayStemData?.metaphor_ko,
    fromLegacyMaster.dayStemData?.metaphor_ko,
  );
  check(
    "hiddenStemsData.stem_codes",
    (fromIndividual.hiddenStemsData ?? []).map((h) => h.stem_code),
    (fromLegacyMaster.hiddenStemsData ?? []).map((h) => h.stem_code),
  );
  check(
    "tenGods",
    (fromIndividual.tenGods ?? []).map((t) => ({
      pillar: t.pillar,
      godCode: t.godCode,
      kor: t.godData?.kor_name,
    })),
    (fromLegacyMaster.tenGods ?? []).map((t) => ({
      pillar: t.pillar,
      godCode: t.godCode,
      kor: t.godData?.kor_name,
    })),
  );
  check(
    "twelveStageData.kor_name",
    fromIndividual.twelveStageData?.kor_name,
    fromLegacyMaster.twelveStageData?.kor_name,
  );
  check(
    "relations.types",
    (fromIndividual.relations ?? []).map((r) => r.type).sort(),
    (fromLegacyMaster.relations ?? []).map((r) => r.type).sort(),
  );
  check(
    "relations.interpretations",
    (fromIndividual.relations ?? [])
      .map((r) => `${r.type}|${r.interpretation}`)
      .sort(),
    (fromLegacyMaster.relations ?? [])
      .map((r) => `${r.type}|${r.interpretation}`)
      .sort(),
  );
  check(
    "shinsals.names",
    (fromIndividual.shinsals ?? []).map((s) => s.name_ko).sort(),
    (fromLegacyMaster.shinsals ?? []).map((s) => s.name_ko).sort(),
  );
  return issues;
}

function compareChartContext(
  fromIndividual: ReturnType<typeof rehydrateChartContextFromIndividual>,
  fromBuild: ReturnType<typeof buildChartContext>,
): Issue[] {
  const issues: Issue[] = [];
  const check = (path: string, a: unknown, b: unknown) => {
    if (!eq(a, b)) issues.push({ path, message: "mismatch", a, b });
  };
  check(
    "pillars",
    fromIndividual.pillars.map((p) => ({
      name: p.name,
      pillar: p.pillar,
      stemCode: p.stemCode,
      branchCode: p.branchCode,
    })),
    fromBuild.pillars.map((p) => ({
      name: p.name,
      pillar: p.pillar,
      stemCode: p.stemCode,
      branchCode: p.branchCode,
    })),
  );
  check("dayStemCode", fromIndividual.dayStemCode, fromBuild.dayStemCode);
  check("dayBranchCode", fromIndividual.dayBranchCode, fromBuild.dayBranchCode);
  check(
    "monthBranchCode",
    fromIndividual.monthBranchCode,
    fromBuild.monthBranchCode,
  );
  check("dayPillar", fromIndividual.dayPillar, fromBuild.dayPillar);
  return issues;
}

function compareMasterCore(
  fromIndividual: ReturnType<typeof rehydrateSajuMasterFromIndividual>,
  legacy: ReturnType<typeof mapSajuBundleToMasterJson>,
): Issue[] {
  const issues: Issue[] = [];
  const check = (path: string, a: unknown, b: unknown) => {
    if (!eq(a, b)) issues.push({ path, message: "mismatch", a, b });
  };
  check("pillars", fromIndividual.pillars, legacy.pillars);
  check("stem_focus", fromIndividual.stem_focus, legacy.stem_focus);
  check("johu_climate", fromIndividual.johu_climate, legacy.johu_climate);
  check(
    "strength_balance.label",
    fromIndividual.strength_balance.label,
    legacy.strength_balance.label,
  );
  check(
    "ten_gods",
    fromIndividual.ten_gods.map((t) => ({
      slot: t.pillar_slot,
      code: t.god_code,
    })),
    legacy.ten_gods.map((t) => ({ slot: t.pillar_slot, code: t.god_code })),
  );
  check(
    "twelve_stages.codes",
    fromIndividual.twelve_stages.map((t) => ({
      slot: t.pillar_slot,
      code: t.stage_code,
    })),
    legacy.twelve_stages.map((t) => ({
      slot: t.pillar_slot,
      code: t.stage_code,
    })),
  );
  check(
    "hidden_stems.codes",
    fromIndividual.hidden_stems.map((h) => h.stem_code),
    legacy.hidden_stems.map((h) => h.stem_code),
  );
  check(
    "shinsal_hits.names",
    fromIndividual.shinsal_hits.map((s) => s.name_ko).sort(),
    legacy.shinsal_hits.map((s) => s.name_ko).sort(),
  );
  check(
    "special_signals",
    fromIndividual.special_signals.map((s) => ({
      key: s.key,
      possessed: s.possessed,
    })),
    legacy.special_signals.map((s) => ({
      key: s.key,
      possessed: s.possessed,
    })),
  );
  check(
    "relation_dynamics.types",
    fromIndividual.relation_dynamics.map((r) => r.type).sort(),
    legacy.relation_dynamics.map((r) => r.type).sort(),
  );
  // domain_signals must NOT appear on individual-only rehydrate
  if ("domain_signals" in fromIndividual && fromIndividual.domain_signals) {
    issues.push({
      path: "domain_signals",
      message: "unexpected domain_signals on individual rehydrate",
    });
  }
  return issues;
}

/** Static guard: adapter source must not import recalculation entry points. */
function assertNoRecalcImports(): Issue[] {
  const path = join(
    process.cwd(),
    "lib/personCore/adapters/rehydrateFromIndividual.ts",
  );
  const src = readFileSync(path, "utf8");
  const banned = [
    "calculateSajuBundle",
    "buildChartContext",
    "analyzeRelations",
    "analyzeShinsal",
    "estimateStrengthBalance",
    "estimateYongsinGisin",
    "extractDomainSajuSignals",
  ];
  const issues: Issue[] = [];
  for (const b of banned) {
    // allow mentions in comments only — ban import usage
    const importHit = new RegExp(
      `from ["'][^"']*["'][^;]*${b}|import\\s*\\{[^}]*\\b${b}\\b`,
    ).test(src);
    const callHit = new RegExp(`\\b${b}\\s*\\(`).test(src);
    if (importHit || callHit) {
      issues.push({
        path: "rehydrateFromIndividual.ts",
        message: `forbidden recalculation symbol: ${b}`,
      });
    }
  }
  return issues;
}

function main() {
  const staticIssues = assertNoRecalcImports();
  let failed = 0;
  const summaries: unknown[] = [];

  for (const c of FIXTURES) {
    const birthTimeUnknown = !c.birthTime?.trim();
    const bundle = calculateSajuBundle({
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      birthTimeUnknown,
    });
    const legacyMaster = mapSajuBundleToMasterJson({
      bundle,
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      birthTimeUnknown,
    });
    const individual = buildIndividualSajuChart({
      reportId: `rehydrate-${c.label}`,
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      birthTimeUnknown,
      bundle,
    });

    const fromInd = legacySajuInputsFromIndividual(individual);
    const fromLegacySajuJson = rehydrateSajuDataForIntegrated(legacyMaster);
    const fromBuildCtx = buildChartContext({
      yearPillar: bundle.saju.yearPillar,
      monthPillar: bundle.saju.monthPillar,
      dayPillar: bundle.saju.dayPillar,
      hourPillar: bundle.saju.hourPillar,
    });
    const masterRehydrated = rehydrateSajuMasterFromIndividual(individual);

    const issues = [
      ...compareSajuJson(fromInd.sajuJson, fromLegacySajuJson),
      ...compareChartContext(fromInd.chartContext, fromBuildCtx),
      ...compareMasterCore(masterRehydrated, legacyMaster),
    ];

    if (issues.length) failed += 1;
    summaries.push({
      label: c.label,
      ok: issues.length === 0,
      issue_count: issues.length,
      issues,
    });
    console.log(
      `[${c.label}] ok=${issues.length === 0} issues=${issues.length}`,
    );
    for (const i of issues.slice(0, 12)) {
      console.log(`  ${i.path}: ${i.message}`);
    }
  }

  console.log("\n=== STATIC GUARD ===");
  if (staticIssues.length) {
    failed += 1;
    console.log(staticIssues);
  } else {
    console.log("no forbidden recalculation imports/calls");
  }

  console.log("\n=== REHYDRATE PARITY SUMMARY ===");
  console.log(JSON.stringify({ failed, cases: summaries }, null, 2));
  if (failed > 0) process.exitCode = 1;
}

main();
