/**
 * Phase 4A — LIVE test against the real OpenAI API. NOT part of the
 * automated `node --test` suite (see tests/unit/romantic-expert-intelligence.test.mjs
 * for the mocked, CI-safe version). Run manually:
 *
 *   npx tsx tests/scripts/verify-romantic-expert-intelligence-live.ts
 *
 * Requires OPENAI_API_KEY in .env.local. Makes 5 pairs x 2 modes = 10 real
 * API calls on gpt-4o-mini. Costs a fraction of a cent total.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import { buildActualFourCeContract } from "../../lib/relationship/romantic/prototypeV4/buildActualFourCeContract";
import { buildRomanticExpertIntelligenceSafe } from "../../lib/relationship/romantic/prototypeV4/romanticExpertIntelligence";
import { selectUserVisibleExpertBlocks } from "../../lib/relationship/romantic/prototypeV4/romanticExpertConsumptionPolicy";
import type { RomanticV4SurveyInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { PsychMasterJson } from "../../lib/personCore/types/psychMaster";

/**
 * RomanticV4SurveyInput's declared type (mode/profileA/profileB) is already
 * stale relative to what buildActualFourCeContract.ts actually reads at
 * runtime (surveyInput?.psychA / surveyInput?.psychB — see its line ~319,
 * a pre-existing TS2339 present on baseline main). verify-sera-donggle-e2e.ts
 * relies on this same undeclared shape. This script follows that same
 * established runtime contract; this local type just names it so the cast
 * below is precise instead of `any`, without touching the production type.
 */
type LegacySurveyInputWithPsych = RomanticV4SurveyInput & {
  psychA?: PsychMasterJson;
  psychB?: PsychMasterJson;
};

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not set in .env.local — aborting live test.");
  process.exit(1);
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function makePsych(overrides: Record<string, number>): PsychMasterJson {
  const base = {
    stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50,
    conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50,
    thinking_style: 50, decision_style: 50,
  };
  return { survey_source: "v2_10q", secondary_axes: { ...base, ...overrides } } as unknown as PsychMasterJson;
}

type Pair = {
  label: string;
  nameA: string;
  nameB: string;
  birthA: { birthDate: string; birthTime: string };
  birthB: { birthDate: string; birthTime: string };
  psychA: PsychMasterJson;
  psychB: PsychMasterJson;
};

const PAIRS: Pair[] = [
  {
    label: "Pair 1 — high contrast (different day masters, opposite psych)",
    nameA: "지민", nameB: "정우",
    birthA: { birthDate: "1993-04-12", birthTime: "07:30" },
    birthB: { birthDate: "1991-11-02", birthTime: "23:10" },
    psychA: makePsych({ empathy: 75, recognition: 70, conflict_style: 35, structure: 40 }),
    psychB: makePsych({ empathy: 35, structure: 75, conflict_style: 70, self_control: 65 }),
  },
  {
    label: "Pair 2 — high similarity (similar psych, testing Hidden Collision)",
    nameA: "하나", nameB: "두리",
    birthA: { birthDate: "1996-06-20", birthTime: "14:00" },
    birthB: { birthDate: "1995-02-15", birthTime: "09:45" },
    psychA: makePsych({ conflict_style: 30, recognition: 65 }),
    psychB: makePsych({ conflict_style: 32, recognition: 68 }),
  },
  {
    label: "Pair 3 — moderate/mixed (middling gaps, no extreme signal)",
    nameA: "세영", nameB: "준호",
    birthA: { birthDate: "1990-01-08", birthTime: "18:20" },
    birthB: { birthDate: "1989-09-27", birthTime: "03:00" },
    psychA: makePsych({ decision_style: 55, thinking_style: 60 }),
    psychB: makePsych({ decision_style: 45, thinking_style: 40 }),
  },
  {
    label: "Pair 4 — avoidant/avoidant (both low conflict engagement, testing collision depth)",
    nameA: "다은", nameB: "시우",
    birthA: { birthDate: "1998-03-03", birthTime: "05:15" },
    birthB: { birthDate: "1997-12-19", birthTime: "20:40" },
    psychA: makePsych({ conflict_style: 20, self_control: 70, empathy: 60 }),
    psychB: makePsych({ conflict_style: 22, self_control: 65, empathy: 55 }),
  },
  {
    label: "Pair 5 — structure vs stimulation extreme split",
    nameA: "예린", nameB: "도현",
    birthA: { birthDate: "1988-08-08", birthTime: "12:00" },
    birthB: { birthDate: "1994-05-30", birthTime: "01:30" },
    psychA: makePsych({ structure: 85, stimulation: 20, practicality: 75 }),
    psychB: makePsych({ structure: 20, stimulation: 85, practicality: 30 }),
  },
];

