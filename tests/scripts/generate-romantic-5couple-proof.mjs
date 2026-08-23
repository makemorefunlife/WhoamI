import fs from "node:fs";
import { buildCanonicalRomanticV4Report } from "../../lib/relationship/romantic/prototypeV4/buildCanonicalRomanticV4Report.ts";

function makeProfile(overrides) {
  const secondaryBase = { stimulation: 50, self_control: 50, practicality: 50, structure: 50, empathy: 50, conflict_style: 50, resilience: 50, recognition: 50, energy_style: 50, thinking_style: 50, decision_style: 50 };
  return {
    profile_type: "current_self",
    primary_axes: { autonomy: 50, connection: 50, stability: 50, growth: 50, structure: 50, adaptability: 50 },
    secondary_axes: { ...secondaryBase, ...overrides },
    personalization: { primary_concern: null },
    meta: { survey_version: "v2", completed_at: new Date().toISOString(), completion_time_seconds: null },
  };
}

const PAIRS = [
  { label: "Sera x 동글", pairSajuInput: { mode: "dev_fixture", birthA: null, birthB: null, nameA: "Sera", nameB: "동글" },
    profileA: makeProfile({ self_control: 70, recognition: 75, empathy: 65, conflict_style: 45 }),
    profileB: makeProfile({ structure: 75, self_control: 65, empathy: 45, conflict_style: 50 }) },
  { label: "지민 x 정우", pairSajuInput: { mode: "real", birthA: { birthDate: "1993-04-12", birthTime: "07:30" }, birthB: { birthDate: "1991-11-02", birthTime: "23:10" }, nameA: "지민", nameB: "정우" },
    profileA: makeProfile({ empathy: 75, recognition: 70, conflict_style: 35, structure: 40 }),
    profileB: makeProfile({ empathy: 35, structure: 75, conflict_style: 70, self_control: 65 }) },
  { label: "하나 x 두리", pairSajuInput: { mode: "real", birthA: { birthDate: "1996-06-20", birthTime: "14:00" }, birthB: { birthDate: "1995-02-15", birthTime: "09:45" }, nameA: "하나", nameB: "두리" },
    profileA: makeProfile({ conflict_style: 30, recognition: 65 }),
    profileB: makeProfile({ conflict_style: 32, recognition: 68 }) },
  { label: "다은 x 시우", pairSajuInput: { mode: "real", birthA: { birthDate: "1998-03-03", birthTime: "05:15" }, birthB: { birthDate: "1997-12-19", birthTime: "20:40" }, nameA: "다은", nameB: "시우" },
    profileA: makeProfile({ conflict_style: 20, self_control: 70, empathy: 60 }),
    profileB: makeProfile({ conflict_style: 22, self_control: 65, empathy: 55 }) },
  { label: "예린 x 도현", pairSajuInput: { mode: "real", birthA: { birthDate: "1988-08-08", birthTime: "12:00" }, birthB: { birthDate: "1994-05-30", birthTime: "01:30" }, nameA: "예린", nameB: "도현" },
    profileA: makeProfile({ structure: 85, stimulation: 20, practicality: 75 }),
    profileB: makeProfile({ structure: 20, stimulation: 85, practicality: 30 }) },
];

function block(section, id) {
  return section?.blocks.find((b) => b.blockId === id)?.body ?? "(없음/N/A)";
}

let out = "";
for (const pair of PAIRS) {
  const report = buildCanonicalRomanticV4Report("ko-KR", 2026, {
    pairSajuInput: pair.pairSajuInput,
    surveyInput: { mode: "real", profileA: pair.profileA, profileB: pair.profileB },
  });
  const c1 = report.sections.find((s) => s.chapterId === "c1_hero");
  const c2 = report.sections.find((s) => s.chapterId === "c2_attraction");
  const c3 = report.sections.find((s) => s.chapterId === "c3_dynamics");
  const c4 = report.sections.find((s) => s.chapterId === "c4_conflict");
  const c5 = report.sections.find((s) => s.chapterId === "c5_misunderstanding");
  const c7 = report.sections.find((s) => s.chapterId === "c7_repair");
  const c8 = report.sections.find((s) => s.chapterId === "c8_strength_vulnerability");
  const c12 = report.sections.find((s) => s.chapterId === "c12_choice");

  out += `\n${"=".repeat(80)}\n${pair.label}\n${"=".repeat(80)}\n`;
  out += `\n[HERO]\n${block(c1, "def.core")}\n${block(c1, "def.bond")}\n`;
  out += `\n[CH01 PRIVATE]\n${block(c3, "face.private")}\n`;
  out += `\n[CH01 RESPONSIBILITY]\n${block(c3, "face.responsibility")}\n`;
  out += `\n[CH01 STRESS]\n${block(c3, "face.stress")}\n`;
  out += `\n[CH02 ATTRACTION A->B]\n${block(c2, "attr.a")}\n`;
  out += `\n[CH02 ATTRACTION B->A]\n${block(c2, "attr.b")}\n`;
  out += `\n[CH02 SHARED ATTRACTION]\n${block(c2, "attr.unique")}\n`;
  out += `\n[CH03 CONFLICT]\n${block(c4, "loop.trigger")}\n${block(c4, "loop.steps")}\n`;
  out += `\n[CH05 MISREAD A->B]\n${block(c5, "misread.a_observes_b")}\n`;
  out += `\n[CH05 MISREAD B->A]\n${block(c5, "misread.b_observes_a")}\n`;
  out += `\n[CH06 REPAIR]\n${block(c7, "repair.sequence")}\n`;
  out += `\n[CH08 PAIR STRENGTH]\n${block(c8, "shared.strength")}\n`;
  out += `\n[CH08 SHARED VULNERABILITY]\n${block(c8, "shared.vulnerability")}\n`;
  out += `\n[CH10 CLOSING]\n${report.storyPlan.closing?.presentPossibility ?? "(없음)"}\n`;
}

fs.writeFileSync("tests/scripts/output/romantic-5couple-proof.txt", out, "utf-8");
console.log(out);
console.log(`\n\nTotal length: ${out.length} chars`);
