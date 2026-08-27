/**
 * Phase 2 — DEV persistence probe for individual_saju_json.
 *
 * Uses service-role REST (no direct Postgres). Safe fixtures only.
 *
 * Usage:
 *   npx tsx tests/scripts/person-core-persistence-probe.ts
 *   npx tsx tests/scripts/person-core-persistence-probe.ts <existing-dev-report-id>
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { buildPersonCoreBlueprint } from "@/lib/personCore/services/buildPersonCoreBlueprint";
import { loadPerson } from "@/lib/personCore/services/loadPerson";
import { upsertPersonCoreBlueprint } from "@/lib/personCore/services/upsertPersonCoreBlueprint";
import { INDIVIDUAL_SAJU_CHART_VERSION } from "@/lib/personCore/individualSaju/constants";
import { bundlePersonCoreForPremium } from "@/lib/personCore/services/bundlePersonCoreForPremium";

dotenv.config({ path: ".env.local" });

async function columnPresent(
  sb: any,
): Promise<{ present: boolean; error?: string }> {
  const { error } = await sb
    .from("person_core_blueprints")
    .select("individual_saju_json")
    .limit(1);
  if (!error) return { present: true };
  if (
    error.code === "42703" ||
    (error.message ?? "").includes("individual_saju_json")
  ) {
    return { present: false, error: error.message };
  }
  return { present: false, error: error.message };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const col = await columnPresent(sb);
  console.log(
    JSON.stringify(
      {
        step: "column_check",
        individual_saju_json_present: col.present,
        error: col.error ?? null,
        dashboard_sql:
          "supabase/migrations/20260729100000_individual_saju_json.sql",
      },
      null,
      2,
    ),
  );

  const reportId = process.argv[2]?.trim();
  if (!reportId) {
    console.log(
      JSON.stringify({
        step: "persistence",
        skipped: true,
        reason:
          "Pass a DEV report_id to build/upsert/load roundtrip. Example: npx tsx tests/scripts/person-core-persistence-probe.ts <uuid>",
      }),
    );
    process.exit(col.present ? 0 : 2);
  }

  const built = await buildPersonCoreBlueprint(reportId);
  assertIndividual(built.individual_saju_json);

  try {
    await upsertPersonCoreBlueprint(built);
  } catch (e) {
    console.log(
      JSON.stringify({
        step: "upsert",
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        note: "If column missing, apply DEV migration via Dashboard SQL Editor",
      }),
    );
    process.exit(2);
  }

  const loaded = await loadPerson(reportId);
  if (!loaded) {
    console.log(JSON.stringify({ step: "load", ok: false, error: "null" }));
    process.exit(1);
  }

  const ind = loaded.individual_saju_json;
  const bundle = bundlePersonCoreForPremium(loaded);

  const sameFingerprint =
    loaded.input_fingerprint === built.input_fingerprint;
  const sameDayStem =
    ind?.day_master.stem.code ===
    built.individual_saju_json?.day_master.stem.code;
  const samePillars =
    JSON.stringify(ind?.pillars.map((p) => p.pillar_hangul)) ===
    JSON.stringify(
      built.individual_saju_json?.pillars.map((p) => p.pillar_hangul),
    );

  const fullOk = Boolean(
    ind &&
      ind.engine.schema_version === INDIVIDUAL_SAJU_CHART_VERSION &&
      sameFingerprint &&
      sameDayStem &&
      samePillars,
  );
  const legacyOk =
    !col.present &&
    sameFingerprint &&
    Boolean(loaded.saju_master_json) &&
    bundle.sajuSource === "legacy_master";

  console.log(
    JSON.stringify(
      {
        step: "persistence_roundtrip",
        ok: fullOk,
        legacy_fallback_ok: legacyOk,
        schema_version: ind?.engine.schema_version ?? null,
        expected_schema: INDIVIDUAL_SAJU_CHART_VERSION,
        sameFingerprint,
        sameDayStem,
        samePillars,
        sajuSource: bundle.sajuSource,
        has_legacy_master: Boolean(loaded.saju_master_json),
        note: fullOk
          ? "individual dual-write + load OK"
          : legacyOk
            ? "column missing: legacy upsert/load OK; apply DEV migration for individual path"
            : "persistence check failed",
      },
      null,
      2,
    ),
  );

  if (fullOk) process.exit(0);
  if (legacyOk) process.exit(3); // soft-fail: migration still required
  process.exit(1);
}

function assertIndividual(
  ind: ReturnType<typeof buildPersonCoreBlueprint> extends Promise<infer T>
    ? T extends { individual_saju_json: infer I }
      ? I
      : never
    : never,
) {
  if (!ind) throw new Error("build did not produce individual_saju_json");
  if (ind.engine.schema_version !== INDIVIDUAL_SAJU_CHART_VERSION) {
    throw new Error(`bad schema ${ind.engine.schema_version}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