async function runPair(pair: Pair) {
  console.log(`\n${"=".repeat(70)}\n${pair.label}\n${"=".repeat(70)}`);

  const surveyInput: LegacySurveyInputWithPsych = {
    mode: "real",
    profileA: null,
    profileB: null,
    psychA: pair.psychA,
    psychB: pair.psychB,
  };

  const canonicalReport = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: { mode: "real", birthA: pair.birthA, birthB: pair.birthB, nameA: pair.nameA, nameB: pair.nameB },
    surveyInput,
  });

  const csi = canonicalReport.storyPlan.crossSignalInsightsV1 ?? [];
  console.log(`\n[DETERMINISTIC Cross-Signal V1 — ${csi.length} finding(s)]`);
  for (const i of csi) console.log(`  - (${i.insightType}) ${i.derivedMeaning}`);

  const actual = buildActualFourCeContract("ko-KR", { mode: "real", birthA: pair.birthA, birthB: pair.birthB, nameA: pair.nameA, nameB: pair.nameB }, surveyInput);

  const result = await buildRomanticExpertIntelligenceSafe({
    openai,
    storyPlan: canonicalReport.storyPlan,
    chartA: actual.individualCeA,
    chartB: actual.individualCeB,
    axisResults: canonicalReport.axisOverview,
    names: { a: pair.nameA, b: pair.nameB },
    locale: "ko-KR",
  });

  console.log(`\n[EXPERT LAYER] model=${result.meta.model} calls=${result.meta.callCount} failed=${result.meta.failed}${result.meta.failureReason ? ` (${result.meta.failureReason})` : ""}`);

  const supported = result.findings.filter((f) => f.classification === "SUPPORTED_SYNTHESIS");
  const derived = result.findings.filter((f) => f.classification === "EXPERT_DERIVED");
  const rejected = result.findings.filter((f) => !f.renderEligible);

  console.log(`\n[SUPPORTED_SYNTHESIS — ${supported.length}]`);
  for (const f of supported) console.log(`  - [${f.confidence}/${f.novelty}] ${f.claim}\n    reasoning: ${f.reasoning}`);

  console.log(`\n[EXPERT_DERIVED — ${derived.length}]`);
  for (const f of derived) {
    console.log(`  - [${f.confidence}/${f.novelty}] ${f.claim}`);
    console.log(`    sajuEvidence: ${f.sajuEvidence.join(" | ")}`);
    console.log(`    reasoning: ${f.reasoning}`);
    if (f.psychCrossCheck) console.log(`    psychCrossCheck: ${f.psychCrossCheck.status} (${f.psychCrossCheck.axisKey ?? "n/a"}) — ${f.psychCrossCheck.note}`);
  }

  console.log(`\n[REJECTED (renderEligible=false) — ${rejected.length}]`);
  for (const f of rejected) console.log(`  - [${f.classification}/${f.novelty}] ${f.claim.slice(0, 60)}... — ${f.rejectionReason ?? "n/a"}`);

  // Phase 4B — post-policy: what actually becomes user-visible, and where.
  const selection = selectUserVisibleExpertBlocks(result.findings, canonicalReport.storyPlan, canonicalReport.sections, "ko-KR");
  console.log(`\n[CONSUMPTION POLICY] tierA=${selection.meta.tierACount} tierB(internal)=${selection.meta.tierBCount} tierC(internal)=${selection.meta.tierCCount} rejected_never=${selection.meta.rejectedNeverCount} rejected_dup=${selection.meta.rejectedDuplicateAgainstReportCount} rejected_cap=${selection.meta.rejectedChapterCapCount}`);
  console.log(`[USER-VISIBLE — ${selection.meta.selectedCount}]`);
  for (const [chapterId, blocks] of Object.entries(selection.blocksByChapter)) {
    for (const b of blocks!) console.log(`  - [${chapterId}] ${b.title}: ${b.body.slice(0, 120)}${b.body.length > 120 ? "..." : ""}`);
  }

  return {
    pair: pair.label,
    csiCount: csi.length,
    supportedCount: supported.length,
    derivedCount: derived.length,
    rejectedCount: rejected.length,
    userVisibleCount: selection.meta.selectedCount,
    userVisibleChapters: Object.keys(selection.blocksByChapter),
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
      `${s.pair}: deterministic=${s.csiCount}, supported_synthesis=${s.supportedCount}, expert_derived=${s.derivedCount}, rejected=${s.rejectedCount}, user_visible=${s.userVisibleCount} [${s.userVisibleChapters.join(", ")}]`,
    );
  }
}

main().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
