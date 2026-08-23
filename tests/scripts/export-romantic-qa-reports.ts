/**
 * Human QA export — generates FULL user-visible Romantic Premium report
 * HTML for 5 pairs through the exact production-equivalent sequence:
 *
 *   buildRomanticV4PrototypePayload (deterministic)
 *     -> applyRomanticV4FinalNarrativeArchitecture (gated by
 *        isRomanticV4NarrativeLlmEnabled(), same flag check the real route
 *        uses — this script does NOT force the flag on internally; set
 *        ROMANTIC_V4_NARRATIVE_LLM=true in the environment before running)
 *     -> CanonicalReportView rendered via ReactDOMServer.renderToString
 *        (same component the production page tree renders)
 *
 * NOT part of the automated `node --test` suite. Run manually:
 *
 *   ROMANTIC_V4_NARRATIVE_LLM=true npx tsx tests/scripts/export-romantic-qa-reports.ts
 *
 * Requires OPENAI_API_KEY in .env.local.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not set in .env.local — aborting.");
  process.exit(1);
}
if (!isRomanticV4NarrativeLlmEnabled()) {
  console.error("ROMANTIC_V4_NARRATIVE_LLM is not enabled in this process's environment — aborting. Set ROMANTIC_V4_NARRATIVE_LLM=true before running.");
  process.exit(1);
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT_DIR = process.argv[2] || path.join(process.cwd(), "tests/scripts/output/romantic-qa");
fs.mkdirSync(OUT_DIR, { recursive: true });

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

type Pair = {
  fileSlug: string;
  label: string;
  pairSajuInput: RomanticV4PairSajuInput;
  profileA: CurrentSelfProfile;
  profileB: CurrentSelfProfile;
};

// Same 5 fixtures used in the prior live validation runs this session —
// Sera x 동글 (the recurring named validation pair) + 4 genuinely
// contrasting pairs (high-contrast, high-similarity, avoidant/avoidant,
// structure-vs-stimulation).
const PAIRS: Pair[] = [
  {
    fileSlug: "01-sera-x-donggle",
    label: "Sera x 동글",
    pairSajuInput: { mode: "dev_fixture", birthA: null, birthB: null, nameA: "Sera", nameB: "동글" },
    profileA: makeProfile({ self_control: 70, recognition: 75, empathy: 65, conflict_style: 45 }),
    profileB: makeProfile({ structure: 75, self_control: 65, empathy: 45, conflict_style: 50 }),
  },
  {
    fileSlug: "02-high-contrast-jimin-jeongwoo",
    label: "지민 x 정우 (high contrast)",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1993-04-12", birthTime: "07:30" }, birthB: { birthDate: "1991-11-02", birthTime: "23:10" }, nameA: "지민", nameB: "정우" },
    profileA: makeProfile({ empathy: 75, recognition: 70, conflict_style: 35, structure: 40 }),
    profileB: makeProfile({ empathy: 35, structure: 75, conflict_style: 70, self_control: 65 }),
  },
  {
    fileSlug: "03-high-similarity-hana-duri",
    label: "하나 x 두리 (high similarity)",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1996-06-20", birthTime: "14:00" }, birthB: { birthDate: "1995-02-15", birthTime: "09:45" }, nameA: "하나", nameB: "두리" },
    profileA: makeProfile({ conflict_style: 30, recognition: 65 }),
    profileB: makeProfile({ conflict_style: 32, recognition: 68 }),
  },
  {
    fileSlug: "04-avoidant-daeun-siwoo",
    label: "다은 x 시우 (avoidant/avoidant)",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1998-03-03", birthTime: "05:15" }, birthB: { birthDate: "1997-12-19", birthTime: "20:40" }, nameA: "다은", nameB: "시우" },
    profileA: makeProfile({ conflict_style: 20, self_control: 70, empathy: 60 }),
    profileB: makeProfile({ conflict_style: 22, self_control: 65, empathy: 55 }),
  },
  {
    fileSlug: "05-structure-vs-stimulation-yerin-dohyun",
    label: "예린 x 도현 (structure vs stimulation)",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1988-08-08", birthTime: "12:00" }, birthB: { birthDate: "1994-05-30", birthTime: "01:30" }, nameA: "예린", nameB: "도현" },
    profileA: makeProfile({ structure: 85, stimulation: 20, practicality: 75 }),
    profileB: makeProfile({ structure: 20, stimulation: 85, practicality: 30 }),
  },
];

async function runPair(pair: Pair, index: number) {
  console.log(`\n[${index + 1}/${PAIRS.length}] ${pair.label} ...`);

  const surveyInput: RomanticV4SurveyInput = { mode: "real", profileA: pair.profileA, profileB: pair.profileB };

  const deterministicPayload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput: pair.pairSajuInput,
    surveyInput,
  });

  const narratedPayload = await applyRomanticV4FinalNarrativeArchitecture(deterministicPayload, {
    openai,
    locale: "ko-KR",
    pairSajuInput: pair.pairSajuInput,
    surveyInput,
  });

  const report = narratedPayload.canonicalReport;
  if (!report) throw new Error(`${pair.label}: canonicalReport missing on payload`);

  const html = ReactDOMServer.renderToString(
    React.createElement(CanonicalReportView, { report, payload: narratedPayload }),
  );

  const fullHtml = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${pair.label}</title></head><body>${html}</body></html>`;
  const outPath = path.join(OUT_DIR, `${pair.fileSlug}.html`);
  fs.writeFileSync(outPath, fullHtml, "utf-8");

  const neMeta = report.narrativeEditorResult?.meta;
  const discoveryMeta = report.expertIntelligenceMeta;
  const callCount = discoveryMeta?.callCount ?? 0;
  const fallbackOccurred = Boolean(neMeta?.failed || discoveryMeta?.failed);

  console.log(`  -> ${outPath}`);
  console.log(`  callCount=${callCount} neApplied=${neMeta?.totalApplied ?? 0}/${neMeta?.totalProposed ?? 0} discoveries=${discoveryMeta?.totalFindingsReturned ?? 0} fallbackOccurred=${fallbackOccurred}`);

  return {
    label: pair.label,
    outPath,
    callCount,
    neApplied: neMeta?.totalApplied ?? 0,
    neProposed: neMeta?.totalProposed ?? 0,
    discoveries: discoveryMeta?.totalFindingsReturned ?? 0,
    fallbackOccurred,
    htmlBytes: Buffer.byteLength(fullHtml, "utf-8"),
  };
}

async function main() {
  const summaries = [];
  for (let i = 0; i < PAIRS.length; i++) {
    summaries.push(await runPair(PAIRS[i], i));
  }
  console.log(`\n${"=".repeat(70)}\nSUMMARY (out dir: ${OUT_DIR})\n${"=".repeat(70)}`);
  for (const s of summaries) {
    console.log(`${s.label}: ${s.outPath} | callCount=${s.callCount} | NE ${s.neApplied}/${s.neProposed} | discoveries=${s.discoveries} | fallbackOccurred=${s.fallbackOccurred} | ${s.htmlBytes} bytes`);
  }
}

main().catch((err) => {
  console.error("QA export failed:", err);
  process.exit(1);
});
