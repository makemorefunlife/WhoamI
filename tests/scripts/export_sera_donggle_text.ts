import fs from "node:fs";
import path from "node:path";
import React from "react";
import ReactDOMServer from "react-dom/server";
import OpenAI from "openai";

import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { applyRomanticV4FinalNarrativeArchitecture } from "../../lib/relationship/romantic/prototypeV4/productionAdapter/applyRomanticV4FinalNarrativeArchitecture";
import { isRomanticV4NarrativeLlmEnabled } from "../../lib/relationship/romantic/prototypeV4/romanticV4NarrativeLlmFlag";
import { CanonicalReportView } from "../../components/relationship/romantic/v4/CanonicalReportView";
import type { RomanticV4SurveyInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { RomanticV4PairSajuInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SajuInput";
import type { CurrentSelfProfile } from "../../lib/v2/survey/types";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    if (line.startsWith("OPENAI_API_KEY=")) {
      process.env.OPENAI_API_KEY = line.split("=")[1].trim();
    }
  }
}
process.env.ROMANTIC_V4_NARRATIVE_LLM = "true";

function makeProfile(secondaryOverrides: Record<string, number>): CurrentSelfProfile {
  const secondaryBase = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  const primary = { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 };
  return {
    profile_type: "current_self",
    primary_axes: primary,
    secondary_axes: { ...secondaryBase, ...secondaryOverrides },
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  } as CurrentSelfProfile;
}

async function run() {
  const pairSajuInput: RomanticV4PairSajuInput = {
    mode: "dev_fixture",
    birthA: null,
    birthB: null,
    nameA: "Sera",
    nameB: "동글",
  };

  const profileA = makeProfile({ self_control: 70, recognition: 75, empathy: 65, conflict_style: 45 });
  const profileB = makeProfile({ structure: 75, self_control: 65, empathy: 45, conflict_style: 50 });
  const surveyInput: RomanticV4SurveyInput = { mode: "real", profileA, profileB };

  const deterministicPayload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput,
    surveyInput,
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const narratedPayload = await applyRomanticV4FinalNarrativeArchitecture(deterministicPayload, {
    openai,
    locale: "ko-KR",
    pairSajuInput,
    surveyInput,
  });

  const report = narratedPayload.canonicalReport;
  if (!report) throw new Error("Missing canonicalReport");

  const html = ReactDOMServer.renderToString(
    React.createElement(CanonicalReportView, { report, payload: narratedPayload })
  );

  const fullHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Sera x 동글 Report</title><style>body { font-family: sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; line-height: 1.6; } section { background: #fff; border: 1px solid #eee; margin-bottom: 20px; padding: 20px; border-radius: 8px; }</style></head><body>${html}</body></html>`;

  const artifactsDir = "C:/Users/tehch/.gemini/antigravity/brain/019d25ec-8986-4caf-bda6-3b3834453124/scratch";
  const htmlPath = path.join(artifactsDir, "01_sera_x_donggle_full.html");
  fs.writeFileSync(htmlPath, fullHtml, "utf-8");

  // Also copy to tests/scripts/output/romantic-qa/
  const qaDir = path.join(process.cwd(), "tests/scripts/output/romantic-qa");
  fs.mkdirSync(qaDir, { recursive: true });
  fs.writeFileSync(path.join(qaDir, "01-sera-x-donggle.html"), fullHtml, "utf-8");

  let md: string[] = [];
  md.push("# Sera × 동글 Romantic VNext Premium Report — Complete Customer-Visible Copy\n");

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

  const mdPath = path.join(artifactsDir, "01_sera_x_donggle_full.md");
  fs.writeFileSync(mdPath, md.join("\n"), "utf-8");

  const neMeta = report.narrativeEditorResult?.meta;
  const discoveryMeta = report.expertIntelligenceMeta;
  const callCount = discoveryMeta?.callCount ?? 0;
  const fallbackOccurred = Boolean(neMeta?.failed || discoveryMeta?.failed);

  console.log("=== EXPORT SUCCESS ===");
  console.log("HTML:", htmlPath);
  console.log("MD:", mdPath);
  console.log("CallCount:", callCount);
  console.log("NE Applied:", `${neMeta?.totalApplied ?? 0}/${neMeta?.totalProposed ?? 0}`);
  console.log("Discoveries:", discoveryMeta?.totalFindingsReturned ?? 0);
  console.log("Fallback:", fallbackOccurred);
}

run().catch((err) => {
  console.error("Export error:", err);
  process.exit(1);
});
