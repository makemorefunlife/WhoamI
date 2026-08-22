/**
 * Final Narrative Architecture — LIVE test against the real OpenAI API,
 * exercising the actual production-equivalent path (buildRomanticV4PrototypePayload
 * -> applyRomanticV4FinalNarrativeArchitecture, exactly the sequence
 * app/api/relationship/analyze/premium/route.ts runs when
 * ROMANTIC_V4_NARRATIVE_LLM is on). NOT part of the automated `node --test`
 * suite. Run manually:
 *
 *   npx tsx tests/scripts/verify-romantic-final-narrative-architecture-live.ts
 *
 * Requires OPENAI_API_KEY in .env.local. 5 pairs x 2 calls = 10 real API
 * calls on gpt-4o-mini, plus one deliberate simulated-failure pair to prove
 * deterministic fallback (0 extra real calls for that one).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { buildRomanticV4PrototypePayload } from "../../lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { applyRomanticV4FinalNarrativeArchitecture } from "../../lib/relationship/romantic/prototypeV4/productionAdapter/applyRomanticV4FinalNarrativeArchitecture";
import type { RomanticV4SurveyInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { RomanticV4PairSajuInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SajuInput";
import type { CurrentSelfProfile } from "../../lib/v2/survey/types";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY not set in .env.local — aborting live test.");
  process.exit(1);
}
const realOpenai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  simulateLlmFailure?: boolean;
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
    label: "Pair 5 — simulated LLM outage (proves deterministic fallback survives BOTH calls failing)",
    nameA: "예린", nameB: "도현",
    pairSajuInput: { mode: "real", birthA: { birthDate: "1988-08-08", birthTime: "12:00" }, birthB: { birthDate: "1994-05-30", birthTime: "01:30" }, nameA: "예린", nameB: "도현" },
    profileA: makeProfile({ structure: 85, stimulation: 20, practicality: 75 }),
    profileB: makeProfile({ structure: 20, stimulation: 85, practicality: 30 }),
    simulateLlmFailure: true,
  },
];

const brokenOpenai = {
  chat: { completions: { create: async () => { throw new Error("simulated outage"); } } },
} as unknown as OpenAI;

async function runPair(pair: Pair) {
  console.log(`\n${"=".repeat(70)}\n${pair.label}\n${"=".repeat(70)}`);

  const surveyInput: RomanticV4SurveyInput = { mode: "real", profileA: pair.profileA, profileB: pair.profileB };

  // Exact production sequence: build the fully deterministic payload first
  // (this is what ships even if everything below fails), then apply the
  // Final Narrative Architecture as a post-processing pass.
  const deterministicPayload = buildRomanticV4PrototypePayload("complete", "ko-KR", {
    pairSajuInput: pair.pairSajuInput,
    surveyInput,
  });
  const deterministicBefore = deterministicPayload.canonicalReport?.sections ?? [];

  const openai = pair.simulateLlmFailure ? brokenOpenai : realOpenai;
  const narratedPayload = await applyRomanticV4FinalNarrativeArchitecture(deterministicPayload, {
    openai,
    locale: "ko-KR",
    pairSajuInput: pair.pairSajuInput,
    surveyInput,
  });

  const report = narratedPayload.canonicalReport;
  const meta = report?.narrativeEditorResult?.meta;
  const discoveryMeta = report?.expertIntelligenceMeta;
  const callCount = discoveryMeta?.callCount ?? 0;

  console.log(`\n[CALL COUNT] ${callCount} (expected 2, or 0 on total failure)`);
  console.log(`[NARRATIVE EDITOR] proposed=${meta?.totalProposed ?? 0} applied=${meta?.totalApplied ?? 0} rejected=${meta?.totalRejected ?? 0} recognitionKept=${meta?.recognitionLinesKept ?? 0} failed=${meta?.failed}`);
  console.log(`[DISCOVERY/Mode B] found=${discoveryMeta?.totalFindingsReturned ?? 0} renderEligible=${discoveryMeta?.totalFindingsRenderEligible ?? 0} failed=${discoveryMeta?.failed}`);

  const edits = report?.narrativeEditorResult?.edits ?? [];
  for (const e of edits) {
    console.log(`\n  --- [${e.chapterOwner}/${e.targetBlockId}] ${e.rejected ? "REJECTED" : "APPLIED"} ---`);
    console.log(`  editedText: ${e.editedText.slice(0, 160)}${e.editedText.length > 160 ? "..." : ""}`);
    console.log(`  recognitionLine: ${e.recognitionLine ?? "(none)"}`);
    if (e.rejected) console.log(`  rejectionReason: ${e.rejectionReason}`);
  }

  const findings = report?.expertFindings ?? [];
  console.log(`\n[MODE B DISCOVERIES — ${findings.length}]`);
  for (const f of findings) {
    console.log(`  - [${f.classification}/${f.confidence}] ${f.claim}`);
    console.log(`    renderEligible=${f.renderEligible} rejectionReason=${f.rejectionReason ?? "n/a"}`);
  }

  // Fallback-survival proof: sections must never be empty/undefined even
  // when the LLM step totally fails.
  const finalSections = report?.sections ?? [];
  const fallbackSurvived = finalSections.length > 0 && finalSections.length === deterministicBefore.length;
  console.log(`\n[FALLBACK CHECK] deterministic sections present=${deterministicBefore.length} final sections present=${finalSections.length} survived=${fallbackSurvived}`);

  return {
    pair: pair.label,
    callCount,
    proposed: meta?.totalProposed ?? 0,
    applied: meta?.totalApplied ?? 0,
    rejected: meta?.totalRejected ?? 0,
    discoveries: findings.length,
    fallbackSurvived,
    simulatedFailure: Boolean(pair.simulateLlmFailure),
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
      `${s.pair}: callCount=${s.callCount}, proposed=${s.proposed}, applied=${s.applied}, rejected=${s.rejected}, discoveries=${s.discoveries}, fallbackSurvived=${s.fallbackSurvived}${s.simulatedFailure ? " [SIMULATED OUTAGE]" : ""}`,
    );
  }
}

main().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
