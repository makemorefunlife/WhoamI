import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import { buildRomanticV4ProductionInput } from "../../lib/relationship/romantic/prototypeV4/productionAdapter/buildRomanticV4ProductionInput";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { applyRomanticV4FinalNarrativeArchitecture } from "../../lib/relationship/romantic/prototypeV4/productionAdapter/applyRomanticV4FinalNarrativeArchitecture";
import { isRomanticV4NarrativeLlmEnabled } from "../../lib/relationship/romantic/prototypeV4/romanticV4NarrativeLlmFlag";
import { CanonicalReportView } from "../../components/relationship/romantic/v4/CanonicalReportView";
import type { CurrentSelfProfile } from "../../lib/v2/survey/types";
import type { SajuMasterJson } from "../../lib/personCore/types/sajuMaster";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const parts = line.split("=");
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  }
}
process.env.ROMANTIC_V4_NARRATIVE_LLM = "true";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey);

async function run() {
  const reportIdA = "51e60cca-8596-4634-87e7-ca3b6468b14c";
  const reportIdB = "6228187e-40c0-454b-bbca-ede9ec8e7836";

  const { data: repA } = await supabase.from("reports").select("*").eq("id", reportIdA).single();
  const { data: repB } = await supabase.from("reports").select("*").eq("id", reportIdB).single();
  const { data: bpA } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdA).single();
  const { data: bpB } = await supabase.from("person_core_blueprints").select("*").eq("report_id", reportIdB).single();

  const personA = {
    reportId: reportIdA,
    name: repA.name || "Sera",
    birthDate: repA.birth_date,
    birthTime: repA.birth_time,
    birthTimeUnknown: !repA.birth_time?.trim(),
    surveyProfile: bpA.psych_master_json as CurrentSelfProfile,
    sajuMaster: bpA.saju_master_json as SajuMasterJson,
  };

  const personB = {
    reportId: reportIdB,
    name: repB.name || "동글",
    birthDate: repB.birth_date,
    birthTime: repB.birth_time,
    birthTimeUnknown: !repB.birth_time?.trim(),
    surveyProfile: bpB.psych_master_json as CurrentSelfProfile,
    sajuMaster: bpB.saju_master_json as SajuMasterJson,
  };

  const productionInput = buildRomanticV4ProductionInput({
    personA,
    personB,
    locale: "ko-KR",
  });

  const v4PayloadRaw = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    surveyInput: productionInput.surveyInput,
    pairSajuInput: productionInput.pairSajuInput,
    precomputed: productionInput.precomputed,
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const v4PayloadNarrated = await applyRomanticV4FinalNarrativeArchitecture(v4PayloadRaw, {
    openai,
    locale: "ko-KR",
    pairSajuInput: productionInput.pairSajuInput,
    surveyInput: productionInput.surveyInput,
    precomputed: productionInput.precomputed,
  });

  const report = v4PayloadNarrated.canonicalReport;
  if (!report) throw new Error("Missing canonicalReport");

  const html = ReactDOMServer.renderToString(
    React.createElement(CanonicalReportView, { report, payload: v4PayloadNarrated })
  );

  const fullHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Real DB Couple Report (${personA.name} x ${personB.name})</title><style>body { font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; line-height: 1.6; } section { background: #fff; border: 1px solid #eee; margin-bottom: 20px; padding: 20px; border-radius: 8px; }</style></head><body>${html}</body></html>`;

  const artifactsDir = "C:/Users/tehch/.gemini/antigravity/brain/019d25ec-8986-4caf-bda6-3b3834453124/scratch";
  const htmlPath = path.join(artifactsDir, "real_db_couple_sera_donggle_full.html");
  fs.writeFileSync(htmlPath, fullHtml, "utf-8");

  let md: string[] = [];
  md.push(`# Real Database Production Romantic Premium Report — Complete Customer-Visible Copy\n`);
  md.push(`- **Pair**: ${personA.name} (${personA.birthDate} ${personA.birthTime || "시간 모름"}) × ${personB.name} (${personB.birthDate} ${personB.birthTime || "시간 모름"})`);
  md.push(`- **Report Row ID**: 2e96c631-791b-4f89-bfd6-5a44f7b344cb\n`);

  for (const s of report.sections) {
    md.push(`\n======================================================================`);
    md.push(`## [CHAPTER ${s.chapterNumber ?? 0}] ${s.title}`);
    md.push(`Subtitle: ${s.subtitle}`);
    md.push(`======================================================================\n`);

    for (const b of s.blocks) {
      md.push(`### Block: ${b.title || b.blockId}`);
      if (b.badge) md.push(`[Badge: ${b.badge}]`);
      if (b.heading) md.push(`**${b.heading}**`);
      if (b.body) md.push(`${b.body}`);
      if (b.quote) md.push(`> "${b.quote}"`);

      if (b.items && b.items.length > 0) {
        for (const item of b.items) {
          if (typeof item === "string") {
            md.push(`- ${item}`);
          } else if (typeof item === "object" && item !== null) {
            const it = item as any;
            md.push(`- **${it.label || it.title || it.heading || ""}**: ${it.body || it.text || JSON.stringify(it)}`);
          }
        }
      }
      md.push("");
    }
  }

  const mdPath = path.join(artifactsDir, "real_db_couple_sera_donggle_full.md");
  fs.writeFileSync(mdPath, md.join("\n"), "utf-8");

  const neMeta = report.narrativeEditorResult?.meta;
  const discoveryMeta = report.expertIntelligenceMeta;
  const callCount = discoveryMeta?.callCount ?? 0;
  const fallbackOccurred = Boolean(neMeta?.failed || discoveryMeta?.failed);

  console.log("=== REAL DB REPORT EXPORT SUCCESS ===");
  console.log("HTML Path:", htmlPath);
  console.log("MD Path:", mdPath);
  console.log("LLM Call Count:", callCount);
  console.log("NE Applied:", `${neMeta?.totalApplied ?? 0}/${neMeta?.totalProposed ?? 0}`);
  console.log("Fallback Occurred:", fallbackOccurred);
}

run().catch((err) => {
  console.error("Real DB report export failed:", err);
  process.exit(1);
});
