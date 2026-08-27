/**
 * Batch 3 — Individual Saju SSOT parity vs legacy SajuMasterJson.
 *
 * Usage:
 *   npx tsx tests/scripts/individual-saju-parity.ts
 *   npx tsx tests/scripts/individual-saju-parity.ts 1990-05-15 14:30
 */

import { calculateSajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import { buildIndividualSajuChart } from "@/lib/personCore/individualSaju/buildIndividualSajuChart";
import { verifyIndividualParity } from "@/lib/personCore/individualSaju/parity";
import { mapSajuBundleToMasterJson } from "@/lib/personCore/mappers/mapSajuMasterJson";

const FIXTURES: Array<{ birthDate: string; birthTime: string | null; label: string }> = [
  { birthDate: "1990-05-15", birthTime: "14:30", label: "known_time" },
  { birthDate: "1988-01-01", birthTime: null, label: "unknown_time" },
  { birthDate: "2000-12-31", birthTime: "00:15", label: "midnight" },
  { birthDate: "1975-08-20", birthTime: "12:00", label: "noon" },
  { birthDate: "1995-03-08", birthTime: "23:45", label: "late" },
];

function runOne(birthDate: string, birthTime: string | null, label: string) {
  const birthTimeUnknown = !birthTime?.trim();
  const bundle = calculateSajuBundle({
    birthDate,
    birthTime,
    birthTimeUnknown,
  });
  const legacy = mapSajuBundleToMasterJson({
    bundle,
    birthDate,
    birthTime,
    birthTimeUnknown,
  });
  const individual = buildIndividualSajuChart({
    reportId: `parity-${label}`,
    birthDate,
    birthTime,
    birthTimeUnknown,
    bundle,
  });
  const report = verifyIndividualParity({ legacy, individual, bundle });
  return { label, birthDate, birthTime, report, individual, legacy };
}

function main() {
  const argDate = process.argv[2];
  const argTime = process.argv[3];
  const cases =
    argDate != null
      ? [
          {
            birthDate: argDate,
            birthTime: argTime === "null" || argTime == null ? null : argTime,
            label: "cli",
          },
        ]
      : FIXTURES;

  let failed = 0;
  const summaries: unknown[] = [];

  for (const c of cases) {
    const result = runOne(c.birthDate, c.birthTime, c.label);
    const { report } = result;
    summaries.push({
      label: c.label,
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      ok: report.ok,
      error_count: report.error_count,
      warn_count: report.warn_count,
      issues: report.issues,
      individual_extras: {
        gongmang: result.individual.gongmang.void_branch_codes,
        hidden_all_pillars: result.individual.pillars.map((p) => ({
          slot: p.slot,
          hidden_count: p.hidden_stems.length,
        })),
        branch_ten_gods: result.individual.pillars.map((p) => ({
          slot: p.slot,
          code: p.branch_ten_god.code,
        })),
        luck_cycles_computed: result.individual.luck_cycles.computed,
      },
    });
    if (!report.ok) failed += 1;
    console.log(
      `[${c.label}] ${c.birthDate} ${c.birthTime ?? "null"} → ok=${report.ok} errors=${report.error_count} warns=${report.warn_count}`,
    );
    for (const issue of report.issues.filter((i) => i.severity === "error")) {
      console.log(`  ERROR ${issue.path}: ${issue.message}`);
    }
  }

  console.log("\n=== PARITY SUMMARY JSON ===");
  console.log(JSON.stringify({ failed, cases: summaries }, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
