import { buildPersonCoreBlueprint } from "@/lib/personCore/services/buildPersonCoreBlueprint";
import { loadPerson } from "@/lib/personCore/services/loadPerson";
import { upsertPersonCoreBlueprint } from "@/lib/personCore/services/upsertPersonCoreBlueprint";

const reportId = process.argv[2]?.trim() ?? "68849c40-a867-485d-b44b-8259b95c6b1d";

async function main() {
  const bp = await buildPersonCoreBlueprint(reportId);
  console.log(
    "build OK",
    bp.report_id,
    bp.saju_master_json.stem_focus.day_stem_code,
    bp.psych_master_json.home_life_dna.lifestyle_title,
    bp.input_fingerprint.slice(0, 16),
  );

  try {
    await upsertPersonCoreBlueprint(bp);
    console.log("upsert OK");
    const loaded = await loadPerson(reportId);
    console.log(
      "load",
      loaded ? loaded.input_fingerprint === bp.input_fingerprint : "null",
    );
  } catch (e) {
    console.log(
      "upsert/load skipped (migration 미적용 가능):",
      e instanceof Error ? e.message : e,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
