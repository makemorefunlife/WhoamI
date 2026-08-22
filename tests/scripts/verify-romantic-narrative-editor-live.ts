/**
 * Evidence-Grounded Narrative Editor — LIVE test against the real OpenAI
 * API. NOT part of the automated `node --test` suite (see
 * tests/unit/romantic-narrative-editor.test.mjs for the mocked, CI-safe
 * version). Run manually:
 *
 *   npx tsx tests/scripts/verify-romantic-narrative-editor-live.ts
 *
 * Requires OPENAI_API_KEY in .env.local. 5 pairs x 1 call = 5 real API
 * calls on gpt-4o-mini.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import {
  extractNarrativeEditablePackets,
  buildRomanticNarrativeEditorSafe,
  applyNarrativeEdits,
} from "../../lib/relationship/romantic/prototypeV4/romanticNarrativeEditor";
import type { RomanticV4SurveyInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { RomanticV4PairSajuInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SajuInput";
import type { CurrentSelfProfile } from "../../lib/v2/survey/types";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not set in .env.local — aborting live test.");
  process.exit(1);
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  label: string;
  nameA: string;
  nameB: string;
  pairSajuInput: RomanticV4PairSajuInput;
  profileA: CurrentSelfProfile;
  profileB: CurrentSelfProfile;
};

const PAIRS: Pair[] = [
  {
    label: "Sera x 동글 — the recurring named validation pair",
    nameA: "Sera", nameB: "동글",
    pairSajuInput: { mode: "dev_fixture", birthA: null, birthB: null, nameA: "Sera", nameB: "동글" },
    profileA: makeProfile({ self_control: 70, recognition: 75, empathy: 65, conflict_style: 45 }),
    profileB: makeProfile({ structure: 75, self_control: 65, empathy: 45, conflict_style: 50 }),
  },
  {
    label: "Pair 2 — high contrast (opposite psych, different day masters)",
    nameA: "지민", nameB: "정우",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1993-04-12", birthTime: "07:30" }, birthB: { birthDate: "1991-11-02", birthTime: "23:10" }, nameA: "지민", nameB: "정우" },
    profileA: makeProfile({ empathy: 75, recognition: 70, conflict_style: 35, structure: 40 }),
    profileB: makeProfile({ empathy: 35, structure: 75, conflict_style: 70, self_control: 65 }),
  },
  {
    label: "Pair 3 — high similarity (Hidden Collision territory)",
    nameA: "하나", nameB: "두리",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1996-06-20", birthTime: "14:00" }, birthB: { birthDate: "1995-02-15", birthTime: "09:45" }, nameA: "하나", nameB: "두리" },
    profileA: makeProfile({ conflict_style: 30, recognition: 65 }),
    profileB: makeProfile({ conflict_style: 32, recognition: 68 }),
  },
  {
    label: "Pair 4 — avoidant/avoidant (both low conflict engagement)",
    nameA: "다은", nameB: "시우",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1998-03-03", birthTime: "05:15" }, birthB: { birthDate: "1997-12-19", birthTime: "20:40" }, nameA: "다은", nameB: "시우" },
    profileA: makeProfile({ conflict_style: 20, self_control: 70, empathy: 60 }),
    profileB: makeProfile({ conflict_style: 22, self_control: 65, empathy: 55 }),
  },
  {
    label: "Pair 5 — structure vs stimulation extreme split",
    nameA: "예린", nameB: "도현",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1988-08-08", birthTime: "12:00" }, birthB: { birthDate: "1994-05-30", birthTime: "01:30" }, nameA: "예린", nameB: "도현" },
    profileA: makeProfile({ structure: 85, stimulation: 20, practicality: 75 }),
    profileB: makeProfile({ structure: 20, stimulation: 85, practicality: 30 }),
  },
];

async function runPair(pair: Pair) {
  console.log(`\n${"=".repeat(70)}\n${pair.label}\n${"=".repeat(70)}`);

  const surveyInput: RomanticV4SurveyInput = { mode: "real", profileA: pair.profileA, profileB: pair.profileB };
  const canonicalReport = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: pair.pairSajuInput,
    surveyInput,
  });

  const packets = extractNarrativeEditablePackets(canonicalReport.sections);
  console.log(`\n[PACKETS OFFERED — ${packets.length}]`);
  for (const p of packets) console.log(`  - [${p.chapterOwner}/${p.blockId}] "${p.currentText}"`);

  const result = await buildRomanticNarrativeEditorSafe({
    openai,
    packets,
    names: { a: pair.nameA, b: pair.nameB },
    locale: "ko-KR",
  });

  console.log(`\n[EDITOR] model=${result.meta.model} calls=${result.meta.callCount} failed=${result.meta.failed}${result.meta.failureReason ? ` (${result.meta.failureReason})` : ""}`);
  console.log(`[EDITOR] proposed=${result.meta.totalProposed} applied=${result.meta.totalApplied} rejected=${result.meta.totalRejected} recognitionKept=${result.meta.recognitionLinesKept} recognitionDropped=${result.meta.recognitionLinesDropped}`);

  for (const e of result.edits) {
    const packet = packets.find((p) => p.blockId === e.targetBlockId);
    console.log(`\n  --- [${e.chapterOwner}/${e.targetBlockId}] ${e.rejected ? "REJECTED" : "APPLIED"} ---`);
    console.log(`  BEFORE: ${packet?.currentText ?? "(unknown)"}`);
    console.log(`  AFTER:  ${e.editedText}`);
    console.log(`  evidenceRefs: ${e.evidenceRefs.join(", ")}`);
    console.log(`  supportedMeaning: ${e.supportedMeaning}`);
    console.log(`  claimBoundary: supported="${e.claimBoundary.supported}" notSupported="${e.claimBoundary.notSupported}"`);
    console.log(`  recognitionLine: ${e.recognitionLine ?? "(none)"}`);
    if (e.rejected) console.log(`  rejectionReason: ${e.rejectionReason}`);
  }

  const finalSections = applyNarrativeEdits(canonicalReport.sections, result.edits);

  return {
    pair: pair.label,
    packetsOffered: packets.length,
    proposed: result.meta.totalProposed,
    applied: result.meta.totalApplied,
    rejected: result.meta.totalRejected,
    recognitionKept: result.meta.recognitionLinesKept,
    failed: result.meta.failed,
    finalSections,
  };
}

async function main() {
  const summaries = [];
  for (const pair of PAIRS) {
    summaries.push(await runPair(pair));
  }
  console.log(`\n${"=".repeat(70)}\nSUMMARY\n${"=".repeat(70)}`);
  for (const s of summaries) {
    console.log(
      `${s.pair}: packets=${s.packetsOffered}, proposed=${s.proposed}, applied=${s.applied}, rejected=${s.rejected}, recognitionKept=${s.recognitionKept}, failed=${s.failed}`,
    );
  }
}

main().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
