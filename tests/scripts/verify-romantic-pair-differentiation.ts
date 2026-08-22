/**
 * Romantic VNext — pair-first differentiation gate (spec item 10).
 *
 * Builds 10 materially different pairs through the deterministic report
 * builder (no LLM calls — this measures the deterministic personalization
 * layer this rebuild targeted, not the Narrative Editor), normalizes names
 * out of the text, and measures pairwise lexical/bigram overlap (via the
 * same similarity() helper already used elsewhere in this codebase as a
 * dedup backstop) across the 8 chapters the spec calls out: Hero, Ch01
 * (dynamics), Ch02 (attraction), Ch03 (conflict), Ch05 (hidden hearts),
 * Ch06 (repair), Ch08 (strength/vulnerability), Ch10 (choice/closing).
 *
 * IMPORTANT METHODOLOGY DISCLOSURE: bigram overlap is a LEXICAL proxy, not
 * true semantic similarity — it will under-count paraphrased duplication
 * (two sentences that say the same thing in different words score low) and
 * can over-count shared function words/particles in Korean. It is the same
 * measure this codebase already trusts for its dedup backstop
 * (isTextuallyDuplicate), reused here for consistency, not because it's
 * the ideal metric. Treat the reported percentages as a lower bound on
 * true duplication, not an exact figure.
 *
 * Run manually: npx tsx tests/scripts/verify-romantic-pair-differentiation.ts
 */
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report";
import { similarity } from "../../lib/relationship/romantic/prototypeV4/romanticExpertIntelligence";
import type { RomanticV4SurveyInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SurveyEvidence";
import type { RomanticV4PairSajuInput } from "../../lib/relationship/romantic/prototypeV4/romanticV4SajuInput";
import type { CurrentSelfProfile } from "../../lib/v2/survey/types";
import type { CanonicalSection } from "../../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";

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
  birthA: { birthDate: string; birthTime: string };
  birthB: { birthDate: string; birthTime: string };
  profileA: CurrentSelfProfile;
  profileB: CurrentSelfProfile;
};

const PAIRS: Pair[] = [
  { label: "P1 high-contrast opposite psych", nameA: "지민", nameB: "정우", birthA: { birthDate: "1993-04-12", birthTime: "07:30" }, birthB: { birthDate: "1991-11-02", birthTime: "23:10" }, profileA: makeProfile({ empathy: 75, recognition: 70, conflict_style: 35, structure: 40 }), profileB: makeProfile({ empathy: 35, structure: 75, conflict_style: 70, self_control: 65 }) },
  { label: "P2 high-similarity", nameA: "하나", nameB: "두리", birthA: { birthDate: "1996-06-20", birthTime: "14:00" }, birthB: { birthDate: "1995-02-15", birthTime: "09:45" }, profileA: makeProfile({ conflict_style: 30, recognition: 65 }), profileB: makeProfile({ conflict_style: 32, recognition: 68 }) },
  { label: "P3 avoidant/avoidant", nameA: "다은", nameB: "시우", birthA: { birthDate: "1998-03-03", birthTime: "05:15" }, birthB: { birthDate: "1997-12-19", birthTime: "20:40" }, profileA: makeProfile({ conflict_style: 20, self_control: 70, empathy: 60 }), profileB: makeProfile({ conflict_style: 22, self_control: 65, empathy: 55 }) },
  { label: "P4 structure-vs-stimulation", nameA: "예린", nameB: "도현", birthA: { birthDate: "1988-08-08", birthTime: "12:00" }, birthB: { birthDate: "1994-05-30", birthTime: "01:30" }, profileA: makeProfile({ structure: 85, stimulation: 20, practicality: 75 }), profileB: makeProfile({ structure: 20, stimulation: 85, practicality: 30 }) },
  { label: "P5 both-hot-conflict", nameA: "세영", nameB: "준호", birthA: { birthDate: "1990-01-08", birthTime: "18:20" }, birthB: { birthDate: "1989-09-27", birthTime: "03:00" }, profileA: makeProfile({ conflict_style: 85, self_control: 20 }), profileB: makeProfile({ conflict_style: 80, self_control: 25 }) },
  { label: "P6 anxious/avoidant classic", nameA: "유나", nameB: "태오", birthA: { birthDate: "2000-07-04", birthTime: "16:00" }, birthB: { birthDate: "2000-01-04", birthTime: "04:00" }, profileA: makeProfile({ conflict_style: 80, recognition: 25, self_control: 30 }), profileB: makeProfile({ conflict_style: 20, recognition: 80, self_control: 75 }) },
  { label: "P7 psych-extreme single-axis gap", nameA: "라온", nameB: "은서", birthA: { birthDate: "1985-10-10", birthTime: "22:00" }, birthB: { birthDate: "1999-06-01", birthTime: "06:00" }, profileA: makeProfile({ conflict_style: 90, self_control: 85 }), profileB: makeProfile({ conflict_style: 10, self_control: 20 }) },
  { label: "P8 same-day-stem echo", nameA: "소민", nameB: "재현", birthA: { birthDate: "1992-01-15", birthTime: "10:00" }, birthB: { birthDate: "1992-01-16", birthTime: "10:30" }, profileA: makeProfile({ empathy: 55, structure: 50 }), profileB: makeProfile({ empathy: 52, structure: 48 }) },
  { label: "P9 high-empathy-both / low-structure-both", nameA: "채원", nameB: "민준", birthA: { birthDate: "1991-05-05", birthTime: "09:00" }, birthB: { birthDate: "1986-03-22", birthTime: "15:45" }, profileA: makeProfile({ empathy: 85, structure: 25, recognition: 70 }), profileB: makeProfile({ empathy: 80, structure: 30, recognition: 65 }) },
  { label: "P10 low-empathy-both / high-structure-both", nameA: "지호", nameB: "서아", birthA: { birthDate: "1983-12-01", birthTime: "02:00" }, birthB: { birthDate: "1997-08-19", birthTime: "19:00" }, profileA: makeProfile({ empathy: 25, structure: 85, self_control: 80 }), profileB: makeProfile({ empathy: 20, structure: 80, self_control: 75 }) },
];

