/**
 * Round 2 QA — cohabitation premium + marriedSajuDeep overlay.
 *
 * Run:
 *   npx tsx tests/manual/gen-married-r2-qa.mjs
 *
 * Env:
 *   R2_RR_ID, R2_VIEWER_ID, R2_TAG, R2_OUT
 *   RELATIONSHIP_MARRIED_NARRATIVE=1 (default)
 */
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const dotenv = require("dotenv");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const OpenAI = require("openai").default;
const { createClient } = require("@supabase/supabase-js");

const RR_ID = process.env.R2_RR_ID || "";
const VIEWER_ID =
  process.env.R2_VIEWER_ID || "51e60cca-8596-4634-87e7-ca3b6468b14c";
const LOCALE = "ko-KR";
const OUT =
  process.env.R2_OUT ||
  path.join(process.env.TEMP || "/tmp", "married-r2-qa.json");
const TAG = process.env.R2_TAG || "married-qa";

async function load(mod) {
  return import(pathToFileURL(path.join(ROOT, mod)).href);
}

function chartBirthTime(birth_time) {
  if (typeof birth_time === "string" && birth_time.trim()) return birth_time.trim();
  return "12:00";
}

function chartBirthPlace(place) {
  return typeof place === "string" && place.trim() ? place.trim() : "서울";
}

async function pickRrId(sb) {
  if (RR_ID) return RR_ID;
  const { data: rrs } = await sb
    .from("relationship_reports")
    .select("id, report_id_a, report_id_b, relationship_kind")
    .or(`report_id_a.eq.${VIEWER_ID},report_id_b.eq.${VIEWER_ID}`)
    .limit(20);
  if (rrs?.length) {
    const prefer =
      rrs.find((r) => r.relationship_kind === "cohabitation") || rrs[0];
    return prefer.id;
  }
  throw new Error("No relationship_reports found; set R2_RR_ID");
}

