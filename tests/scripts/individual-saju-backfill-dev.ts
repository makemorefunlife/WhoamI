/**
 * DEV-only backfill: fill null individual_saju_json on person_core_blueprints.
 *
 * Sequence: preflight → dry-run → fingerprint → write nulls only → reload → idempotency
 *
 * Usage:
 *   npx tsx tests/scripts/individual-saju-backfill-dev.ts --dry-run
 *   npx tsx tests/scripts/individual-saju-backfill-dev.ts --write
 *
 * Rules:
 * - Never overwrite non-null individual_saju_json
 * - UPDATE individual_saju_json only (preserve saju_master_json)
 * - Stop before write on unexplained fingerprint/parity mismatch
 * - Do not log birth dates/times or PII
 */

import { createHash } from "crypto";
import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildPersonCoreBlueprint } from "@/lib/personCore/services/buildPersonCoreBlueprint";
import { verifyIndividualParity } from "@/lib/personCore/individualSaju/parity";
import { INDIVIDUAL_SAJU_CHART_VERSION } from "@/lib/personCore/individualSaju/constants";
import { computeCurrentInputFingerprint } from "@/lib/personCore/services/computeCurrentInputFingerprint";
import type { SajuMasterJson } from "@/lib/personCore/types/sajuMaster";
import type { IndividualSajuChart } from "@/lib/personCore/individualSaju/types";

dotenv.config({ path: ".env.local" });

type RowLite = {
  report_id: string;
  input_fingerprint: string;
  individual_saju_json: IndividualSajuChart | null;
  saju_master_json: SajuMasterJson | null;
};

type CandidateResult = {
  report_id_hash: string;
  report_id_prefix: string;
  action: "would_write" | "written" | "skip_already_filled" | "skip_mismatch" | "skip_error";
  fingerprint_match: boolean | null;
  parity_ok: boolean | null;
  parity_errors: number | null;
  parity_warns: number | null;
  self_parity_ok: boolean | null;
  legacy_incomplete: boolean | null;
  reason?: string;
};

const STRUCTURAL_PARITY_PREFIXES = [
  "birth.",
  "pillars.",
  "day_master.",
  "stem_focus",
  "hidden_stems",
  "ten_gods.",
  "twelve_stages.",
  "validation.",
  "bundle.",
];

function isStructuralParityPath(path: string): boolean {
  return STRUCTURAL_PARITY_PREFIXES.some(
    (p) => path === p || path.startsWith(p),
  );
}

function idHash(reportId: string): string {
  return createHash("sha256").update(reportId, "utf8").digest("hex").slice(0, 12);
}

function idPrefix(reportId: string): string {
  return reportId.slice(0, 8);
}