const TARGET_CHAPTERS: Array<{ label: string; chapterId: CanonicalSection["chapterId"] }> = [
  { label: "Hero", chapterId: "c1_hero" },
  { label: "Ch01 (dynamics)", chapterId: "c3_dynamics" },
  { label: "Ch02 (attraction)", chapterId: "c2_attraction" },
  { label: "Ch03 (conflict)", chapterId: "c4_conflict" },
  { label: "Ch05 (hidden hearts)", chapterId: "c6_hidden_hearts" },
  { label: "Ch06 (repair)", chapterId: "c7_repair" },
  { label: "Ch08 (strength/vulnerability)", chapterId: "c8_strength_vulnerability" },
  { label: "Ch10 (choice/closing)", chapterId: "c12_choice" },
];

function normalizeNames(text: string, nameA: string, nameB: string): string {
  return text.split(nameA).join("A").split(nameB).join("B");
}

function extractChapterText(sections: CanonicalSection[], chapterId: string, nameA: string, nameB: string): string {
  const section = sections.find((s) => s.chapterId === chapterId);
  if (!section) return "";
  const raw = section.blocks.map((b) => b.body).join("\n");
  return normalizeNames(raw, nameA, nameB);
}

function buildPairTexts() {
  return PAIRS.map((pair) => {
    const surveyInput: RomanticV4SurveyInput = { mode: "real", profileA: pair.profileA, profileB: pair.profileB };
    const pairSajuInput: RomanticV4PairSajuInput = { mode: "real", birthA: pair.birthA, birthB: pair.birthB, nameA: pair.nameA, nameB: pair.nameB };
    const report = buildCanonicalRomanticV4Report("ko-KR", 2026, { pairSajuInput, surveyInput });
    const byChapter: Record<string, string> = {};
    for (const t of TARGET_CHAPTERS) {
      byChapter[t.chapterId] = extractChapterText(report.sections, t.chapterId, pair.nameA, pair.nameB);
    }
    return { label: pair.label, byChapter };
  });
}

function main() {
  const pairTexts = buildPairTexts();

  console.log(`${"=".repeat(70)}\nPAIRWISE OVERLAP BY CHAPTER (${pairTexts.length} pairs, ${(pairTexts.length * (pairTexts.length - 1)) / 2} comparisons each)\n${"=".repeat(70)}`);

  const overallByChapter: Record<string, number[]> = {};
  for (const t of TARGET_CHAPTERS) overallByChapter[t.chapterId] = [];

  for (const t of TARGET_CHAPTERS) {
    const scores: Array<{ a: string; b: string; score: number }> = [];
    for (let i = 0; i < pairTexts.length; i++) {
      for (let j = i + 1; j < pairTexts.length; j++) {
        const textA = pairTexts[i].byChapter[t.chapterId];
        const textB = pairTexts[j].byChapter[t.chapterId];
        const score = textA && textB ? similarity(textA, textB) : 0;
        scores.push({ a: pairTexts[i].label, b: pairTexts[j].label, score });
        overallByChapter[t.chapterId].push(score);
      }
    }
    const avg = scores.reduce((s, x) => s + x.score, 0) / scores.length;
    const worst = scores.slice().sort((x, y) => y.score - x.score).slice(0, 3);
    console.log(`\n[${t.label}] avg overlap = ${(avg * 100).toFixed(1)}%  (gate: <=10%)  ${avg <= 0.1 ? "PASS" : "FAIL"}`);
    for (const w of worst) console.log(`    highest: ${w.a} <-> ${w.b} = ${(w.score * 100).toFixed(1)}%`);
  }

  console.log(`\n${"=".repeat(70)}\nSUMMARY\n${"=".repeat(70)}`);
  let anyFail = false;
  for (const t of TARGET_CHAPTERS) {
    const scores = overallByChapter[t.chapterId];
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
    const pass = avg <= 0.1;
    if (!pass) anyFail = true;
    console.log(`${t.label}: ${(avg * 100).toFixed(1)}% ${pass ? "PASS" : "FAIL"}`);
  }
  console.log(`\nGATE RESULT: ${anyFail ? "FAIL — one or more chapters exceed 10% avg overlap" : "PASS — all chapters at or below 10% avg overlap"}`);
}

main();