async function main() {
  const log = [];
  const push = (m) => {
    console.log(m);
    log.push(m);
  };
  push(`START married r2 QA tag=${TAG}`);

  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Supabase env missing");
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const rrId = await pickRrId(sb);
  push(`RR=${rrId}`);

  const { data: rr, error: rrErr } = await sb
    .from("relationship_reports")
    .select("id, report_id_a, report_id_b, analysis_type, relationship_kind")
    .eq("id", rrId)
    .maybeSingle();
  if (rrErr || !rr) throw new Error("RR not found: " + (rrErr && rrErr.message));

  const { data: repA } = await sb
    .from("reports")
    .select("id,name,birth_date,birth_time,birth_place")
    .eq("id", rr.report_id_a)
    .maybeSingle();
  const { data: repB } = await sb
    .from("reports")
    .select("id,name,birth_date,birth_time,birth_place")
    .eq("id", rr.report_id_b)
    .maybeSingle();
  if (!repA || !repB) throw new Error("reports missing");
  if (
    repA.birth_date === repB.birth_date &&
    repA.birth_time === repB.birth_time
  ) {
    throw new Error("identical birth inputs — abort");
  }

  const {
    getOrBuildPersonCorePair,
    bundlePersonCorePairForPremium,
    personCoreRelationParamsFromBundles,
  } = await load("lib/personCore/index.ts");
  const { runCohabitationDeepAnalysis } = await load(
    "lib/prompts/relationshipPremium/cohabitation/index.ts",
  );
  const { mergeRelationshipPremiumByKind } = await load(
    "lib/relationship/relationshipReportQuery.ts",
  );
  const { resolveViewerDisplayName } = await load(
    "lib/relationship/viewerFirstDisplay.ts",
  );
  const { stripMarriageContextOutputForClient } = await load(
    "lib/relationship/marriage/stripMarriageContextOutputForClient.ts",
  );
  const { adviceHasLeadingEvidenceBridge } = await load(
    "lib/prompts/relationshipPremium/marriedSajuDeep/index.ts",
  );

  const pair = await getOrBuildPersonCorePair(rr.report_id_a, rr.report_id_b, {
    force: true,
  });
  const bundles = bundlePersonCorePairForPremium(pair);
  const relationParams = personCoreRelationParamsFromBundles(bundles);

  const labelA = resolveViewerDisplayName({
    reportName: repA.name,
    fallback: "나",
  });
  const labelB = resolveViewerDisplayName({
    reportName: repB.name,
    fallback: "상대",
  });
  push(`labels A=${labelA} B=${labelB}`);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const t0 = Date.now();
  const payload = await runCohabitationDeepAnalysis(openai, {
    nicknameA: labelA,
    nicknameB: labelB,
    userCustomMyName: labelA,
    userCustomTargetName: labelB,
    birthA: {
      date: repA.birth_date,
      time: chartBirthTime(repA.birth_time),
      place: chartBirthPlace(repA.birth_place),
    },
    birthB: {
      date: repB.birth_date,
      time: chartBirthTime(repB.birth_time),
      place: chartBirthPlace(repB.birth_place),
    },
    sajuJsonA: bundles.a.sajuJson,
    sajuJsonB: bundles.b.sajuJson,
    sajuProvenanceA: bundles.a.provenance,
    sajuProvenanceB: bundles.b.provenance,
    psychMasterA: relationParams.psychMasterA,
    psychMasterB: relationParams.psychMasterB,
    personCoreMeta: relationParams.personCoreMeta,
    sajuMasterA: bundles.a.blueprint.saju_master_json,
    sajuMasterB: bundles.b.blueprint.saju_master_json,
    locale: LOCALE,
  });
  const elapsed = Date.now() - t0;
  push(`DONE elapsed_ms=${elapsed}`);

  const overlay = payload.report?.meta?.married_saju_deep || null;
  push(`has_overlay=${!!overlay}`);
  push(`has_projections=${!!payload.report?.canonical_projections}`);
  push(`guards=${JSON.stringify(overlay?.meta?.narrative_guards || [])}`);

  const withLocale = {
    ...payload,
    report: {
      ...payload.report,
      meta: {
        ...(payload.report?.meta ?? {}),
        locale: LOCALE,
        language: "ko",
      },
    },
  };

  const { error: upErr } = await mergeRelationshipPremiumByKind(
    sb,
    rrId,
    "cohabitation",
    withLocale,
    { relationshipKind: "cohabitation", locale: LOCALE },
  );
  if (upErr) throw new Error("persist failed: " + (upErr.message || upErr));
  push("PERSIST_OK kind=cohabitation");

  const clientSafe = stripMarriageContextOutputForClient(withLocale);
  const tips = [
    ...(overlay?.section_5_action?.advice_for_a || []),
    ...(overlay?.section_5_action?.advice_for_b || []),
  ];
  const adviceQa = tips.map((t, i) => ({
    i: i + 1,
    title: t.action_title,
    bridgeOk: adviceHasLeadingEvidenceBridge(t.saju_reason || ""),
    head: (t.saju_reason || "").split(/(?<=[.。])\s+/)[0]?.slice(0, 80),
  }));

  const text = JSON.stringify(overlay || {});
  const qa = {
    tag: TAG,
    relationship_report_id: rrId,
    participants: {
      a: { id: rr.report_id_a, name: labelA, birth_date: repA.birth_date },
      b: { id: rr.report_id_b, name: labelB, birth_date: repB.birth_date },
    },
    elapsed_ms: elapsed,
    generated_at: new Date().toISOString(),
    has_overlay: !!overlay,
    projections: {
      cfo: payload.report?.canonical_projections?.operating_cfo ?? null,
      compare_keys: Object.keys(
        payload.report?.canonical_projections?.comparison_table || {},
      ),
    },
    blocking: {
      nanim: (text.match(/나님/g) || []).length,
      jeonim: (text.match(/저님/g) || []).length,
    },
    adviceAllOk: adviceQa.length > 0 && adviceQa.every((a) => a.bridgeOk),
    adviceQa,
    guards: overlay?.meta?.narrative_guards || null,
  };

  const out = {
    ok: true,
    round: 2,
    tag: TAG,
    qa,
    log,
    client_report_meta_keys: Object.keys(clientSafe.report?.meta || {}),
    overlay,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  push(`WROTE ${OUT}`);
  console.log(
    JSON.stringify(
      {
        rr: rrId,
        has_overlay: qa.has_overlay,
        adviceAllOk: qa.adviceAllOk,
        advice: `${adviceQa.filter((a) => a.bridgeOk).length}/${adviceQa.length}`,
        nanim: qa.blocking.nanim,
        guards: qa.guards,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