function assertDevOnly(url: string): void {
  const allow = process.env.ALLOW_DEV_BACKFILL === "1";
  const host = url.replace(/^https?:\/\//, "").split("/")[0] ?? "";
  // Hard stop if URL looks like a known prod marker (none configured) —
  // require explicit ALLOW_DEV_BACKFILL for any write/dry-run against live DB.
  if (!allow) {
    throw new Error(
      "Refusing to run: set ALLOW_DEV_BACKFILL=1 (DEV only). No production backfill.",
    );
  }
  if (!host.includes("supabase.co")) {
    throw new Error(`Unexpected Supabase host (refusing): ${host.slice(0, 24)}…`);
  }
  console.log(
    JSON.stringify({
      step: "env_guard",
      ok: true,
      host_prefix: host.slice(0, 8),
      allow_dev_backfill: true,
    }),
  );
}

function getSb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  assertDevOnly(url);
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAllRows(sb: SupabaseClient): Promise<RowLite[]> {
  const { data, error } = await sb
    .from("person_core_blueprints")
    .select("report_id, input_fingerprint, individual_saju_json, saju_master_json");
  if (error) throw new Error(`preflight select failed: ${error.message}`);
  return (data ?? []) as RowLite[];
}

function hasValidIndividual(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const engine = (raw as { engine?: { schema_version?: string } }).engine;
  return engine?.schema_version === INDIVIDUAL_SAJU_CHART_VERSION;
}

function isNullIndividual(raw: unknown): boolean {
  return raw == null;
}

async function evaluateCandidate(row: RowLite): Promise<{
  result: CandidateResult;
  built?: IndividualSajuChart;
  masterHashBefore?: string;
}> {
  const base = {
    report_id_hash: idHash(row.report_id),
    report_id_prefix: idPrefix(row.report_id),
  };
  const emptyExtra = {
    parity_warns: null as number | null,
    self_parity_ok: null as boolean | null,
    legacy_incomplete: null as boolean | null,
  };

  if (hasValidIndividual(row.individual_saju_json)) {
    return {
      result: {
        ...base,
        ...emptyExtra,
        action: "skip_already_filled",
        fingerprint_match: null,
        parity_ok: null,
        parity_errors: null,
        reason: "individual_saju_json already present with v1 schema",
      },
    };
  }

  // Non-null but invalid schema — never overwrite; surface as mismatch.
  if (!isNullIndividual(row.individual_saju_json)) {
    return {
      result: {
        ...base,
        ...emptyExtra,
        action: "skip_mismatch",
        fingerprint_match: null,
        parity_ok: null,
        parity_errors: null,
        reason: "non-null individual_saju_json with unexpected schema — refuse overwrite",
      },
    };
  }

  try {
    const currentFp = await computeCurrentInputFingerprint(row.report_id);
    const fingerprint_match = currentFp === row.input_fingerprint;

    const builtBp = await buildPersonCoreBlueprint(row.report_id);
    const individual = builtBp.individual_saju_json;
    if (!individual) {
      return {
        result: {
          ...base,
          ...emptyExtra,
          action: "skip_error",
          fingerprint_match,
          parity_ok: null,
          parity_errors: null,
          reason: "builder returned null individual",
        },
      };
    }

    // Built fingerprint must match stored row fingerprint (same inputs as snapshot).
    const builtFpMatch = builtBp.input_fingerprint === row.input_fingerprint;
    if (!fingerprint_match || !builtFpMatch) {
      return {
        result: {
          ...base,
          ...emptyExtra,
          action: "skip_mismatch",
          fingerprint_match: false,
          parity_ok: null,
          parity_errors: null,
          reason: !fingerprint_match
            ? "stored input_fingerprint != current inputs"
            : "built input_fingerprint != stored row fingerprint",
        },
      };
    }

    const legacy = row.saju_master_json;
    if (!legacy) {
      return {
        result: {
          ...base,
          ...emptyExtra,
          action: "skip_error",
          fingerprint_match,
          parity_ok: null,
          parity_errors: null,
          reason: "missing saju_master_json",
        },
      };
    }

    const legacy_incomplete = !legacy.strength_balance?.label;
    const parity = verifyIndividualParity({
      legacy,
      individual,
    });

    // Always verify builder self-consistency (built master ↔ built individual).
    const selfParity = verifyIndividualParity({
      legacy: builtBp.saju_master_json,
      individual,
    });

    if (!selfParity.ok) {
      return {
        result: {
          ...base,
          action: "skip_mismatch",
          fingerprint_match,
          parity_ok: parity.ok,
          parity_errors: parity.error_count,
          parity_warns: parity.warn_count,
          self_parity_ok: false,
          legacy_incomplete,
          reason: `builder self-parity failed errors=${selfParity.error_count}`,
        },
      };
    }

    const structuralErrors = parity.issues.filter(
      (i) => i.severity === "error" && isStructuralParityPath(i.path),
    );
    const softErrors = parity.issues.filter(
      (i) => i.severity === "error" && !isStructuralParityPath(i.path),
    );

    if (structuralErrors.length > 0) {
      return {
        result: {
          ...base,
          action: "skip_mismatch",
          fingerprint_match,
          parity_ok: false,
          parity_errors: parity.error_count,
          parity_warns: parity.warn_count,
          self_parity_ok: true,
          legacy_incomplete,
          reason: `structural parity errors=${structuralErrors.length} (paths: ${structuralErrors
            .map((i) => i.path)
            .slice(0, 8)
            .join(",")})`,
        },
      };
    }

    const masterHashBefore = createHash("sha256")
      .update(JSON.stringify(legacy), "utf8")
      .digest("hex")
      .slice(0, 16);

    const driftNote =
      softErrors.length > 0 || legacy_incomplete
        ? `explained legacy drift/incomplete; soft_errors=${softErrors
            .map((i) => i.path)
            .join(",") || "none"}; strength_missing=${legacy_incomplete}`
        : undefined;

    return {
      result: {
        ...base,
        action: "would_write",
        fingerprint_match: true,
        parity_ok: parity.ok,
        parity_errors: parity.error_count,
        parity_warns: parity.warn_count,
        self_parity_ok: true,
        legacy_incomplete,
        reason: driftNote,
      },
      built: individual,
      masterHashBefore,
    };
  } catch (e) {
    return {
      result: {
        ...base,
        ...emptyExtra,
        action: "skip_error",
        fingerprint_match: null,
        parity_ok: null,
        parity_errors: null,
        reason: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

async function writeIndividualOnly(
  sb: SupabaseClient,
  reportId: string,
  individual: IndividualSajuChart,
): Promise<{ ok: boolean; error?: string }> {
  // Conditional update: only if still null — never overwrite.
  const { data, error } = await sb
    .from("person_core_blueprints")
    .update({ individual_saju_json: individual })
    .eq("report_id", reportId)
    .is("individual_saju_json", null)
    .select("report_id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "no row updated (already filled or missing)" };
  }
  return { ok: true };
}

async function reloadValidate(
  sb: SupabaseClient,
  reportId: string,
  expected: IndividualSajuChart,
  masterHashBefore: string,
): Promise<{
  ok: boolean;
  schema_ok: boolean;
  day_stem_ok: boolean;
  pillars_ok: boolean;
  master_preserved: boolean;
  reason?: string;
}> {
  const { data, error } = await sb
    .from("person_core_blueprints")
    .select("individual_saju_json, saju_master_json")
    .eq("report_id", reportId)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      schema_ok: false,
      day_stem_ok: false,
      pillars_ok: false,
      master_preserved: false,
      reason: error?.message ?? "null row",
    };
  }

  const ind = data.individual_saju_json as IndividualSajuChart | null;
  const master = data.saju_master_json;
  const masterHashAfter = createHash("sha256")
    .update(JSON.stringify(master), "utf8")
    .digest("hex")
    .slice(0, 16);

  const schema_ok = ind?.engine?.schema_version === INDIVIDUAL_SAJU_CHART_VERSION;
  const day_stem_ok =
    ind?.day_master?.stem?.code === expected.day_master.stem.code;
  const pillars_ok =
    JSON.stringify(ind?.pillars?.map((p) => p.pillar_hangul)) ===
    JSON.stringify(expected.pillars.map((p) => p.pillar_hangul));
  const master_preserved = masterHashAfter === masterHashBefore;

  return {
    ok: Boolean(schema_ok && day_stem_ok && pillars_ok && master_preserved),
    schema_ok: Boolean(schema_ok),
    day_stem_ok: Boolean(day_stem_ok),
    pillars_ok: Boolean(pillars_ok),
    master_preserved,
  };
}

async function main() {
  const mode = process.argv.includes("--write") ? "write" : "dry-run";
  const sb = getSb();

  // 1) Preflight count
  const rows = await fetchAllRows(sb);
  const nullCount = rows.filter((r) => isNullIndividual(r.individual_saju_json)).length;
  const validCount = rows.filter((r) => hasValidIndividual(r.individual_saju_json)).length;
  const invalidNonNull = rows.length - nullCount - validCount;
  console.log(
    JSON.stringify(
      {
        step: "1_preflight",
        total: rows.length,
        null_individual: nullCount,
        valid_individual: validCount,
        invalid_non_null_individual: invalidNonNull,
      },
      null,
      2,
    ),
  );

  // 2–3) Dry-run + fingerprint for every row
  const evaluations: Array<{
    row: RowLite;
    eval: Awaited<ReturnType<typeof evaluateCandidate>>;
  }> = [];

  for (const row of rows) {
    const ev = await evaluateCandidate(row);
    evaluations.push({ row, eval: ev });
  }

  const candidates = evaluations.filter((e) => e.eval.result.action === "would_write");
  const skipped = evaluations.filter((e) => e.eval.result.action !== "would_write");

  console.log(
    JSON.stringify(
      {
        step: "2_dry_run",
        mode,
        would_write: candidates.length,
        skipped: skipped.length,
        results: evaluations.map((e) => e.eval.result),
      },
      null,
      2,
    ),
  );

  const mismatches = evaluations.filter(
    (e) => e.eval.result.action === "skip_mismatch",
  );
  const errors = evaluations.filter((e) => e.eval.result.action === "skip_error");

  console.log(
    JSON.stringify(
      {
        step: "3_fingerprint",
        mismatch_count: mismatches.length,
        error_count: errors.length,
        mismatches: mismatches.map((m) => m.eval.result),
        errors: errors.map((e) => e.eval.result),
      },
      null,
      2,
    ),
  );

  // Abort only on unexplained issues among null rows:
  // fingerprint fail / structural parity / builder errors.
  // Explained legacy drift (soft johu/signals) does not block.
  const blocking = [...mismatches, ...errors].filter(
    (e) => !hasValidIndividual(e.row.individual_saju_json),
  );
  if (blocking.length > 0) {
    console.log(
      JSON.stringify({
        step: "4_write",
        aborted: true,
        reason: "unexplained mismatch/error on null individual rows — stop before write",
        blocking: blocking.map((b) => b.eval.result),
      }),
    );
    process.exit(2);
  }

  if (mode === "dry-run") {
    console.log(
      JSON.stringify({
        step: "4_write",
        aborted: false,
        dry_run: true,
        write_count: 0,
        note: "Re-run with --write to persist",
      }),
    );
    process.exit(0);
  }

  // 4) Write only null records
  const writeResults: CandidateResult[] = [];
  const reloadResults: unknown[] = [];
  let writeCount = 0;

  for (const { row, eval: ev } of candidates) {
    if (!ev.built || !ev.masterHashBefore) {
      writeResults.push({
        ...ev.result,
        action: "skip_error",
        reason: "missing built payload",
      });
      continue;
    }

    const w = await writeIndividualOnly(sb, row.report_id, ev.built);
    if (!w.ok) {
      writeResults.push({
        ...ev.result,
        action: "skip_error",
        reason: w.error,
      });
      continue;
    }

    writeCount += 1;
    writeResults.push({ ...ev.result, action: "written" });

    // 5) Reload validation
    const reload = await reloadValidate(
      sb,
      row.report_id,
      ev.built,
      ev.masterHashBefore,
    );
    reloadResults.push({
      report_id_hash: idHash(row.report_id),
      report_id_prefix: idPrefix(row.report_id),
      ...reload,
    });
    if (!reload.ok) {
      console.log(
        JSON.stringify({
          step: "5_reload",
          aborted: true,
          failed: reloadResults,
        }),
      );
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      {
        step: "4_write",
        write_count: writeCount,
        results: writeResults,
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        step: "5_reload",
        ok: true,
        validated: reloadResults.length,
        results: reloadResults,
      },
      null,
      2,
    ),
  );

  // 6) Idempotency — re-evaluate; expect would_write=0
  const after = await fetchAllRows(sb);
  const nullAfter = after.filter((r) => isNullIndividual(r.individual_saju_json)).length;
  const validAfter = after.filter((r) => hasValidIndividual(r.individual_saju_json)).length;
  let wouldWriteAgain = 0;
  for (const row of after) {
    const ev = await evaluateCandidate(row);
    if (ev.result.action === "would_write") wouldWriteAgain += 1;
  }

  const idempotent = wouldWriteAgain === 0 && nullAfter === 0 && validAfter === after.length;
  console.log(
    JSON.stringify(
      {
        step: "6_idempotency",
        ok: idempotent,
        total: after.length,
        null_individual: nullAfter,
        valid_individual: validAfter,
        would_write_again: wouldWriteAgain,
      },
      null,
      2,
    ),
  );

  process.exit(idempotent ? 0 : 1);
}

main().catch((e) => {
  console.error(JSON.stringify({ fatal: true, message: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
